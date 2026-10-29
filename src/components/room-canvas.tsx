"use client";

import { useEffect, useRef, useState } from "react";
import { preload as preloadResource } from "react-dom";
import Image from "next/image";
import type { RoomScene, Surface } from "@/lib/rooms";
import {
  SURFACES,
  SceneCancelled,
  cacheScene,
  cachedScene,
  prepareScene,
  renderScene,
  sceneKey,
  type PreparedScene,
} from "@/lib/room-render";

/**
 * Viewports this narrow (phones) get each room's 800 px set instead of the full-size
 * photo. The canvas there is at most about 450 CSS px wide, so 800 px still covers a
 * 2x screen at nearly full sharpness, for under half the bytes and pixel work. The
 * same query picks the <picture> source and the canvas's asset set, so a phone never
 * downloads both photos.
 */
const SMALL_MEDIA = "(max-width: 480px)";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RoomCanvasProps {
  room: RoomScene;
  colors: Record<Surface, string>;
  /** Called with the surface under the pointer; omit for a view-only preview */
  onSelectSurface?: (surface: Surface) => void;
  /** Preload the room photo at high priority (it is the page's main image) */
  preload?: boolean;
  /** Alt text for the room photo */
  alt?: string;
  /** Render at most this many pixels wide (default: the photo's full width) */
  maxWidth?: number;
  /** Don't load masks or process the scene until the room is near the viewport */
  deferUntilVisible?: boolean;
  /** next/image sizes hint for the room photo */
  sizes?: string;
}

/**
 * The room photo with paint applied. The plain photo shows until the scene's masks
 * are loaded, then a canvas with the painted room is laid over it. Clicking the room
 * selects whichever surface is under the pointer.
 */
export function RoomCanvas({
  room,
  colors,
  onSelectSurface,
  preload,
  alt,
  maxWidth = Infinity,
  deferUntilVisible = false,
  sizes = "(max-width: 768px) 100vw, 900px",
}: RoomCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(!deferUntilVisible);
  const [scene, setScene] = useState<{ id: string; data: PreparedScene } | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const ready = scene?.id === room.id;
  const failed = failedId === room.id;

  useEffect(() => {
    if (visible || !wrapRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, [visible]);

  // Small embeds always use the 800 px set; the full-width visualizer uses it on phones.
  const smallOnly = maxWidth <= room.small.width;
  const photo = smallOnly ? room.small : room;

  useEffect(() => {
    if (!visible) return;
    const assets = smallOnly || window.matchMedia(SMALL_MEDIA).matches ? room.small : room;
    const key = sceneKey(assets, maxWidth);
    let cancelled = false;
    const hit = cachedScene(key);
    const work = hit ? Promise.resolve(hit) : prepareScene(assets, maxWidth, () => cancelled);
    work
      .then((data) => {
        if (!hit) cacheScene(key, data);
        if (!cancelled) setScene({ id: room.id, data });
      })
      .catch((err) => {
        if (!cancelled && !(err instanceof SceneCancelled)) setFailedId(room.id);
      });
    return () => {
      cancelled = true;
    };
  }, [room, visible, maxWidth, smallOnly]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!ready || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const out = ctx.createImageData(scene.data.width, scene.data.height);
    renderScene(scene.data, colors, out);
    ctx.putImageData(out, 0, 0);
  }, [ready, scene, colors]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ready || !onSelectSurface) return;
    const { pixels, cover, width, height } = scene.data;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * height);
    const p = y * width + x;
    // Binary search the sorted covered-pixel list.
    let lo = 0;
    let hi = pixels.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (pixels[mid] === p) {
        let best: Surface | null = null;
        let bestCover = 0;
        for (const s of SURFACES) {
          const c = cover[s]?.[mid] ?? 0;
          if (c > bestCover) {
            best = s;
            bestCover = c;
          }
        }
        if (best) onSelectSurface(best);
        return;
      }
      if (pixels[mid] < p) lo = mid + 1;
      else hi = mid - 1;
    }
  };

  if (preload) {
    // next/image's own preload has no media attribute, so on a phone it would fetch
    // the full photo as well as the <picture> source. One preload per set instead.
    if (smallOnly) {
      preloadResource(room.small.image, { as: "image", fetchPriority: "high" });
    } else {
      preloadResource(room.small.image, { as: "image", fetchPriority: "high", media: SMALL_MEDIA });
      preloadResource(room.image, { as: "image", fetchPriority: "high", media: `not all and ${SMALL_MEDIA}` });
    }
  }

  return (
    <div ref={wrapRef} className="relative block w-full overflow-hidden">
      {/* Files under /rooms are loaded directly, never through /_next/image: the canvas
          reads their exact pixels, and the masks must not be resampled or recompressed. */}
      <picture className="block">
        {!smallOnly && (
          <source media={SMALL_MEDIA} srcSet={room.small.image} width={room.small.width} height={room.small.height} />
        )}
        <Image
          src={photo.image}
          alt={alt ?? `${room.name} with the selected paint colors`}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          className="block h-auto w-full"
          loading={preload ? "eager" : undefined}
          fetchPriority={preload ? "high" : undefined}
          unoptimized
        />
      </picture>
      <canvas
        ref={canvasRef}
        width={scene?.data.width ?? photo.width}
        height={scene?.data.height ?? photo.height}
        onClick={handleClick}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full ${onSelectSurface ? "cursor-pointer " : ""}${
          ready ? "opacity-100 transition-opacity duration-200" : "opacity-0"
        }`}
      />
      {failed && (
        <p className="absolute bottom-3 left-3 rounded-lg bg-surface/90 px-3 py-2 text-xs text-on-surface">
          The paint preview didn&apos;t load. Refresh the page to try again.
        </p>
      )}
    </div>
  );
}

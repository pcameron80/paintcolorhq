"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { RoomScene, Surface } from "@/lib/rooms";

// ---------------------------------------------------------------------------
// Color math
// ---------------------------------------------------------------------------
//
// A surface pixel is rendered as paint × shade, in linear light, where shade is the
// photo's brightness at that pixel relative to the surface's typical brightness. The
// photo's walls are plain off-white, so this puts the room's real light and shadow
// onto any paint color. Surface edges are then blended in sRGB, as browsers
// anti-alias: a linear-light blend turns a dark/light seam pixel pale.
// scripts/build-room-masks.py renders its previews with the same math.

const SURFACES: Surface[] = ["main", "accent", "trim", "window"];

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Linear [0, 1] → sRGB 0-255, sampled finely enough that banding never shows. */
const LUT_SIZE = 4096;
const LINEAR_TO_SRGB = new Uint8ClampedArray(LUT_SIZE + 1);
for (let i = 0; i <= LUT_SIZE; i++) {
  const c = i / LUT_SIZE;
  LINEAR_TO_SRGB[i] = Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));
}

function hexToLinear(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255)) as [number, number, number];
}

// ---------------------------------------------------------------------------
// Scene preparation (once per room)
// ---------------------------------------------------------------------------

interface PreparedScene {
  width: number;
  height: number;
  base: Uint8ClampedArray;
  /** Indices of pixels any surface covers; only these are recomputed per color */
  pixels: Uint32Array;
  /** Per covered pixel: denoised linear luminance (indexed like `pixels`) */
  lum: Float32Array;
  /** Per surface, per covered pixel: coverage 0-255 (indexed like `pixels`) */
  cover: Partial<Record<Surface, Uint8Array>>;
  /** Per surface: 1 / its typical (60th percentile) luminance */
  shadeScale: Partial<Record<Surface, number>>;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function pixelsOf(img: HTMLImageElement, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/** Median of 9 values (a 3×3 neighborhood). */
function median9(v: number[]): number {
  v.sort((a, b) => a - b);
  return v[4];
}

async function prepareScene(room: RoomScene): Promise<PreparedScene> {
  const { width: w, height: h } = room;
  const surfaces = SURFACES.filter((s) => room.masks[s]);
  const [baseImg, ...maskImgs] = await Promise.all([
    loadImage(room.image),
    ...surfaces.map((s) => loadImage(room.masks[s]!)),
  ]);
  const base = pixelsOf(baseImg, w, h);
  const maskData = maskImgs.map((m) => pixelsOf(m, w, h));

  // Covered pixels: any surface above zero.
  const covered: number[] = [];
  for (let p = 0; p < w * h; p++) {
    for (const m of maskData) {
      if (m[p * 4] > 0) {
        covered.push(p);
        break;
      }
    }
  }
  const pixels = Uint32Array.from(covered);

  // Linear luminance of the whole photo, then a 3×3 median at covered pixels only:
  // it strips pixel noise (which dark paint would amplify into speckle) but keeps
  // real light and shadow edges.
  const fullLum = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    fullLum[p] =
      0.2126 * srgbToLinear(base[i] / 255) +
      0.7152 * srgbToLinear(base[i + 1] / 255) +
      0.0722 * srgbToLinear(base[i + 2] / 255);
  }
  const lum = new Float32Array(pixels.length);
  const win: number[] = new Array(9);
  for (let k = 0; k < pixels.length; k++) {
    const p = pixels[k];
    const x = p % w;
    const y = (p - x) / w;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = Math.min(h - 1, Math.max(0, y + dy));
      for (let dx = -1; dx <= 1; dx++) {
        const xx = Math.min(w - 1, Math.max(0, x + dx));
        win[n++] = fullLum[yy * w + xx];
      }
    }
    lum[k] = median9(win);
  }

  // Coverage per surface, and each surface's typical brightness from a histogram.
  const cover: PreparedScene["cover"] = {};
  const shadeScale: PreparedScene["shadeScale"] = {};
  surfaces.forEach((s, si) => {
    const m = maskData[si];
    const arr = new Uint8Array(pixels.length);
    const hist = new Uint32Array(1024);
    let count = 0;
    for (let k = 0; k < pixels.length; k++) {
      const a = m[pixels[k] * 4];
      arr[k] = a;
      if (a > 127) {
        hist[Math.min(1023, Math.floor(lum[k] * 1024))]++;
        count++;
      }
    }
    cover[s] = arr;
    let acc = 0;
    let bin = 0;
    while (bin < 1023 && acc + hist[bin] < count * 0.6) acc += hist[bin++];
    shadeScale[s] = 1 / Math.max((bin + 0.5) / 1024, 1e-3);
  });

  return { width: w, height: h, base, pixels, lum, cover, shadeScale };
}

function renderScene(scene: PreparedScene, colors: Record<Surface, string>, out: ImageData) {
  const { base, pixels, lum, cover, shadeScale } = scene;
  const data = out.data;
  data.set(base);
  const active = SURFACES.filter((s) => cover[s]).map((s) => ({
    cover: cover[s]!,
    rgb: hexToLinear(colors[s]),
    scale: shadeScale[s]!,
  }));
  for (let k = 0; k < pixels.length; k++) {
    const i = pixels[k] * 4;
    let r = base[i];
    let g = base[i + 1];
    let b = base[i + 2];
    for (const s of active) {
      const c = s.cover[k];
      if (c === 0) continue;
      const a = c / 255;
      const shade = lum[k] * s.scale * LUT_SIZE;
      const pr = LINEAR_TO_SRGB[Math.min(LUT_SIZE, (s.rgb[0] * shade) | 0)];
      const pg = LINEAR_TO_SRGB[Math.min(LUT_SIZE, (s.rgb[1] * shade) | 0)];
      const pb = LINEAR_TO_SRGB[Math.min(LUT_SIZE, (s.rgb[2] * shade) | 0)];
      r += (pr - r) * a;
      g += (pg - g) * a;
      b += (pb - b) * a;
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RoomCanvasProps {
  room: RoomScene;
  colors: Record<Surface, string>;
  onSelectSurface: (surface: Surface) => void;
  priority?: boolean;
}

/**
 * The room photo with paint applied. The plain photo shows until the scene's masks
 * are loaded, then a canvas with the painted room is laid over it. Clicking the room
 * selects whichever surface is under the pointer.
 */
export function RoomCanvas({ room, colors, onSelectSurface, priority }: RoomCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<{ id: string; data: PreparedScene } | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const ready = scene?.id === room.id;
  const failed = failedId === room.id;

  useEffect(() => {
    let cancelled = false;
    prepareScene(room)
      .then((data) => {
        if (!cancelled) setScene({ id: room.id, data });
      })
      .catch(() => {
        if (!cancelled) setFailedId(room.id);
      });
    return () => {
      cancelled = true;
    };
  }, [room]);

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
    if (!ready) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * room.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * room.height);
    const p = y * room.width + x;
    const { pixels, cover } = scene.data;
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

  return (
    <div className="relative block w-full overflow-hidden">
      <Image
        src={room.image}
        alt={`${room.name} with the selected paint colors`}
        width={room.width}
        height={room.height}
        sizes="(max-width: 768px) 100vw, 900px"
        className="block h-auto w-full"
        priority={priority}
        unoptimized
      />
      <canvas
        ref={canvasRef}
        width={room.width}
        height={room.height}
        onClick={handleClick}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full cursor-pointer ${
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

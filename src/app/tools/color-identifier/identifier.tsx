"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { trackEvent, trackToolEngagement } from "@/lib/analytics";
import { closenessLabel } from "@/lib/closeness";

interface ColorMatch {
  id: string;
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber: string | null;
  deltaE: number;
}

// Plain-language closeness — site convention: never show the raw Delta E number
// in the UI (same thresholds as the compare tool and embed widget).
function closeness(deltaE: number): string {
  return closenessLabel(deltaE);
}

type Stage = "upload" | "pick" | "results";

// Side of the square patch sampled around a click, in canvas pixels. One pixel
// on a phone photo is mostly sensor noise and JPEG artifacts, so neighboring
// clicks landed on different paints. The per-channel median of a 7x7 patch
// ignores stray pixels and returns the same paint for the same spot.
const PATCH_SIZE = 7;

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Per-channel median color of a PATCH_SIZE square centered on (x, y), clamped to the canvas. */
function samplePatch(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
): string {
  const w = Math.max(1, Math.min(PATCH_SIZE, canvasWidth));
  const h = Math.max(1, Math.min(PATCH_SIZE, canvasHeight));
  const half = Math.floor(PATCH_SIZE / 2);
  const left = Math.min(Math.max(0, x - half), Math.max(0, canvasWidth - w));
  const top = Math.min(Math.max(0, y - half), Math.max(0, canvasHeight - h));
  const data = ctx.getImageData(left, top, w, h).data;
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    r.push(data[i]);
    g.push(data[i + 1]);
    b.push(data[i + 2]);
  }
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(medianOf(r))}${toHex(medianOf(g))}${toHex(medianOf(b))}`;
}

function deviceType(): string {
  if (typeof window === "undefined" || !window.matchMedia) return "unknown";
  return window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop";
}

export function ColorIdentifier() {
  const [stage, setStage] = useState<Stage>("upload");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [matches, setMatches] = useState<ColorMatch[]>([]);
  // Ready-to-render Samplize sample links, keyed by color id — only for matches
  // with a crawl-confirmed live product page (never deep-link to a 404).
  const [sampleLinks, setSampleLinks] = useState<Record<string, { url: string; affiliate: boolean }>>({});
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    trackToolEngagement("color-identifier", "open");
  }, []);

  const handleFile = useCallback((file: File) => {
    // GA4 only (not tool_use, not a Plausible goal): measures how many
    // visitors get a photo in, split by device, so the mobile drop-off between
    // upload and pick is visible.
    trackEvent("identifier_upload", { device: deviceType() });
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setStage("pick");
      setPickedColor(null);
      setMatches([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleImageLoad = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Scale canvas to fit while preserving aspect ratio
    const maxW = canvas.parentElement?.clientWidth ?? 800;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || canvas.width === 0 || canvas.height === 0) return;
      const clamp = (n: number, max: number) => Math.min(Math.max(0, n), max - 1);
      const x = clamp(
        Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width),
        canvas.width,
      );
      const y = clamp(
        Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height),
        canvas.height,
      );

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const hex = samplePatch(ctx, canvas.width, canvas.height, x, y);

      setPickedColor(hex);
      setLoading(true);
      trackToolEngagement("color-identifier", "complete", hex);

      try {
        const res = await fetch(
          `/api/color-match?hex=${encodeURIComponent(hex)}`,
        );
        const data = await res.json();
        const found: ColorMatch[] = data.matches ?? [];
        setMatches(found);
        setStage("results");

        // Best-effort: check which matches have a live Samplize sample page so
        // the results can offer the "order a sample" next step. Never blocks or
        // breaks results — no links is a fine outcome.
        setSampleLinks({});
        const ids = found.map((m) => m.id).slice(0, 10);
        if (ids.length > 0) {
          try {
            const check = await fetch(
              `/api/samplize-check?ids=${ids.join(",")}&sid=color-identifier`,
            );
            const payload = await check.json();
            setSampleLinks(payload.links ?? {});
          } catch {
            // enhancement only
          }
        }
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const resetToUpload = () => {
    setStage("upload");
    setImageSrc(null);
    setPickedColor(null);
    setMatches([]);
  };

  const resetToPick = () => {
    setStage("pick");
    setPickedColor(null);
    setMatches([]);
    // Redraw the image on canvas
    setTimeout(() => {
      handleImageLoad();
    }, 0);
  };

  return (
    <div className="mt-8">
      {/* Upload Stage */}
      {stage === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50/30"
        >
          <svg
            className="mb-4 h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Drop an image here or choose a photo
          </p>
          <p className="mb-4 text-xs text-gray-500">
            JPG, PNG, or any image format
          </p>
          {/* No capture attribute: it forces the camera on phones and hides
              the photo library, where most room photos already are. */}
          <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600">
            Choose Photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                // Allow choosing the same photo again after "Upload different photo".
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {/* Pick Stage */}
      {stage === "pick" && imageSrc && (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            Click or tap a spot on the image to sample its color.
          </p>
          {/* Hidden image element for loading */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt=""
            className="hidden"
            onLoad={handleImageLoad}
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full max-w-3xl cursor-crosshair rounded-lg border border-gray-200"
          />
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Finding matches...
            </div>
          )}
          <button
            onClick={resetToUpload}
            className="mt-4 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            &larr; Upload different photo
          </button>
        </div>
      )}

      {/* Results Stage */}
      {stage === "results" && pickedColor && (
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-lg border border-gray-200"
                style={{ backgroundColor: pickedColor }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Sampled Color
                </p>
                <p className="font-mono text-sm text-gray-600">
                  {pickedColor.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetToPick}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Pick another spot
              </button>
              <button
                onClick={resetToUpload}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Upload different photo
              </button>
            </div>
          </div>

          {matches.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => {
                const sample = sampleLinks[match.id];
                return (
                  <div
                    key={match.id}
                    className="flex flex-col rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                  >
                    <Link
                      href={`/colors/${match.brandSlug}/${match.colorSlug}`}
                      className="flex flex-1 items-center gap-4 p-4"
                    >
                      <div
                        className="h-12 w-12 shrink-0 rounded-lg border border-gray-200"
                        style={{ backgroundColor: match.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {match.name}
                        </p>
                        <p className="text-sm text-gray-500">{match.brandName}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {match.hex.toUpperCase()} &middot; {closeness(match.deltaE)}
                        </p>
                      </div>
                    </Link>
                    {sample && (
                      <a
                        href={sample.url}
                        target="_blank"
                        rel={`${sample.affiliate ? "sponsored " : ""}nofollow noopener noreferrer`}
                        className="border-t border-gray-100 px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50/50"
                      >
                        Order a peel-and-stick sample →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No close paint matches found for this color.
            </p>
          )}
          {matches.length > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              Want one option from every brand?{" "}
              <Link
                href={`/tools/hex-to-paint-color?hex=${pickedColor.replace("#", "")}`}
                className="font-semibold text-blue-700 hover:underline"
              >
                See the closest current color in each brand for {pickedColor.toUpperCase()}
              </Link>
            </p>
          )}
          {matches.length > 0 && Object.values(sampleLinks).some((l) => l.affiliate) && (
            <p className="mt-4 text-xs text-gray-400">
              Sample links are affiliate links. If you buy through them, Paint
              Color HQ may earn a small commission at no extra cost to you.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

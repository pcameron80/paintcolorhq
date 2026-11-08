"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { trackEvent, trackToolEngagement } from "@/lib/analytics";
import { closenessLabel } from "@/lib/closeness";
import { BIG_THREE_BRANDS, bigThreeRows } from "@/lib/best-per-brand";
import { applyWhiteGain, whiteGainFromReference, type Gain } from "@/lib/white-reference";
import { RetiredChip } from "@/components/retired-chip";
import type { ColorAvailability } from "@/lib/types";

interface ColorMatch {
  id: string;
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber: string | null;
  deltaE: number;
  availability?: ColorAvailability;
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

function normalizeHex(input: string): string | null {
  const v = input.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : null;
}

const WHITE_REJECTED: Record<"invalid" | "too-dark" | "too-colorful", string> = {
  invalid: "That spot could not be read. Try another white spot.",
  "too-dark": "That spot is too dark to use as white. Try a brighter white surface.",
  "too-colorful": "That spot has too much color to be white. Try trim, a ceiling or a sheet of paper.",
};

export function ColorIdentifier() {
  const [stage, setStage] = useState<Stage>("upload");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  // The photo's own pixel when a white reference corrected it, else null.
  const [rawSample, setRawSample] = useState<string | null>(null);
  const [matches, setMatches] = useState<ColorMatch[]>([]);
  const [bestPerBrand, setBestPerBrand] = useState<ColorMatch[]>([]);
  // Ready-to-render Samplize sample links, keyed by color id — only for matches
  // with a crawl-confirmed live product page (never deep-link to a 404).
  const [sampleLinks, setSampleLinks] = useState<Record<string, { url: string; affiliate: boolean }>>({});
  const [loading, setLoading] = useState(false);
  const [hexText, setHexText] = useState("");
  const [hexError, setHexError] = useState(false);
  // Optional white reference: per-channel gain, and whether the next click sets it.
  const [whiteGain, setWhiteGain] = useState<Gain | null>(null);
  const [pickingWhite, setPickingWhite] = useState(false);
  const [whiteMessage, setWhiteMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  // Ignore a slow response once a newer lookup has started.
  const lookupSeq = useRef(0);

  useEffect(() => {
    trackToolEngagement("color-identifier", "open");
  }, []);

  const clearWhiteReference = useCallback(() => {
    setWhiteGain(null);
    setPickingWhite(false);
    setWhiteMessage(null);
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
      setRawSample(null);
      setMatches([]);
      setBestPerBrand([]);
      // A white reference belongs to one photo's lighting.
      clearWhiteReference();
    };
    reader.readAsDataURL(file);
  }, [clearWhiteReference]);

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

  /** Fetch matches for a hex and move to the results stage. */
  const lookup = useCallback(async (hex: string) => {
    const seq = ++lookupSeq.current;
    setPickedColor(hex);
    setLoading(true);
    trackToolEngagement("color-identifier", "complete", hex);

    try {
      const res = await fetch(
        `/api/color-match?hex=${encodeURIComponent(hex)}&perBrand=1`,
      );
      const data = await res.json();
      if (seq !== lookupSeq.current) return;
      const found: ColorMatch[] = data.matches ?? [];
      setMatches(found);
      setBestPerBrand(data.bestPerBrand ?? []);
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
          if (seq === lookupSeq.current) setSampleLinks(payload.links ?? {});
        } catch {
          // enhancement only
        }
      }
    } catch {
      if (seq === lookupSeq.current) {
        setMatches([]);
        setBestPerBrand([]);
      }
    } finally {
      if (seq === lookupSeq.current) setLoading(false);
    }
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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

      const sample = samplePatch(ctx, canvas.width, canvas.height, x, y);

      if (pickingWhite) {
        setPickingWhite(false);
        const result = whiteGainFromReference(sample);
        if (result.ok) {
          setWhiteGain(result.gain);
          setWhiteMessage(null);
          trackEvent("identifier_white_reference", { device: deviceType() });
        } else {
          setWhiteGain(null);
          setWhiteMessage(WHITE_REJECTED[result.reason]);
        }
        return;
      }

      if (whiteGain) {
        setRawSample(sample);
        void lookup(applyWhiteGain(sample, whiteGain));
      } else {
        setRawSample(null);
        void lookup(sample);
      }
    },
    [pickingWhite, whiteGain, lookup],
  );

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hex = normalizeHex(hexText);
    if (!hex) {
      setHexError(true);
      return;
    }
    setHexError(false);
    setImageSrc(null);
    setRawSample(null);
    clearWhiteReference();
    // GA4 only: how many visitors use the hex field instead of a photo.
    trackEvent("identifier_hex_lookup", { device: deviceType() });
    void lookup(hex);
  };

  const resetToUpload = () => {
    lookupSeq.current++;
    setLoading(false);
    setStage("upload");
    setImageSrc(null);
    setPickedColor(null);
    setRawSample(null);
    setMatches([]);
    setBestPerBrand([]);
    clearWhiteReference();
  };

  const resetToPick = () => {
    setStage("pick");
    setPickedColor(null);
    setRawSample(null);
    setMatches([]);
    setBestPerBrand([]);
    // Redraw the image on canvas
    setTimeout(() => {
      handleImageLoad();
    }, 0);
  };

  const brandRows = bigThreeRows(bestPerBrand);

  return (
    <div className="mt-8">
      {/* Upload Stage */}
      {stage === "upload" && (
        <div>
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

          {/* Hex input: for a color already known as a code (from a design
              file, a website or a color picker app), no photo needed. */}
          <form
            onSubmit={handleHexSubmit}
            className="mt-4 flex flex-wrap items-center gap-2"
            noValidate
          >
            <label htmlFor="identifier-hex" className="text-sm font-medium text-gray-700">
              Or enter a hex code
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 bg-white px-2">
              <span className="text-sm text-gray-400">#</span>
              <input
                id="identifier-hex"
                type="text"
                value={hexText}
                onChange={(e) => {
                  setHexText(e.target.value);
                  setHexError(false);
                }}
                maxLength={7}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                placeholder="D6D0C4"
                aria-invalid={hexError}
                aria-describedby={hexError ? "identifier-hex-error" : undefined}
                className="w-24 bg-transparent px-1 py-2 font-mono text-base uppercase text-gray-900 outline-none sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Finding matches..." : "Find matches"}
            </button>
            {hexError && (
              <p id="identifier-hex-error" className="w-full text-xs text-rose-600">
                Enter six hex digits, like D6D0C4.
              </p>
            )}
          </form>
        </div>
      )}

      {/* Pick Stage */}
      {stage === "pick" && imageSrc && (
        <div>
          <p className="mb-4 text-sm text-gray-600" aria-live="polite">
            {pickingWhite
              ? "Click or tap something that is white in real life, like trim, a ceiling or a sheet of paper."
              : "Click or tap a spot on the image to sample its color."}
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
            className={`w-full max-w-3xl cursor-crosshair rounded-lg border ${
              pickingWhite ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
            }`}
          />

          {/* Optional white reference */}
          <div className="mt-3 max-w-3xl rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            {whiteGain ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="min-w-0 flex-1">
                  White reference set. Samples are corrected for the color cast
                  in this photo. This is an approximation: it does not fix a
                  photo that is too dark or too bright.
                </p>
                <button
                  type="button"
                  onClick={clearWhiteReference}
                  className="font-medium text-gray-700 underline hover:text-gray-900"
                >
                  Clear white reference
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="min-w-0 flex-1">
                  Optional: click something white first, and the tool removes
                  the yellow or blue cast your camera and bulbs add. An
                  approximation, not a measurement.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPickingWhite((v) => !v);
                    setWhiteMessage(null);
                  }}
                  aria-pressed={pickingWhite}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 font-medium text-gray-700 hover:bg-gray-100"
                >
                  {pickingWhite ? "Cancel" : "Set a white reference"}
                </button>
              </div>
            )}
            {whiteMessage && <p className="mt-2 text-rose-600">{whiteMessage}</p>}
          </div>

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
                  {imageSrc ? "Sampled Color" : "Your Color"}
                </p>
                <p className="font-mono text-sm text-gray-600">
                  {pickedColor.toUpperCase()}
                </p>
                {rawSample && (
                  <p className="text-xs text-gray-500">
                    Corrected from {rawSample.toUpperCase()} with your white reference
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {imageSrc && (
                <button
                  onClick={resetToPick}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Pick another spot
                </button>
              )}
              <button
                onClick={resetToUpload}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {imageSrc ? "Upload different photo" : "Try another color or a photo"}
              </button>
            </div>
          </div>

          {/* Closest in each of the three biggest brands. The overall list
              below is often one or two catalogs deep, so a visitor shopping
              at Sherwin-Williams, Benjamin Moore or Behr may not see their
              brand in it. */}
          {brandRows.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">
                Closest in Sherwin-Williams, Benjamin Moore and Behr
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {brandRows.map((m) => (
                  <Link
                    key={m.brandSlug}
                    href={`/colors/${m.brandSlug}/${m.colorSlug}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
                  >
                    <div
                      className="h-12 w-12 shrink-0 rounded-lg border border-gray-200"
                      style={{ backgroundColor: m.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {BIG_THREE_BRANDS.find((b) => b.slug === m.brandSlug)?.name ?? m.brandName}
                      </p>
                      <p className="truncate font-medium text-gray-900">{m.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        <span>
                          {m.colorNumber ? `${m.colorNumber} · ` : ""}
                          {closeness(m.deltaE)}
                        </span>
                        <RetiredChip
                          availability={m.availability}
                          className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500"
                        />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {matches.length > 0 ? (
            <>
              {brandRows.length > 0 && (
                <h2 className="mb-3 text-sm font-semibold text-gray-900">
                  Closest across all brands
                </h2>
              )}
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
                          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                            <span>
                              {match.hex.toUpperCase()} &middot; {closeness(match.deltaE)}
                            </span>
                            <RetiredChip
                              availability={match.availability}
                              className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500"
                            />
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
            </>
          ) : (
            <p className="text-sm text-gray-500">
              No close paint matches found for this color.
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

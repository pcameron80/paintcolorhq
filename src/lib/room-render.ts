import type { RoomAssets, Surface } from "@/lib/rooms";

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

export const SURFACES: Surface[] = ["main", "accent", "trim", "window"];

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** sRGB 0-255 → linear [0, 1]: the same values srgbToLinear gives, without a pow per pixel. */
const SRGB_TO_LINEAR = new Float64Array(256);
for (let i = 0; i < 256; i++) SRGB_TO_LINEAR[i] = srgbToLinear(i / 255);

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

export interface PreparedScene {
  width: number;
  height: number;
  base: Uint8ClampedArray;
  /** Indices of pixels any surface covers, ascending; only these are recomputed per color */
  pixels: Uint32Array;
  /** Per covered pixel: denoised linear luminance (indexed like `pixels`) */
  lum: Float32Array;
  /** Per surface, per covered pixel: coverage 0-255 (indexed like `pixels`) */
  cover: Partial<Record<Surface, Uint8Array>>;
  /** Per surface: 1 / its typical (60th percentile) luminance */
  shadeScale: Partial<Record<Surface, number>>;
}

/** Thrown out of prepareScene when the caller no longer wants the scene. */
export class SceneCancelled extends Error {}

/**
 * Pixels per slice of work between yields to the main thread. A slice of the
 * median pass is about 10 ms on a laptop and 40 ms at 4x CPU throttle, so input
 * and paint stay responsive while a room prepares.
 */
const CHUNK = 100_000;

async function yieldToMain(isCancelled: () => boolean) {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (s?.yield) await s.yield();
  else await new Promise((r) => setTimeout(r, 0));
  if (isCancelled()) throw new SceneCancelled();
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new window.Image();
  img.src = src;
  try {
    // decode() decodes off the main thread, so drawImage below doesn't block on it.
    await img.decode();
  } catch {
    throw new Error(`Failed to load ${src}`);
  }
  return img;
}

function pixelsOf(img: HTMLImageElement, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * Load a room's photo and masks and precompute everything a repaint needs. The work
 * is split into slices that yield to the main thread; it stops with SceneCancelled
 * as soon as isCancelled() returns true.
 */
export async function prepareScene(
  room: RoomAssets,
  maxWidth: number,
  isCancelled: () => boolean = () => false,
): Promise<PreparedScene> {
  // Smaller embeds prepare a downscaled scene: a fraction of the pixels to process.
  const w = Math.min(room.width, maxWidth);
  const h = Math.round((room.height * w) / room.width);
  const n = w * h;
  const surfaces = SURFACES.filter((s) => room.masks[s]);
  const [baseImg, ...maskImgs] = await Promise.all([
    loadImage(room.image),
    ...surfaces.map((s) => loadImage(room.masks[s]!)),
  ]);
  if (isCancelled()) throw new SceneCancelled();
  const base = pixelsOf(baseImg, w, h);
  const maskData: Uint8ClampedArray[] = [];
  for (const m of maskImgs) {
    await yieldToMain(isCancelled);
    maskData.push(pixelsOf(m, w, h));
  }

  // Covered pixels: any surface above zero.
  const coveredBuf = new Uint32Array(n);
  let count = 0;
  for (let start = 0; start < n; start += CHUNK) {
    await yieldToMain(isCancelled);
    const end = Math.min(n, start + CHUNK);
    for (let p = start; p < end; p++) {
      const i = p * 4;
      for (let s = 0; s < maskData.length; s++) {
        if (maskData[s][i] > 0) {
          coveredBuf[count++] = p;
          break;
        }
      }
    }
  }
  const pixels = coveredBuf.slice(0, count);

  // Linear luminance of the whole photo, then a 3×3 median at covered pixels only:
  // it strips pixel noise (which dark paint would amplify into speckle) but keeps
  // real light and shadow edges.
  const fullLum = new Float32Array(n);
  for (let start = 0; start < n; start += CHUNK) {
    await yieldToMain(isCancelled);
    const end = Math.min(n, start + CHUNK);
    for (let p = start; p < end; p++) {
      const i = p * 4;
      fullLum[p] =
        0.2126 * SRGB_TO_LINEAR[base[i]] +
        0.7152 * SRGB_TO_LINEAR[base[i + 1]] +
        0.0722 * SRGB_TO_LINEAR[base[i + 2]];
    }
  }
  const lum = new Float32Array(count);
  const win = new Float32Array(9);
  for (let start = 0; start < count; start += CHUNK) {
    await yieldToMain(isCancelled);
    const end = Math.min(count, start + CHUNK);
    for (let k = start; k < end; k++) {
      const p = pixels[k];
      const x = p % w;
      const y = (p - x) / w;
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          win[m++] = fullLum[yy * w + xx];
        }
      }
      // Median of the 9 values: insertion sort, then the middle one.
      for (let a = 1; a < 9; a++) {
        const v = win[a];
        let b = a - 1;
        while (b >= 0 && win[b] > v) {
          win[b + 1] = win[b];
          b--;
        }
        win[b + 1] = v;
      }
      lum[k] = win[4];
    }
  }

  // Coverage per surface, and each surface's typical brightness from a histogram.
  const cover: PreparedScene["cover"] = {};
  const shadeScale: PreparedScene["shadeScale"] = {};
  for (let si = 0; si < surfaces.length; si++) {
    await yieldToMain(isCancelled);
    const s = surfaces[si];
    const m = maskData[si];
    const arr = new Uint8Array(count);
    const hist = new Uint32Array(1024);
    let inside = 0;
    for (let k = 0; k < count; k++) {
      const a = m[pixels[k] * 4];
      arr[k] = a;
      if (a > 127) {
        hist[Math.min(1023, Math.floor(lum[k] * 1024))]++;
        inside++;
      }
    }
    cover[s] = arr;
    let acc = 0;
    let bin = 0;
    while (bin < 1023 && acc + hist[bin] < inside * 0.6) acc += hist[bin++];
    shadeScale[s] = 1 / Math.max((bin + 0.5) / 1024, 1e-3);
  }

  return { width: w, height: h, base, pixels, lum, cover, shadeScale };
}

// ---------------------------------------------------------------------------
// Painting (every color change)
// ---------------------------------------------------------------------------

export function renderScene(scene: PreparedScene, colors: Record<Surface, string>, out: ImageData) {
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
// Prepared-scene cache
// ---------------------------------------------------------------------------

/** A few rooms' worth (about 7 MB each at full size), so switching back is instant. */
const CACHE_LIMIT = 4;
const cache = new Map<string, PreparedScene>();

export function sceneKey(room: RoomAssets, maxWidth: number): string {
  return `${room.image}@${Math.min(room.width, maxWidth)}`;
}

export function cachedScene(key: string): PreparedScene | undefined {
  const hit = cache.get(key);
  if (hit) {
    // Refresh its place as most recently used.
    cache.delete(key);
    cache.set(key, hit);
  }
  return hit;
}

export function cacheScene(key: string, scene: PreparedScene) {
  cache.delete(key);
  cache.set(key, scene);
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
}

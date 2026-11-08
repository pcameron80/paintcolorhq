import type { RoomAssets, Surface } from "@/lib/rooms";

// ---------------------------------------------------------------------------
// Color math
// ---------------------------------------------------------------------------
//
// A surface pixel is rendered as paint × shade, in linear light, where shade is the
// photo's brightness at that pixel relative to the surface's typical brightness. The
// photo's walls are plain off-white, so this puts the room's real light and shadow
// onto any paint color. Shade is anchored at 1 on the surface's 60th-percentile
// brightness, so the brighter 40% would render lighter than the swatch; above 1 the
// extra lightness is rolled off in L* so no lit pixel reads more than
// HIGHLIGHT_LSTAR lighter than the paint chip. Shadows (shade below 1) are untouched.
// The photos' walls are off-white, so their shading includes light bounced off the
// other light walls; a room painted dark loses most of that bounce. WALL_BOUNCE scales
// every surface's shade by how much light the painted walls reflect compared with the
// photo's walls.
// Surface edges are then blended in sRGB, as browsers anti-alias: a linear-light
// blend turns a dark/light seam pixel pale.
// scripts/build-room-masks.py renders its previews with the same math.

export const SURFACES: Surface[] = ["main", "accent", "trim", "window", "cabinets"];

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

/** Most L* a lit area may add to the paint color; the excess approaches it, never passes it. */
export const HIGHLIGHT_LSTAR = 2.75;

function lstar(y: number): number {
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (y * 24389) / 27;
}

function lstarToY(l: number): number {
  return l > 8 ? ((l + 16) / 116) ** 3 : (l * 27) / 24389;
}

/**
 * Share of a surface's light that bounced off the room's walls. Shade is multiplied by
 * (1 - WALL_BOUNCE) + WALL_BOUNCE * (painted wall reflectance / PHOTO_WALL_Y), with main
 * and accent weighted by their area.
 */
export const WALL_BOUNCE = 0.25;
/**
 * Reflectance (LRV / 100) of the photos' off-white walls: the generator asks for a very
 * light warm gray-white, about LRV 80. A fixed paint value, not the photo's measured
 * brightness, which also carries the room's exposure.
 */
const PHOTO_WALL_Y = 0.8;
const WALL_SURFACES: Surface[] = ["main", "accent"];

/** Shades above 1 map through a per-paint table covering 1 to HIGHLIGHT_MAX_SHADE. */
const HIGHLIGHT_MAX_SHADE = 4;
const HIGHLIGHT_STEPS = 1024;

/**
 * Highlight roll-off for one paint: entry i is the compressed shade for raw shade
 * 1 + i * (HIGHLIGHT_MAX_SHADE - 1) / HIGHLIGHT_STEPS. The L* a raw shade would add
 * over the paint, d, becomes HIGHLIGHT_LSTAR * (1 - e^(-d / HIGHLIGHT_LSTAR)): close to d
 * for a faint highlight, levelling off below the cap for a strong one.
 */
export function highlightTable(rgb: [number, number, number]): Float32Array {
  const y = luminance(rgb);
  const table = new Float32Array(HIGHLIGHT_STEPS + 1);
  const l0 = lstar(y);
  for (let i = 0; i <= HIGHLIGHT_STEPS; i++) {
    const raw = 1 + (i * (HIGHLIGHT_MAX_SHADE - 1)) / HIGHLIGHT_STEPS;
    if (y < 1e-6) {
      table[i] = raw;
      continue;
    }
    const d = lstar(Math.min(1, y * raw)) - l0;
    const dc = HIGHLIGHT_LSTAR * (1 - Math.exp(-d / HIGHLIGHT_LSTAR));
    table[i] = lstarToY(l0 + dc) / y;
  }
  return table;
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
  /** Per surface: pixels it covers at least half of */
  area: Partial<Record<Surface, number>>;
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
  const area: PreparedScene["area"] = {};
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
    area[s] = inside;
    let acc = 0;
    let bin = 0;
    while (bin < 1023 && acc + hist[bin] < inside * 0.6) acc += hist[bin++];
    shadeScale[s] = 1 / Math.max((bin + 0.5) / 1024, 1e-3);
  }

  return { width: w, height: h, base, pixels, lum, cover, shadeScale, area };
}

// ---------------------------------------------------------------------------
// Painting (every color change)
// ---------------------------------------------------------------------------

function luminance(rgb: [number, number, number]): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/** How much light the walls as painted bounce, relative to the photo's walls (1 = unchanged). */
function wallReflectance(scene: PreparedScene, colors: Partial<Record<Surface, string>>): number {
  let painted = 0;
  let total = 0;
  for (const s of WALL_SURFACES) {
    const a = scene.area[s];
    if (!a) continue;
    total += a;
    painted += a * (colors[s] ? luminance(hexToLinear(colors[s]!)) : PHOTO_WALL_Y);
  }
  return total > 0 ? painted / (total * PHOTO_WALL_Y) : 1;
}

/**
 * A surface with no color given keeps the photo, so callers that predate a surface render
 * as before. `bounce` defaults to WALL_BOUNCE; other values are for side-by-side comparisons.
 */
export function renderScene(
  scene: PreparedScene,
  colors: Partial<Record<Surface, string>>,
  out: ImageData,
  bounce = WALL_BOUNCE,
) {
  const { base, pixels, lum, cover, shadeScale } = scene;
  const data = out.data;
  data.set(base);
  const room = 1 - bounce + bounce * wallReflectance(scene, colors);
  const active = SURFACES.filter((s) => cover[s] && colors[s]).map((s) => {
    const rgb = hexToLinear(colors[s]!);
    return { cover: cover[s]!, rgb, scale: shadeScale[s]! * room, highlight: highlightTable(rgb) };
  });
  const toStep = HIGHLIGHT_STEPS / (HIGHLIGHT_MAX_SHADE - 1);
  for (let k = 0; k < pixels.length; k++) {
    const i = pixels[k] * 4;
    let r = base[i];
    let g = base[i + 1];
    let b = base[i + 2];
    for (const s of active) {
      const c = s.cover[k];
      if (c === 0) continue;
      const a = c / 255;
      let shade = lum[k] * s.scale;
      if (shade > 1) shade = s.highlight[Math.min(HIGHLIGHT_STEPS, ((shade - 1) * toStep) | 0)];
      shade *= LUT_SIZE;
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

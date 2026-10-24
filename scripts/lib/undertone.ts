/**
 * Undertone classification for the colors.undertone column. The single source
 * of truth for that column: populate-undertones.ts, apply-hex-corrections.ts
 * and the importers (import-brand-scan, import-behr-live, import-sw-api-colors,
 * import-valspar-api-colors) all call undertoneLabel(), so a re-run and a fresh
 * insert give a color the same label. The site only reads the stored label
 * (src/lib/undertone-utils.ts holds the allowed strings).
 *
 * Method: CIELAB chroma and hue angle.
 *   C* = sqrt(a*^2 + b*^2), h = atan2(b*, a*) in degrees, 0-360.
 *   C* below NEUTRAL_CHROMA is Neutral (BM Chantilly Lace is 2.66).
 *   Otherwise the hue angle picks the sector in SECTORS.
 *
 * The previous version gated on HSL saturation and needed a* AND b* past +/-5
 * or +/-8 before calling anything warm or cool. Most whites, creams and
 * greiges sit at a* near 0 and b* 4-9, so about half the catalog came out
 * Neutral, including SW Alabaster and BM White Dove, and navies with a* near 0
 * fell through to Neutral too.
 *
 * Calibrated against scripts/lib/undertone.test.ts. Change a threshold there
 * first, then here.
 */

import { hexToRgb, rgbToLab } from './color-math';

export type RawUndertone = 'golden' | 'pink' | 'green' | 'blue' | 'violet' | 'balanced';

/** Below this CIELAB chroma a color reads as having no undertone. */
export const NEUTRAL_CHROMA = 3.0;

/**
 * Hue-angle sectors, [from, to) in degrees. Pink wraps through 0.
 * Tuned from the starting sectors (golden 45-120, pink 330-45):
 * - Golden starts at 30, not 45. Colors named brick, tomato, coral and salmon
 *   have median hue 37-42 (orange-leaning reds, yellow undertone), while
 *   raspberry, burgundy, cranberry, wine and cherry sit at median 0-24. At 45,
 *   about 1,880 orange-reds the old classifier called golden would turn pink.
 * - Golden stops at 112, not 120: light grays at h 113-120 (BM Gray Owl,
 *   Oxford White, Stonington Gray) are a* < 0 greens that paint makers
 *   describe as cool, while BM Simply White (h 110) is a warm white.
 */
export const SECTORS: readonly { from: number; to: number; undertone: RawUndertone }[] = [
  { from: 30, to: 112, undertone: 'golden' },
  { from: 112, to: 200, undertone: 'green' },
  { from: 200, to: 290, undertone: 'blue' },
  { from: 290, to: 330, undertone: 'violet' },
  { from: 330, to: 360, undertone: 'pink' },
  { from: 0, to: 30, undertone: 'pink' },
];

/**
 * Manufacturer wording that the Lab math cannot see, keyed by
 * "<brand-slug>/<color-slug>". Add a color here only with a source.
 *
 * SW Repose Gray: Sherwin-Williams describes it as a cool gray. Its Lab
 * (a* -0.56, b* 4.86) lands in the golden sector; the only cool component is
 * the green-side a*, so it is filed as Cool (Green).
 */
export const UNDERTONE_OVERRIDES: Readonly<Record<string, RawUndertone>> = {
  'sherwin-williams/repose-gray-7015': 'green',
};

export function chromaHue(labA: number, labB: number): { chroma: number; hue: number } {
  const chroma = Math.sqrt(labA * labA + labB * labB);
  const hue = ((Math.atan2(labB, labA) * 180) / Math.PI + 360) % 360;
  return { chroma, hue };
}

/**
 * Raw undertone for a color. Lab comes from the row when present, otherwise it
 * is derived from hex. `key` ("<brand-slug>/<color-slug>") enables overrides.
 */
export function computeUndertone(
  hex: string,
  labA: number | null,
  labB: number | null,
  key?: string,
): RawUndertone {
  if (key && UNDERTONE_OVERRIDES[key]) return UNDERTONE_OVERRIDES[key];

  let a = labA;
  let b = labB;
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 'balanced';
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    a = lab.a;
    b = lab.b_val;
  }

  const { chroma, hue } = chromaHue(a, b);
  if (chroma < NEUTRAL_CHROMA) return 'balanced';
  for (const s of SECTORS) {
    if (hue >= s.from && hue < s.to) return s.undertone;
  }
  return 'balanced';
}

/** Raw undertone to stored label. Every value is one of UNDERTONE_LABELS. */
export const LABEL_MAP: Record<RawUndertone, string> = {
  golden: 'Warm (Golden)',
  pink: 'Warm (Pink)',
  blue: 'Cool (Blue)',
  green: 'Cool (Green)',
  violet: 'Cool (Violet)',
  balanced: 'Neutral',
};

/** Stored label for a color, e.g. "Warm (Golden)". */
export function undertoneLabel(
  hex: string,
  labA: number | null,
  labB: number | null,
  key?: string,
): string {
  return LABEL_MAP[computeUndertone(hex, labA, labB, key)];
}

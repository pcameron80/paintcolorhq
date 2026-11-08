/**
 * Per-row decision for the RAL hex correction (2026-11 data audit, finding
 * feed-ral-hex). All 213 RAL rows are the 2020 colornerd values, a median
 * 5.1 CIEDE2000 from RAL's own swatches.
 *
 * RAL Classic is defined by physical samples and their CIELAB values; the
 * swatch on ral-farben.de is a screen rendering a median 3.5 dE from that Lab.
 * So the swatch hex is taken only where it is the better value:
 *   effect     pearl, luminous or metallic: no sRGB hex represents them. Held.
 *   ok         stored hex is under 2 dE from the swatch. Left alone.
 *   hold-gamut the swatch is more than 1 dE farther from RAL's Lab than the
 *              stored hex is (saturated reds, oranges, greens near the sRGB
 *              edge, e.g. 8011: 0.8 dE stored vs 3.8 swatch). Held for review.
 *   apply      write the swatch hex, with LRV from RAL's published LRV, else
 *              Y from RAL's Lab, never from the screen hex.
 */
import { deltaE2000, hexToRgb, rgbToLab } from './color-utils';

export interface RalReference {
  code: string;
  name: string;
  siteHex: string;
  lab: { L: number; a: number; b: number } | null;
  publishedLrv: number | null;
  effect: boolean;
}

export type RalAction = 'apply' | 'ok' | 'hold-gamut' | 'effect';

export interface RalDecision {
  action: RalAction;
  dSite: number;
  dStoredLab: number | null;
  dSiteLab: number | null;
  /** LRV to write: published, else Y from RAL's Lab; null when neither exists. */
  lrv: number | null;
}

export const RAL_HEX_THRESHOLD = 2;
export const RAL_GAMUT_MARGIN = 1;

const labOf = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToLab(r, g, b);
};

/** CIE Y (0-100) from L*, the LRV a Lab value implies. */
export function yFromL(L: number): number {
  const fy = (L + 16) / 116;
  const y = fy > 6 / 29 ? fy ** 3 : (L / 903.3);
  return Math.round(y * 1000) / 10;
}

export function ralLrv(ref: RalReference): number | null {
  if (ref.publishedLrv != null) return ref.publishedLrv;
  if (ref.lab) return yFromL(ref.lab.L);
  return null;
}

export function decideRal(storedHex: string, ref: RalReference): RalDecision {
  const stored = labOf(storedHex);
  const site = labOf(ref.siteHex);
  const dSite = deltaE2000(stored, site);
  const dStoredLab = ref.lab ? deltaE2000(stored, ref.lab) : null;
  const dSiteLab = ref.lab ? deltaE2000(site, ref.lab) : null;
  const lrv = ralLrv(ref);
  const base = { dSite, dStoredLab, dSiteLab, lrv };
  if (ref.effect) return { action: 'effect', ...base };
  if (dSite < RAL_HEX_THRESHOLD) return { action: 'ok', ...base };
  if (dStoredLab !== null && dSiteLab !== null && dSiteLab > dStoredLab + RAL_GAMUT_MARGIN) {
    return { action: 'hold-gamut', ...base };
  }
  return { action: 'apply', ...base };
}

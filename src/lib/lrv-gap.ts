// When two colors' swatches are close but their LRVs are not.
//
// Closeness labels describe the swatches: CIEDE2000 on the stored CIELAB
// values (src/lib/closeness.ts). Brands also publish an LRV, and Benjamin
// Moore, Dunn-Edwards, Vista and Hirshfield's often publish one that is
// lighter or darker than their own swatch. The 2026-10-31 audit found that
// 9.2% of rank-1 "Nearly identical" pairs with a published LRV on both sides
// (7,220 of 78,412) leave that band when lightness comes from the LRVs, e.g.
// SW Iron Ore (LRV 5.6) and BM Notre Dame (LRV 7.6).
//
// The label stays, because it is true of the swatches. Surfaces that show it
// add one sentence naming the color the LRVs say is lighter.
//
// The test: recompute CIEDE2000 with L* from each LRV (CIE Y = LRV / 100) and
// a*, b* from the stored Lab. Each LRV is read at its most favorable value
// within its rounding (±0.5 for whole numbers, ±0.05 otherwise), so rounding
// alone never adds a note. A note is due when that score lands in a worse
// closeness tier than the score behind the label.

import { deltaE2000, type Lab } from "./color-utils";
import { closenessTier, type ClosenessTier } from "./closeness";

const TIERS: readonly ClosenessTier[] = ["nearly-identical", "very-similar", "visible-difference"];

/** CIE L* for a light reflectance value (0-100), which is CIE Y x 100. */
export function lrvToLstar(lrv: number): number {
  const y = lrv / 100;
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y;
}

/** The LRV as a number, or null when it is missing or impossible. Supabase returns numerics as strings. */
export function usableLrv(lrv: unknown): number | null {
  if (lrv == null || lrv === "") return null;
  const n = Number(lrv);
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : null;
}

function lstarRange(lrv: number): [number, number] {
  const p = Number.isInteger(lrv) ? 0.5 : 0.05;
  return [lrvToLstar(Math.max(lrv - p, 0)), lrvToLstar(Math.min(lrv + p, 100))];
}

export interface LrvGapInput {
  lab: Lab;
  lrv: unknown;
}

export interface LrvGap {
  /** Which input the LRVs say is lighter. */
  lighter: "a" | "b";
  lrvA: number;
  lrvB: number;
  /** CIEDE2000 with L* from the LRVs. */
  deltaE: number;
}

/**
 * The LRV gap behind a note, or null when the LRVs agree with the label.
 * `shownDeltaE` is the score behind the label the page prints.
 */
export function lrvLightnessGap(a: LrvGapInput, b: LrvGapInput, shownDeltaE: number): LrvGap | null {
  const lrvA = usableLrv(a.lrv);
  const lrvB = usableLrv(b.lrv);
  if (lrvA === null || lrvB === null || !Number.isFinite(shownDeltaE)) return null;
  const [aLo, aHi] = lstarRange(lrvA);
  const [bLo, bHi] = lstarRange(lrvB);
  // Overlapping ranges leave no lightness difference to report.
  if (aHi >= bLo && bHi >= aLo) return null;
  const [lA, lB] = aHi < bLo ? [aHi, bLo] : [aLo, bHi];
  const deltaE = deltaE2000({ L: lA, a: Number(a.lab.a), b: Number(a.lab.b) }, { L: lB, a: Number(b.lab.a), b: Number(b.lab.b) });
  if (!Number.isFinite(deltaE)) return null;
  if (TIERS.indexOf(closenessTier(deltaE)) <= TIERS.indexOf(closenessTier(shownDeltaE))) return null;
  return { lighter: lrvA > lrvB ? "a" : "b", lrvA, lrvB, deltaE };
}

export function formatLrv(lrv: number): string {
  return lrv.toFixed(1);
}

interface Named {
  name: string;
  brandName: string;
}

/**
 * The note, e.g. "Benjamin Moore Notre Dame (LRV 7.6) reflects more light than
 * Sherwin-Williams Iron Ore (LRV 5.6). That gap is bigger than the swatches
 * show, so the Benjamin Moore color may look lighter on the wall."
 */
export function lrvGapSentence(a: Named, b: Named, gap: LrvGap): string {
  const [light, dark] = gap.lighter === "a" ? [a, b] : [b, a];
  const [lightLrv, darkLrv] = gap.lighter === "a" ? [gap.lrvA, gap.lrvB] : [gap.lrvB, gap.lrvA];
  const lighterRef = light.brandName !== dark.brandName ? `the ${light.brandName} color` : light.name;
  return (
    `${light.brandName} ${light.name} (LRV ${formatLrv(lightLrv)}) reflects more light than ` +
    `${dark.brandName} ${dark.name} (LRV ${formatLrv(darkLrv)}). That gap is bigger than the swatches show, ` +
    `so ${lighterRef} may look lighter on the wall.`
  );
}

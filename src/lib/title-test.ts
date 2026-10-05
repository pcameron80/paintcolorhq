// Color-page title/description split test, started 2026-10-06.
//
// Hypothesis: color pages rank 4-10 but earn ~0.8% CTR because the title
// leads with LRV and family, which the brand's own page already shows. The
// thing only we have is the cross-brand match, so arm "matches" leads with it.
//
// Assignment is a stable hash of "brandSlug/colorSlug", so the report script
// can bucket GSC page rows from the URL alone. An A/A check on Sep 21-Oct 4
// data gave 3,058 vs 3,022 pages, 0.75% vs 0.88% CTR, position 7.8 vs 7.7:
// differences smaller than that are noise. Read at 28 days (2026-11-03).
// Pages in REVIEWED_COLOR_PAGES keep their hand-set titles and are excluded.

import type { CrossBrandMatchWithColor } from "@/lib/types";

export const TITLE_TEST_START = "2026-10-06";

export type TitleArm = "control" | "matches";

export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(input)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function titleArm(brandSlug: string, colorSlug: string): TitleArm {
  return fnv1a(`${brandSlug}/${colorSlug}`) % 2 === 1 ? "matches" : "control";
}

// The brands people most often want a substitute in, in order.
const SUBSTITUTE_BRANDS = ["Sherwin-Williams", "Benjamin Moore", "Behr"];

function closenessPhrase(score: number): string {
  if (score < 1) return "a very close digital match";
  if (score < 2) return "a close digital match";
  if (score < 5) return "a similar color";
  return "the nearest color we track";
}

export function matchesArmTitle(name: string, colorNum: string, brandName: string, variantSuffix: string): string {
  const [a, b] = SUBSTITUTE_BRANDS.filter((x) => x !== brandName);
  return `${name}${colorNum} by ${brandName}${variantSuffix}: Closest ${a} & ${b} Matches`;
}

export function matchesArmDescription(
  name: string,
  lrv: number | null,
  nearestPerBrand: CrossBrandMatchWithColor[],
): string | null {
  const best = nearestPerBrand[0];
  if (!best) return null;
  const score = Number(best.delta_e_score);
  const lrvPart = lrv != null ? `, plus LRV ${lrv} and undertone` : "";
  const text = `Closest match to ${name}: ${best.match_color.brand.name} ${best.match_color.name}, ${closenessPhrase(score)}. See the nearest color in ${nearestPerBrand.length} other brands${lrvPart}.`;
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, "")}...`;
}

// Color-page title/description split test, started 2026-10-06, read and rolled
// out 2026-11-03.
//
// Hypothesis: color pages rank 4-10 but earn ~0.8% CTR because the title
// leads with LRV and family, which the brand's own page already shows. The
// thing only we have is the cross-brand match, so arm "matches" leads with it.
//
// Assignment was a stable hash of "brandSlug/colorSlug", so the report script
// could bucket GSC page rows from the URL alone. An A/A check on Sep 21-Oct 4
// data gave 3,058 vs 3,022 pages, 0.75% vs 0.88% CTR, position 7.8 vs 7.7.
//
// RESULT (2026-11-03, 28 days): the "matches" arm won on Google, 0.67% CTR vs
// 0.16% for control, on 163 crawl-gated URLs. The Bing guardrail was neutral.
// MP-40 rolled the matches title out to every color page except the head
// colors and the hand-set REVIEWED_COLOR_PAGES titles. Those 13 head colors
// (src/lib/head-colors.ts) keep the string they had on 2026-11-03, including
// whichever arm they hashed to, until their own read: titleArm(),
// legacyMatchesArmTitle() and legacyMatchesArmDescription() below exist only
// for them and must not change.

import { closenessLabel } from "@/lib/closeness";
import { UNVERIFIED_BUY_BRANDS } from "@/lib/popular-colors";
import { capMeta, codeSuffix, displayColorNumber } from "@/lib/text";
import { displayUndertone } from "@/lib/undertone-display";
import type { CrossBrandMatchWithColor } from "@/lib/types";

export const TITLE_TEST_START = "2026-10-06";
export const TITLE_ROLLOUT_DATE = "2026-11-03";

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

/** Arm assignment for the NEXT color-page test: 0 or 1 from a mixed bit.
 *  titleArm() uses fnv1a % 2, which is the low bit of the hash. Any later test
 *  that also split on fnv1a % 2 would reuse the same pages in the same arms and
 *  confound with this one. Use a high bit instead ((hash >>> 16) & 1), and
 *  change `salt` per test so two future tests do not collide either. */
export function mixedHashBit(key: string, salt = ""): 0 | 1 {
  return ((fnv1a(`${salt}${key}`) >>> 16) & 1) as 0 | 1;
}

// The brands people most often want a substitute in, in order.
const SUBSTITUTE_BRANDS = ["Sherwin-Williams", "Benjamin Moore", "Behr"];

export const TITLE_MAX = 60;

/** First candidate that fits in 60 characters. The list is ordered from the
 *  full title to the shortest, so what gets dropped first is what matters
 *  least to a searcher. The last candidate is cut at a word boundary if it
 *  still does not fit. */
export function fitTitle(candidates: string[]): string {
  const fit = candidates.find((c) => c.length <= TITLE_MAX);
  if (fit) return fit;
  const last = candidates[candidates.length - 1];
  const cut = last.slice(0, TITLE_MAX + 1).replace(/\s+\S*$/, "");
  return cut.length > 0 ? cut : last.slice(0, TITLE_MAX);
}

/** Title for a non-head, non-reviewed color page (the winning arm).
 *
 *  Full form: `${name} ${code} by ${brand}${variant}: Closest ${A} & ${B} Matches`,
 *  where A and B are the first two of Sherwin-Williams, Benjamin Moore and Behr
 *  other than the page's own brand. It is long, so it is fitted by dropping
 *  parts in this order (the old control title dropped suffix, "Paint", family
 *  word, second brand; this arm has the same idea with different parts):
 *    1. "Closest"           (the match pair is the hook, the adjective is not)
 *    2. the second brand    ("Closest A Match", then "A Match")
 *    3. " by {brand}"       (the brand stays in the page's H1 and breadcrumb)
 *    4. the match clause    (name, code and brand alone)
 *    5. the brand again, then a word-boundary cut.
 *  A color with no cross-brand matches gets "{name} {code} by {brand} Paint
 *  Color" instead of a match promise it cannot keep. */
export function colorTitle(opts: {
  name: string;
  brandName: string;
  brandSlug: string;
  colorNumber: string | null;
  variant: string;
  hasMatches: boolean;
}): string {
  const { name, brandName, brandSlug, variant } = opts;
  const code = codeSuffix(name, opts.colorNumber ? displayColorNumber(brandSlug, opts.colorNumber) : null);
  const bare = `${name}${code}${variant}`;
  const base = `${name}${code} by ${brandName}${variant}`;
  if (!opts.hasMatches) return fitTitle([`${base} Paint Color`, base, bare]);
  const [a, b] = SUBSTITUTE_BRANDS.filter((x) => x !== brandName);
  return fitTitle([
    `${base}: Closest ${a} & ${b} Matches`,
    `${base}: ${a} & ${b} Matches`,
    `${base}: Closest ${a} Match`,
    `${base}: ${a} Match`,
    `${bare}: Closest ${a} Match`,
    `${bare}: ${a} Match`,
    base,
    bare,
  ]);
}

/** Description for the winning arm: names the nearest purchasable match and
 *  how close it is (closenessLabel, never the raw number), then how many other
 *  brands have a match, LRV and undertone, and the digital-match caveat when
 *  there is room. Returns null when there is nothing to name. */
export function colorMatchesDescription(
  color: { name: string; lrv: number | string | null; undertone?: string | null; lab_a?: number | string | null; lab_b_val?: number | string | null },
  nearestPerBrand: CrossBrandMatchWithColor[],
): string | null {
  const best = nearestPerBrand.find((m) => !UNVERIFIED_BUY_BRANDS.has(m.match_color.brand.slug));
  if (!best) return null;
  const label = closenessLabel(Number(best.delta_e_score)).toLowerCase();
  const lead = `Closest match to ${color.name}: ${best.match_color.brand.name} ${best.match_color.name} (${label}).`;
  const n = nearestPerBrand.length;
  const brands = `${n} other brand${n === 1 ? "" : "s"}`;
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const undertone = displayUndertone(color);
  const detail = lrv != null ? `, plus LRV ${lrv}${undertone ? ` and ${undertone.toLowerCase()} undertone` : ""}` : undertone ? `, plus ${undertone.toLowerCase()} undertone` : "";
  const caveat = "Digital match, confirm with a physical sample.";
  // The tested copy was lead + nearest + LRV/undertone, so that stays first;
  // the digital-match caveat is added when it fits, and outranks the LRV and
  // undertone detail once the name is long enough that only one fits.
  const options = [
    `${lead} See the nearest color in ${brands}${detail}. ${caveat}`,
    `${lead} See the nearest color in ${brands}${detail}.`,
    `${lead} See the nearest color in ${brands}. ${caveat}`,
    `${lead} ${caveat}`,
    lead,
  ];
  return capMeta(options.find((o) => o.length <= 160) ?? lead);
}

// ---- Head colors only: the strings from before MP-40, frozen. ----

function legacyClosenessPhrase(score: number): string {
  if (score < 1) return "a very close digital match";
  if (score < 2) return "a close digital match";
  if (score < 5) return "a similar color";
  return "the nearest color we track";
}

export function legacyMatchesArmTitle(name: string, colorNum: string, brandName: string, variantSuffix: string): string {
  const [a, b] = SUBSTITUTE_BRANDS.filter((x) => x !== brandName);
  return `${name}${colorNum} by ${brandName}${variantSuffix}: Closest ${a} & ${b} Matches`;
}

export function legacyMatchesArmDescription(
  name: string,
  lrv: number | null,
  nearestPerBrand: CrossBrandMatchWithColor[],
): string | null {
  const best = nearestPerBrand[0];
  if (!best) return null;
  const score = Number(best.delta_e_score);
  const lrvPart = lrv != null ? `, plus LRV ${lrv} and undertone` : "";
  const text = `Closest match to ${name}: ${best.match_color.brand.name} ${best.match_color.name}, ${legacyClosenessPhrase(score)}. See the nearest color in ${nearestPerBrand.length} other brands${lrvPart}.`;
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, "")}...`;
}

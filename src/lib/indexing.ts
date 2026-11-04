const codeSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Behr's "-2-2" slugs (the primary is "...-n260-2", a "-2" copy follows) look
// like variants under the rule below but are indexable today, and three of them
// have Bing traffic, so they stay indexable until MP-49 consolidates them
// (with redirects). Remove this list then.
const BEHR_DOUBLE_SUFFIX_KEEP: ReadonlySet<string> = new Set([
  "almond-latte-n260-2-2",
  "chocolate-froth-720c-2-2",
  "hazelnut-cream-750c-2-2",
  "raffia-cream-710c-2-2",
  "silver-bullet-n520-2-2",
  "silver-drop-790c-2-2",
  "toasty-gray-n320-2-2",
  "writers-parchment-n280-2-2",
]);

// Names that pass the code-only test but are still fragments, not names. BM
// AC-39 is "Mt." (a truncated "Mt. ..."); it stays noindexed until A-23
// consolidates it. Remove this entry then.
const THIN_NAME_HOLD: ReadonlySet<string> = new Set(["mt-ac-39"]);

// A slug like `sea-salt-6204-2` is a variant of `sea-salt-6204`: the color
// number sits immediately before the "-N" suffix. A slug that merely ends in
// "-N" is not: Behr "almond-latte-n260-2" IS the color number N260-2, and Vista
// "casa-blanca-c-7" carries its own counter (number 0008). Checked against all
// 26,720 colors on 2026-11-03. Without a color number the slug alone cannot
// say, so the suffix still counts as a variant.
export function extractVariantSuffix(slug: string, colorNumber: string | null | undefined): string {
  const m = slug.match(/^(.*)-([2-9])$/);
  if (!m) return "";
  if (BEHR_DOUBLE_SUFFIX_KEEP.has(slug)) return "";
  const num = colorNumber ? codeSlug(colorNumber) : "";
  if (num && !m[1].endsWith(`-${num}`) && m[1] !== num) return "";
  return ` (variant ${m[2]})`;
}

// Such variant pages (34 Behr, Kilz and Benjamin Moore slugs) cannibalize the
// primary slug because their generated copy differs only by "(variant 2)" in
// the title. Treat them as noindex so the primary keeps the ranking.
export function isVariantSlug(slug: string, colorNumber: string | null | undefined): boolean {
  return extractVariantSuffix(slug, colorNumber) !== "";
}

// Thin-content gate. Two paths to noindex:
//   1. Code-only name: the name has no alphabetic run of 3+ letters AND, when
//      the color number is known, is that number (Behr "YL-W15" coded
//      YL-W15). These can't rank for natural-language queries: no one
//      searches "YL-W15 paint." A short real name with a different code ("Oh
//      So Vo" coded 8001-40G, "H2O" coded CC-878) is a name, and passes, like
//      "Red", "Tan" or "Imagine .04". Without a color number the name alone
//      decides, as before.
//   2. Data quality score < 2: missing two or more of {LRV, undertone,
//      family, has-name}. Today every color has score >= 3 so this is
//      future-proofing for sparse imports.
export function isCodeOnlyName(name: string, colorNumber?: string | null): boolean {
  if (!name.trim()) return true;
  // Unicode-aware so "Crème" reads as a 5-letter word, not "Cr" + "me".
  const runs = name.match(/\p{L}+/gu);
  if (!runs) return true;
  if (!runs.every((r) => r.length < 3)) return false;
  if (!colorNumber) return true;
  const squash = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  return squash(name) === squash(colorNumber);
}

export function dataQualityScore(color: { lrv: number | string | null; undertone: string | null; color_family: string | null; name: string; color_number?: string | null }): number {
  let score = 0;
  if (color.lrv !== null && color.lrv !== undefined) score++;
  if (color.undertone) score++;
  if (color.color_family) score++;
  if (!isCodeOnlyName(color.name, color.color_number)) score++;
  return score;
}


export function isColorIndexable(color: { slug: string; name: string; color_number?: string | null; lrv: number | string | null; undertone: string | null; color_family: string | null }): boolean {
  return !isCodeOnlyName(color.name, color.color_number) && dataQualityScore(color) >= 2 && !isVariantSlug(color.slug, color.color_number) && !THIN_NAME_HOLD.has(color.slug);
}

// Individual /match/[a]-to-[b] pages are indexable only below this Delta E.
// Deliberately stricter than closeness VERY_SIMILAR_MAX (5), which labels a
// pair "Very similar" on the page: at 3 to 5 the pair reads as a near miss and
// the page as a doorway at scale. The threshold dates from PR #47 and has
// nothing to do with the three closeness labels, so do not "align" the two.
export const MATCH_INDEX_MAX_DE = 3;

export function isMatchIndexable(source: { slug: string; name?: string; color_number?: string | null }, score: number | null): boolean {
  return score !== null && Number.isFinite(score) && score >= 0 && score < MATCH_INDEX_MAX_DE
    && !isVariantSlug(source.slug, source.color_number)
    // A pair whose source color page is noindexed (code-only name) is no better.
    && !(source.name !== undefined && isCodeOnlyName(source.name, source.color_number));
}

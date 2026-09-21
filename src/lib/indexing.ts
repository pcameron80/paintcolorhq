export function extractVariantSuffix(slug: string, colorNumber: string | null | undefined): string {
  const m = slug.match(/-([2-9])$/);
  if (!m) return "";
  const digit = m[1];
  if (colorNumber && colorNumber.toLowerCase().endsWith(digit)) return "";
  return ` (variant ${digit})`;
}

// A slug like `agreeable-gray-7029-2` is a variant of `agreeable-gray-7029`.
// 49 such pages exist across Behr, Kilz, and Benjamin Moore — many cannibalize
// the primary slug because their generated copy differs only by "(variant 2)"
// in the title. Treat them as noindex so the primary keeps the ranking.
export function isVariantSlug(slug: string, colorNumber: string | null | undefined): boolean {
  return extractVariantSuffix(slug, colorNumber) !== "";
}

// Thin-content gate. Two paths to noindex:
//   1. Code-only name: when the color name has no alphabetic run of 3+
//      letters (e.g. Behr "YL-W15", "PPU5-16"). These can't rank for
//      natural-language queries — no one searches "YL-W15 paint." Colors
//      with real-word names like "Red", "Tan", or "Imagine .04" still
//      pass even when name overlaps with color_number.
//   2. Data quality score < 2: missing two or more of {LRV, undertone,
//      family, has-name}. Today every color has score >= 3 so this is
//      future-proofing for sparse imports.
export function isCodeOnlyName(name: string): boolean {
  if (!name.trim()) return true;
  // Unicode-aware so "Crème" reads as a 5-letter word, not "Cr" + "me".
  const runs = name.match(/\p{L}+/gu);
  if (!runs) return true;
  return runs.every((r) => r.length < 3);
}

export function dataQualityScore(color: { lrv: number | string | null; undertone: string | null; color_family: string | null; name: string }): number {
  let score = 0;
  if (color.lrv !== null && color.lrv !== undefined) score++;
  if (color.undertone) score++;
  if (color.color_family) score++;
  if (!isCodeOnlyName(color.name)) score++;
  return score;
}


export function isColorIndexable(color: { slug: string; name: string; color_number?: string | null; lrv: number | string | null; undertone: string | null; color_family: string | null }): boolean {
  return !isCodeOnlyName(color.name) && dataQualityScore(color) >= 2 && !isVariantSlug(color.slug, color.color_number);
}

export function isMatchIndexable(source: { slug: string; color_number?: string | null }, score: number | null): boolean {
  return score !== null && Number.isFinite(score) && score >= 0 && score < 3 && !isVariantSlug(source.slug, source.color_number);
}

/** Lowercase, strip diacritics and punctuation noise so GA4 and GeoNames spellings meet. */
export function normalizePlace(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

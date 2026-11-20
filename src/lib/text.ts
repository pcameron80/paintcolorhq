// Small copy helpers shared by templated page text.

/** "an" before a leading vowel letter, "a" otherwise. Covers the color-family
 *  words the templates use ("an orange", "an off-white", "a beige"). */
export function indefiniteArticle(word: string): "a" | "an" {
  return /^[aeiou]/i.test(word.trim()) ? "an" : "a";
}

/** The word with its indefinite article: withArticle("orange") is "an orange". */
export function withArticle(word: string): string {
  return `${indefiniteArticle(word)} ${word}`;
}

/** The color code as shown in titles and copy. PPG codes like "1001-5" print
 *  as "PPG1001-5" (that is how the brand and its retailers write them), and
 *  Sherwin-Williams codes under four digits are zero-padded ("20" is "0020")
 *  to match the "SW 0020" form people search. Everything else is unchanged. */
export function displayColorNumber(brandSlug: string, code: string): string {
  if (brandSlug === "ppg" && /^\d{4}-\d+$/.test(code)) return `PPG${code}`;
  if (brandSlug === "sherwin-williams" && /^\d{1,3}$/.test(code)) return code.padStart(4, "0");
  return code;
}

/** " 1850" to append after a color name, or "" when there is no code or the
 *  name already ends with it ("Ultra Pure White 1850" with code 1850, or a
 *  Behr "Black" coded BLACK). Pass the code as it will be displayed. */
export function codeSuffix(name: string, code: string | null | undefined): string {
  const c = code?.trim();
  if (!c) return "";
  const n = name.trim().toLowerCase();
  const lc = c.toLowerCase();
  // Also treat the unpadded or unprefixed form as already present.
  const bare = lc.replace(/^ppg/, "").replace(/^0+(?=\d)/, "");
  if (n === lc || n.endsWith(` ${lc}`) || n === bare || n.endsWith(` ${bare}`)) return "";
  return ` ${c}`;
}

/** Cap a meta description at about 157 characters on a word boundary, then
 *  "...". Text up to 160 characters is returned unchanged. Apply it last,
 *  after every suffix (variant, former name) has been added. */
export function capMeta(text: string): string {
  if (text.length <= 160) return text;
  const trimmed = text.slice(0, 157);
  const lastSpace = trimmed.lastIndexOf(" ");
  return `${trimmed.slice(0, lastSpace > 120 ? lastSpace : 157).replace(/[\s,;:]+$/, "")}...`;
}

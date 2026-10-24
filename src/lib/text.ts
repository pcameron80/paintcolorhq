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

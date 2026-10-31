// Spelling correction for site search, against the words in the catalog's own
// color names (src/generated/search-words.json, built by
// scripts/build-search-words.ts).
//
// Built 2026-10-31 from Plausible zero-result searches: "agean" (Aegean Teal)
// returned only Pageant colors, and "harmonius gold" and "shitake" returned
// nothing. Each misspelled word is replaced by the closest catalog word that
// starts with the same letter, within one edit (two for words of 8+ letters);
// ties go to the word used in more color names. The last word may still be
// half-typed, so it is left alone when it is under 5 letters or still a prefix
// of a catalog word.

export type WordCounts = Record<string, number>;

/** Lowercase letters only: "Farrow's" -> "farrows". */
export function normalizeWord(w: string): string {
  return w.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
}

/** Words of a color name as search-words.json stores them (3+ letters). */
export function nameWords(name: string): string[] {
  return name.split(/[\s\-/&,.()]+/).map(normalizeWord).filter((w) => w.length >= 3);
}

/** Optimal string alignment distance (Levenshtein plus adjacent swaps), capped at max + 1. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    rows.push(new Array<number>(b.length + 1).fill(0));
    rows[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, rows[i - 2][j - 2] + 1);
      rows[i][j] = d;
      rowMin = Math.min(rowMin, d);
    }
    if (rowMin > max) return max + 1;
  }
  return rows[a.length][b.length];
}

function closestWord(word: string, words: WordCounts): string | null {
  const max = word.length >= 8 ? 2 : 1;
  let best: string | null = null;
  let bestDist = max + 1;
  let bestCount = 0;
  for (const [candidate, count] of Object.entries(words)) {
    if (candidate[0] !== word[0]) continue;
    const d = editDistance(word, candidate, max);
    if (d < bestDist || (d === bestDist && d <= max && count > bestCount)) {
      best = candidate;
      bestDist = d;
      bestCount = count;
    }
  }
  return bestDist <= max ? best : null;
}

/**
 * The name text with misspelled words corrected, or null when every word is
 * already a catalog word (or nothing close enough exists). Words under 4
 * letters, and a last word under 5, are never changed.
 */
export function correctName(name: string, words: WordCounts): string | null {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  let changed = false;
  const out = tokens.map((token, i) => {
    const w = normalizeWord(token);
    if (w.length < 4 || words[w] !== undefined) return token;
    const last = i === tokens.length - 1;
    if (last && (w.length < 5 || Object.keys(words).some((k) => k.startsWith(w)))) return token;
    const fix = closestWord(w, words);
    if (!fix) return token;
    changed = true;
    return fix;
  });
  return changed ? out.join(" ") : null;
}

/**
 * True when no result name has a word starting with the query's first word.
 * "agean" finding only "Pageant ..." colors is a weak result worth correcting.
 */
export function isWeakResult(name: string, resultNames: string[]): boolean {
  const first = normalizeWord(name.trim().split(/\s+/)[0] ?? "");
  if (!first) return false;
  return !resultNames.some((n) => nameWords(n).some((w) => w.startsWith(first)));
}

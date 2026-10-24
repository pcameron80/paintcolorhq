// Color-number candidates for a color slug that did not match a row.
//
// Google still holds renamed and misspelled slugs (blue-736, agreeable-grey-7029,
// wrong-name-7029). The color page resolves them by color number and 308s to the
// canonical slug. This module only parses: it returns the color numbers a slug
// could be carrying, most specific first, and getColorSlugByNumber tries them in
// that order against color_number and alternate_numbers.
//
// Order:
// 1. PPG's "90RR 63/139" and Behr's "PPH-31 (HISP)" shapes, then the shape
//    regexes the page used before (coded forms like HC-154, CSP-10, LA123-45,
//    2062-10).
// 2. The last 3, 2 and 1 hyphen tokens, longest first, each with and without
//    the hyphens (dew341, 4002-1a, aspire-12, h0075). Only tokens with a digit.
// 3. The bare numeric tail (blue-736 -> 736), skipped when the token in front
//    of it is a code prefix (see CODE_PREFIXES_WITH_BARE_TWIN).

// Letter prefixes where one brand has both the coded number and the bare
// number for the same digits, so the bare tail would land on a different
// color. Example: Benjamin Moore HC-154 is Hale Navy and 154 is Mango Punch,
// so a stale "something-hc-154" must never fall back to 154. Vista Paint is
// the large case: C-1182 and K-1182 are alternates of one color while 1182 is
// another.
//
// Built 2026-10-24 from all 26,720 color rows (color_number plus
// alternate_numbers, leading zeros ignored). Count of colliding numbers per
// brand: Benjamin Moore CC 231, CSP 240, HC 191, OC 152, AF 144, CW 144,
// AC 42, PM 32; Vista Paint K 1319, C 1319, R 132, H 108, OW 60, AC 60;
// Hirshfield's H 149; Behr BXC 9, PMD 9, PPL 9, PPH 8, PWN 7, ICC 7, QE 6,
// PPF 6, BIC 6, BNC 4, BWC 4, DC 2; Farrow & Ball CB 6. PPG, Sherwin-Williams,
// Dunn-Edwards, Dutch Boy, Valspar, Kilz, Colorhouse and RAL have none.
// Re-run the check after a catalog import that adds a new coded series.
export const CODE_PREFIXES_WITH_BARE_TWIN: ReadonlySet<string> = new Set([
  "AC", "AF", "BIC", "BNC", "BWC", "BXC", "C", "CB", "CC", "CSP", "CW", "DC",
  "H", "HC", "ICC", "K", "OC", "OW", "PM", "PMD", "PPF", "PPH", "PPL", "PWN",
  "QE", "R",
]);

const SHAPE_PATTERNS: { re: RegExp; build: (m: RegExpMatchArray) => string }[] = [
  // PPG: "90RR 63/139" is slugged as "-90rr-63-139". Ahead of the generic
  // shapes so "63-139" is not tried first.
  { re: /-(\d+[a-z]{2})-(\d+)-(\d+)$/i, build: (m) => `${m[1]} ${m[2]}/${m[3]}` },
  // Behr Hispanic line: "PPH-31 (HISP)" is slugged as "-pph-31-hisp".
  { re: /-([a-z]{1,4}-\d+)-(hisp)$/i, build: (m) => `${m[1]} (${m[2]})` },
  // The shapes the color page parsed before, minus the bare tail (step 3).
  { re: /-([a-z]{1,4}\d+-\d+[a-z]*)$/i, build: (m) => m[1] },
  { re: /-([a-z]{1,4}-\d+[a-z]*)$/i, build: (m) => m[1] },
  { re: /-(\d+-\d+)$/i, build: (m) => m[1] },
];

// A trailing "-2".."-9" is the dedupe suffix the importer adds when two rows
// share a name and number (Behr "chocolate-froth-720c-2-2" is 720C-2).
const DEDUPE_SUFFIX = /-[2-9]$/;

function codedCandidates(s: string, add: (c: string) => void): string[] {
  for (const { re, build } of SHAPE_PATTERNS) {
    const m = s.match(re);
    if (m) add(build(m));
  }
  const tokens = s.split("-").filter(Boolean);
  const bareTail = tokens.length > 1 && /^\d+$/.test(tokens[tokens.length - 1]);
  for (let k = Math.min(3, tokens.length - 1); k >= 1; k--) {
    const tail = tokens.slice(-k);
    if (k === 1 && bareTail) break; // the bare tail is step 3
    if (!tail.some((t) => /\d/.test(t))) continue;
    add(tail.join("-"));
    // Hyphens dropped (dew-341 -> DEW341) only when a letter remains, so
    // "720c-2-2" never collapses into a bare number like 22.
    const joined = tail.join("");
    if (k > 1 && /[a-z]/.test(joined)) add(joined);
  }
  return tokens;
}

export function colorNumberCandidates(slug: string): string[] {
  const s = slug.trim().toLowerCase();
  const out: string[] = [];
  const add = (c: string) => {
    const v = c.toUpperCase();
    if (/\d/.test(v) && !out.includes(v)) out.push(v);
  };

  const tokens = codedCandidates(s, add);
  if (DEDUPE_SUFFIX.test(s)) codedCandidates(s.replace(DEDUPE_SUFFIX, ""), add);

  const bareTail = tokens.length > 1 && /^\d+$/.test(tokens[tokens.length - 1]);
  if (bareTail) {
    const prev = tokens[tokens.length - 2].toUpperCase();
    if (!CODE_PREFIXES_WITH_BARE_TWIN.has(prev)) add(tokens[tokens.length - 1]);
  }
  return out;
}

export interface ColorNumberRow {
  slug: string;
  color_number: string | null;
  alternate_numbers: string[] | null;
}

// Values to send to the database for the candidates. color_number is stored
// in the brand's own case (Colorhouse uses "Leaf-07"), so each candidate also
// goes out with its letter runs capitalized. Matching back is case-insensitive.
export function colorNumberQueryValues(candidates: string[]): string[] {
  const out = new Set<string>();
  for (const c of candidates) {
    out.add(c);
    out.add(c.toLowerCase().replace(/[a-z]+/g, (w) => w[0].toUpperCase() + w.slice(1)));
  }
  return [...out];
}

function commonPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return i;
}

// The first candidate that hits a row (color_number, then alternate_numbers)
// decides. When several rows share that number (Behr's "-2" dedupe twins),
// the one whose slug shares the longest prefix with the request wins, then
// the shorter slug.
export function pickColorNumberMatch(
  requestedSlug: string,
  candidates: string[],
  rows: ColorNumberRow[],
): string | null {
  for (const c of candidates) {
    const hits = rows.filter(
      (r) =>
        r.color_number?.toUpperCase() === c ||
        (r.alternate_numbers ?? []).some((a) => a.toUpperCase() === c),
    );
    if (hits.length === 0) continue;
    hits.sort(
      (a, b) =>
        commonPrefix(b.slug, requestedSlug) - commonPrefix(a.slug, requestedSlug) ||
        a.slug.length - b.slug.length,
    );
    return hits[0].slug;
  }
  return null;
}

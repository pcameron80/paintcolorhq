/**
 * Name differences that keep the same letters: the DB name and the
 * manufacturer's name spell the same words but differ in punctuation, spacing
 * or accents ("Strawberryncream" for Strawberry 'n Cream, "Tear Drop" for
 * Teardrop, "Cafe Noir" for Café Noir).
 *
 * Before the 2026-11 data audit, apply-published-names.ts skipped every such
 * pair as "straight-vs-curly punctuation only", which hid 69 real import
 * artifacts. classifyPunctuation() splits them so each kind is written only
 * behind its own flag:
 *
 *   quote-only    curly vs straight quotes, Unicode vs ASCII hyphens, case.
 *                 Never written.
 *   punctuation   the feed has punctuation or spaces the DB lost at import
 *                 (apostrophes, &, periods, hyphens). --punctuation.
 *   word-join     the feed joins words the DB splits ("Tear Drop" ->
 *                 "Teardrop"). Changes how the name reads. --word-joins.
 *   accent        the feed has accents the DB lacks ("Cafe Noir" ->
 *                 "Café Noir"). Some feed accents are doubtful (Behr
 *                 "Parisian Cafè"). --accents.
 *   accent-kept   the DB has an accent the feed lacks (Valspar Jalapeño).
 *                 Never written: the catalog keeps the accent.
 */

export type PunctuationClass = 'quote-only' | 'punctuation' | 'word-join' | 'accent' | 'accent-kept';

const QUOTES: [RegExp, string][] = [
  [/[‘’ʼ′`´]/g, "'"],
  [/[“”]/g, '"'],
  [/[‐‑‒–—]/g, '-'],
];

/** Straight quotes and ASCII hyphens, the catalog's style. */
export function straightenQuotes(s: string): string {
  return QUOTES.reduce((acc, [rx, to]) => acc.replace(rx, to), s);
}

const fold = (ch: string) => ch.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const isAlnum = (ch: string) => /^[a-z0-9]+$/.test(fold(ch));
const letters = (s: string) => [...s.normalize('NFC')].filter(isAlnum).map(fold).join('');
const hasMark = (ch: string) => ch.normalize('NFKD') !== ch && /[̀-ͯ]/.test(ch.normalize('NFKD'));

/** Positions (in the letters-only string) where a new word starts. */
function wordStarts(s: string): Set<number> {
  const out = new Set<number>();
  let i = 0;
  let prevAlnum = false;
  for (const ch of s.normalize('NFC')) {
    const a = isAlnum(ch);
    if (a) {
      if (!prevAlnum) out.add(i);
      i += fold(ch).length;
    }
    prevAlnum = a;
  }
  return out;
}

/** Accented letters as (index -> folded letter) in the letters-only string. */
function accents(s: string): Map<number, string> {
  const out = new Map<number, string>();
  let i = 0;
  for (const ch of s.normalize('NFC')) {
    if (!isAlnum(ch)) continue;
    if (hasMark(ch)) out.set(i, ch.toLowerCase());
    i += fold(ch).length;
  }
  return out;
}

/**
 * Kind of difference between a DB name and the feed's name, or null when the
 * letters themselves differ (a rename or truncation, handled elsewhere).
 */
export function classifyPunctuation(dbName: string, feedName: string): PunctuationClass | null {
  if (letters(dbName) !== letters(feedName)) return null;
  const db = straightenQuotes(dbName.normalize('NFC'));
  const feed = straightenQuotes(feedName.normalize('NFC'));
  if (db.toLowerCase() === feed.toLowerCase()) return 'quote-only';
  const dbAcc = accents(db);
  const feedAcc = accents(feed);
  if ([...dbAcc.keys()].some((k) => feedAcc.get(k) !== dbAcc.get(k))) return 'accent-kept';
  if (feedAcc.size > dbAcc.size) return 'accent';
  const dbStarts = wordStarts(db);
  const feedStarts = wordStarts(feed);
  if ([...dbStarts].some((p) => !feedStarts.has(p))) return 'word-join';
  return 'punctuation';
}

/**
 * The feed's punctuation, spacing and accents with the catalog's casing.
 * Feeds title-case every word ("Bride-To-Be"), so each letter keeps the DB's
 * case unless its word-start status changed: a letter that starts a word in
 * the feed but not in the DB ("Strawberryncream" -> "Strawberry 'n Cream")
 * takes the feed's case, and so does one that stops starting a word
 * ("Tear Drop" -> "Teardrop").
 */
export function mergePunctuation(dbName: string, feedName: string): string {
  const db = [...dbName.normalize('NFC')];
  const feed = [...straightenQuotes(feedName.normalize('NFC'))];
  let j = 0;
  let prevFeedAlnum = false;
  let out = '';
  const dbStartAt = (k: number) => k === 0 || !isAlnum(db[k - 1]);
  // A one-letter contraction next to an apostrophe ('n, o', 's) is written the
  // manufacturer's way: the import title-cased "Peaches 'n Cream" to "N".
  const contraction = (k: number) =>
    (k === 0 || !isAlnum(feed[k - 1])) &&
    (k + 1 >= feed.length || !isAlnum(feed[k + 1])) &&
    (feed[k - 1] === "'" || feed[k + 1] === "'");
  for (let k = 0; k < feed.length; k++) {
    const ch = feed[k];
    if (!isAlnum(ch)) {
      out += ch;
      prevFeedAlnum = false;
      continue;
    }
    while (j < db.length && !isAlnum(db[j])) j++;
    const d = db[j];
    const feedStart = !prevFeedAlnum;
    let next = ch;
    if (d !== undefined && feedStart === dbStartAt(j) && !contraction(k)) {
      next = d === d.toUpperCase() && d !== d.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
    }
    out += next;
    j++;
    prevFeedAlnum = true;
  }
  return out.replace(/\s+/g, ' ').trim();
}

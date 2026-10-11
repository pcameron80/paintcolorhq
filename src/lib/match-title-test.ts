// Match-page title/description test, set up 2026-10-11, read from 2026-10-25.
//
// Hypothesis: individual /match/[brand]/[color]-to-[brand] pages rank 4.5-7.8
// for "[color] [brand] equivalent" searches but earn about 1% CTR (White Dove
// to Behr: 278 impressions, 1 click, 2026-09-26..2026-10-09). The test arm
// rewrites the title in searcher phrasing and names the closest match, plus the
// next-closest options, in the description. Every pair not listed here is the
// control and keeps the existing title and description.
//
// The list is fixed and explicit (not hashed) so the report script can bucket
// GSC page rows from the URL alone. Keys are "sourceBrandSlug/matchSlug".

export const MATCH_TITLE_TEST_START = "2026-10-11";
export const MATCH_TITLE_TEST_READ_DATE = "2026-10-25";

export const MATCH_TITLE_TEST_PAIRS: ReadonlySet<string> = new Set([
  // Pairs with GSC impressions, 2026-09-26..2026-10-09 (most impressions first).
  "benjamin-moore/white-dove-oc-17-to-behr",
  "sherwin-williams/agreeable-gray-7029-to-behr",
  "sherwin-williams/alabaster-7008-to-valspar",
  "sherwin-williams/agreeable-gray-7029-to-valspar",
  "sherwin-williams/iron-ore-7069-to-behr",
  "sherwin-williams/sea-salt-6204-to-behr",
  "sherwin-williams/alabaster-7008-to-behr",
  "benjamin-moore/white-dove-oc-17-to-valspar",
  "sherwin-williams/alabaster-7008-to-ppg",
  "sherwin-williams/sea-salt-6204-to-valspar",
  "sherwin-williams/iron-ore-7069-to-valspar",
  "sherwin-williams/agreeable-gray-7029-to-dunn-edwards",
  "sherwin-williams/alabaster-7008-to-farrow-ball",
  "benjamin-moore/white-dove-oc-17-to-ppg",
  "sherwin-williams/alabaster-7008-to-benjamin-moore",
  "sherwin-williams/agreeable-gray-7029-to-ppg",
  "sherwin-williams/sea-salt-6204-to-ppg",
  // Target-keyword pairs with no GSC rows in that window (zero baseline).
  "benjamin-moore/white-dove-oc-17-to-sherwin-williams",
  "benjamin-moore/swiss-coffee-oc-45-to-sherwin-williams",
  "benjamin-moore/pale-oak-oc-20-to-sherwin-williams",
  "sherwin-williams/accessible-beige-7036-to-behr",
]);

export function isMatchTitleTestPair(sourceBrandSlug: string, matchSlug: string): boolean {
  return MATCH_TITLE_TEST_PAIRS.has(`${sourceBrandSlug}/${matchSlug}`);
}

/** Plain-language closeness. Never expose the raw Delta E number. */
export function matchClosenessLabel(score: number): string {
  if (score < 1) return "Nearly identical";
  if (score < 3) return "Very similar";
  return "Visible difference";
}

export interface MatchTestCandidate {
  name: string;
  colorNumber: string | null;
  deltaE: number;
}

function withCode(name: string, code: string | null): string {
  return code ? `${name} ${code}` : name;
}

/** "White Dove (OC-17) Behr Equivalent: Closest Match", trimmed to 60 chars. */
export function matchTestTitle(sourceName: string, sourceCode: string | null, targetBrandName: string): string {
  const base = `${sourceName}${sourceCode ? ` (${sourceCode})` : ""} ${targetBrandName} Equivalent`;
  const full = `${base}: Closest Match`;
  return full.length <= 60 ? full : base;
}

/**
 * Description for the test arm. `candidates` are the target brand's matches,
 * closest first. Returns null when there is no match to name.
 */
export function matchTestDescription(
  sourceBrandName: string,
  sourceName: string,
  sourceCode: string | null,
  targetBrandName: string,
  candidates: MatchTestCandidate[],
): string | null {
  const best = candidates[0];
  if (!best) return null;
  const closeness = matchClosenessLabel(best.deltaE).toLowerCase();
  const next = candidates.slice(1, 3).map((c) => withCode(c.name, c.colorNumber));
  const source = `${sourceBrandName} ${withCode(sourceName, sourceCode)}`;
  const lead = `Closest ${targetBrandName} match for ${source}: ${withCode(best.name, best.colorNumber)}, ${closeness}.`;
  const tail = "Digital match, so confirm with a sample.";
  for (let n = next.length; n >= 1; n--) {
    const text = `${lead} Next closest: ${next.slice(0, n).join(", ")}. ${tail}`;
    if (text.length <= 170) return text;
  }
  return `${lead} ${tail}`;
}

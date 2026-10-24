/**
 * Read-only: record which Benjamin Moore color each retired AC- number now
 * points to, so dedupe-colors.ts can fold our 42 AC- rows into the right
 * primary row instead of guessing from an exact hex match.
 *
 * BM's own site treats AC-1..AC-42 as aliases. Its colors API returns an
 * `aliases` field on every color ("CC-530, AC-2" on Brandon Beige 977), and
 * the color pages read the same field. The site's AC- URLs need the old full
 * color name in the path, which our rows do not hold (the colornerd import
 * kept only the first word, "Berkshire" for AC-2), so this pages through the
 * API instead: about 41 requests of 100 colors, paced 1 per second.
 *
 * Output: data/bm-ac-aliases.json (gitignored, local working data)
 *   { fetched_on, source, aliases: [{ code, primary: { number, name, hex }, siblings }], missing }
 *
 * Usage: npx tsx scripts/fetch-bm-aliases.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { UA, getText, getJson } from './lib/palette-sources';
import { canonicalScore } from './lib/dedupe-rules';

const OUT_FILE = path.resolve(__dirname, '../data/bm-ac-aliases.json');
const AC_COUNT = 42;
const PACE_MS = 1000;

export interface BmAcAlias {
  code: string;
  primary: { number: string; name: string; hex: string };
  /** the primary's other aliases, e.g. ["CC-530"] */
  siblings: string[];
  /**
   * Every API entry that lists this AC- number. BM lists some colors twice
   * (968 Dune White and OC-37 Glacier White both carry AC-40), and a few AC-
   * numbers sit on two different colors (AC-36 on 1544 Waynesboro Taupe and
   * HC-87 Ashley Gray). dedupe-rules picks the candidate whose hex is closest
   * to our AC- row, so `primary` is only the fallback.
   */
  candidates: { number: string; name: string; hex: string }[];
}
export interface BmAcAliasFile {
  fetched_on: string;
  source: string;
  aliases: BmAcAlias[];
  missing: string[];
}

type ApiColor = { number: string; name: string; hex: string; aliases?: string };
type ApiPage = { is_last: boolean; total: number; colors: ApiColor[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "CC-530, AC-2" -> ["CC-530", "AC-2"] */
export function parseAliases(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

async function apiKey(): Promise<string> {
  const page = await getText('https://www.benjaminmoore.com/en-us/paint-colors');
  const bundle = page.match(/\/_next\/static\/chunks\/pages\/_app-[0-9a-f]+\.js/)?.[0];
  if (!bundle) throw new Error('_app bundle not found on paint-colors page');
  const js = await getText(`https://www.benjaminmoore.com${bundle}`);
  const key = js.match(/"Ocp-Apim-Subscription-Key":"([0-9a-f]{32})"/)?.[1];
  if (!key) throw new Error('subscription key not found in _app bundle');
  return key;
}

async function main() {
  const key = await apiKey();
  const wanted = new Set(Array.from({ length: AC_COUNT }, (_, i) => `AC-${i + 1}`));
  const hits = new Map<string, { color: ApiColor; aliases: string[] }[]>();
  let seen = 0;

  for (let offset = 0; ; ) {
    await sleep(PACE_MS);
    // The default (non-"simple") response type carries `aliases`.
    const res = await getJson<ApiPage>(
      `https://api.benjaminmoore.io/colors/colors?version=v1.0&locale=en_US&offset=${offset}&limit=100`,
      { headers: { 'Ocp-Apim-Subscription-Key': key, 'User-Agent': UA } },
    );
    for (const c of res.colors) {
      const aliases = parseAliases(c.aliases);
      for (const a of aliases) {
        if (!wanted.has(a)) continue;
        hits.set(a, [...(hits.get(a) ?? []), { color: c, aliases }]);
      }
    }
    seen += res.colors.length;
    process.stdout.write(`\r  ${seen}/${res.total} colors read`);
    if (res.is_last || res.colors.length === 0) break;
    offset += res.colors.length;
    if (offset > 20_000) throw new Error('pagination did not terminate');
  }
  console.log('');
  if (seen < 3500) throw new Error(`only ${seen} colors returned; the API changed, not writing`);

  // `primary` is the candidate BM's own numbering rules prefer (OC-/HC- first).
  const found = new Map<string, BmAcAlias>();
  for (const [code, list] of hits) {
    const best = [...list].sort(
      (x, y) =>
        canonicalScore('benjamin-moore', y.color.number) - canonicalScore('benjamin-moore', x.color.number) ||
        x.color.number.localeCompare(y.color.number),
    )[0];
    found.set(code, {
      code,
      primary: { number: best.color.number.toUpperCase(), name: best.color.name, hex: `#${best.color.hex.toLowerCase()}` },
      siblings: best.aliases.filter((x) => x !== code),
      candidates: list.map((h) => ({ number: h.color.number.toUpperCase(), name: h.color.name, hex: `#${h.color.hex.toLowerCase()}` })),
    });
  }

  const order = (code: string) => Number(code.slice(3));
  const aliases = [...found.values()].sort((a, b) => order(a.code) - order(b.code));
  const missing = [...wanted].filter((c) => !found.has(c)).sort((a, b) => order(a) - order(b));
  const out: BmAcAliasFile = {
    fetched_on: new Date().toISOString().slice(0, 10),
    source: 'api.benjaminmoore.io colors API, `aliases` field',
    aliases,
    missing,
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1) + '\n');
  for (const a of aliases) {
    console.log(`  ${a.code.padEnd(6)} -> ${a.primary.number} ${a.primary.name}${a.siblings.length ? ` (also ${a.siblings.join(', ')})` : ''}${a.candidates.length > 1 ? `  [listed on ${a.candidates.map((c) => `${c.number} ${c.name}`).join(', ')}]` : ''}`);
  }
  console.log(`\n${aliases.length} of ${AC_COUNT} AC- numbers resolved; missing: ${missing.join(', ') || 'none'}`);
  console.log(`Written: ${path.relative(process.cwd(), OUT_FILE)}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

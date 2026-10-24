/**
 * Fix color names against the manufacturer's published name, read from a
 * palette drift scan (data/brand-scans/<date>/<brand>-live.json).
 *
 * Found 2026-10-11: the original import mangled names. "Strand of Pearls®"
 * became "Strand of Pearlsreg", "Jalapeño Pepper" became "Jalapeo Pepper",
 * and ~100 Benjamin Moore CC/CSP names were cut to their first word
 * ("Almond" for CC-280 Almond Bisque, "Blue" for six different colors).
 *
 * Each row whose name differs from the feed lands in one group:
 *   artifact  the DB name is the feed name with characters lost (truncation,
 *             dropped accents, ® rendered as "reg"). Written by --apply.
 *   rename    a different name for the same swatch: the manufacturer renamed
 *             it (BM retired "Gypsy Love", "Navajo Red" and others). Written
 *             only with --apply --renames.
 *   conflict  the code matches but the swatch does not (CIEDE2000 > 5). Never
 *             written; the row needs a human look.
 *   case      same letters, different capitalization ("Painter'S White" for
 *             "Painter's White"). Written only with --apply --case. Names in
 *             KEEP_STYLED are never touched (O'Reilly Green is BM's own styling).
 *
 * PPG codes are matched through normalizePpgCode (the site writes "PPG1104-2",
 * most rows store "1104-2"); before 2026-10-24 none of PPG's renames matched.
 * Other brands match on the code exactly as stored.
 *
 * Name only. Slugs stay as they are (same rule as reconcile-regional.ts):
 * URLs are stable, so there are no redirects to maintain.
 *
 * Usage:
 *   tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/2026-10-11                 # dry run
 *   tsx scripts/apply-published-names.ts --scan-dir=... --brand=benjamin-moore,behr --apply      # artifacts only
 *   tsx scripts/apply-published-names.ts --scan-dir=... --apply --renames                        # artifacts + renames
 *   tsx scripts/apply-published-names.ts --scan-dir=... --brand=kilz,ppg,vista-paint --apply --case   # + capitalization and MANUAL rows
 *   tsx scripts/apply-published-names.ts --revert=scripts/data/backups/published-names-<ts>.json
 *
 * MANUAL rows are written for any brand in --brand (default: benjamin-moore,
 * behr), with or without a <brand>-live.json in the scan directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { deltaE2000, hexToRgb, rgbToLab } from '../src/lib/color-utils';
import { normalizePpgCode } from './lib/palette-sources';
import { caseFix } from './lib/palette-diff';

// Env, scan dir and backups resolve from the working directory, so the script
// can be run from the main checkout even when the file lives in a worktree.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const RENAMES = process.argv.includes('--renames');
const CASE = process.argv.includes('--case');
const scanDir = arg('scan-dir');
const brandArg = arg('brand');
const revertFile = arg('revert');

// Rows the feed no longer lists (discontinued), fixed by hand.
const MANUAL: Record<string, Record<string, string>> = {
  behr: {
    'grape-cr-me-ul250-10': 'Grape Crème', // stored as "Grape CrÃˆme" (UTF-8 read as Latin-1)
    'ultra-pure-white-ppu18-06': 'Ultra Pure White', // "Ultra Pure WhiteÂ®"; the Â defeats the artifact check
    'ultra-pure-white-ppu18-6': 'Ultra Pure White', // not in the feed; drop ® like the other rows
    'painter-s-white-ppu18-8': "Painter's White", // "Painter'S White"; its twin painters-white-ppu18-08 is right
  },
  // Capitalized after the apostrophe at import ("Lion'S Roar").
  kilz: {
    'farmers-road-lg130-01': "Farmer's Road",
    'farmers-tan-lc220-02': "Farmer's Tan",
    'lions-roar-le170-01': "Lion's Roar",
    'seasons-change-lf150-01': "Season's Change",
  },
  ppg: {
    'gigi-s-golden-locket-20yy-29-351': "Gigi's Golden Locket", // "Gigi'S Golden Locket"
    'harper-x27-s-blue-70bg-43-103': "Harper's Blue", // stored as "Harper&#x27;s Blue"
  },
  'vista-paint': {
    'lots-of-lime-ac159': 'Lots of Lime', // "lots of Lime"; its twin lots-of-lime-k-1258 is right
  },
};

// Names styled on purpose that a case-only comparison would otherwise "fix".
const KEEP_STYLED = new Set([
  'benjamin-moore/oreilly-green-555', // O'Reilly Green
  'dunn-edwards/o-brien-orange-det460', // O'Brien Orange
  'sherwin-williams/cote-d-azur-6951', // Cote D'Azur
  'valspar/je-mapelle-missy-8004-10a', // Je M'Apelle Missy
]);

// Code normalization is applied for PPG only; every other brand's names
// match on the code as stored.
const NORMALIZE: Partial<Record<string, (c: string) => string>> = { ppg: normalizePpgCode };

// Renames never written: the feed itself is misspelled.
const SKIP_RENAME = new Set(['behr/frosted-pomegranate-140b-7']); // Behr's feed says "Frosted Pomgranate"

// Feed names written in the catalog's style instead of the feed's.
const FEED_NAME_STYLE: Record<string, string> = {
  'ppg/tantalizing-tan-1070-3': 'Beach Vibes', // pittsburghpaints.com shouts "BEACH VIBES"
};

interface Row { id: string; slug: string; name: string; color_number: string | null; hex: string }
interface LiveColor { code: string; name: string; hex: string | null }
type Group = 'artifact' | 'rename' | 'conflict' | 'case';
interface Change { id: string; brand: string; slug: string; from: string; to: string; group: Group; note?: string }

const code = (s: string | null | undefined) => (s ?? '').trim().toUpperCase();
// Feed names carry HTML entities ("Strand of Pearls&reg;"). Trademark marks
// are dropped: no other row in the catalog shows them.
const ENTITIES: Record<string, string> = {
  '&reg;': '',
  '&trade;': '',
  '&amp;': '&',
  '&#39;': "'",
  '&#x27;': "'",
  '&quot;': '"',
};
const cleanName = (s: string) =>
  s.replace(/&[a-z0-9#]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e).replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();
const letters = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
// True when every character of `short` appears in `long`, in order.
const isSubsequence = (short: string, long: string) => {
  let i = 0;
  for (const ch of long) if (ch === short[i]) i++;
  return i === short.length;
};

function classify(dbName: string, feedName: string, colorCode: string): Group {
  // Drop a trailing "reg" (® mangled at import) and an embedded color code ("Glow (w-b-310)").
  const db = letters(dbName.replace(/reg$/, '')).replace(letters(colorCode), '');
  const feed = letters(feedName);
  if (db.length >= 3 && db[0] === feed[0] && isSubsequence(db, feed)) return 'artifact';
  return 'rename';
}

const lab = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToLab(r, g, b);
};

async function loadBrandRows(supabase: SupabaseClient, brandId: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('colors')
      .select('id, slug, name, color_number, hex')
      .eq('brand_id', brandId)
      .order('slug')
      .range(from, from + 999);
    if (error) throw new Error(`DB read failed: ${error.message}`);
    rows.push(...(data as Row[]));
    if (!data || data.length < 1000) return rows;
  }
}

async function writeAll(supabase: SupabaseClient, changes: Change[]): Promise<number> {
  let done = 0;
  for (const c of changes) {
    // Conditional on the name read, so a concurrent edit is skipped, not overwritten.
    const { error, count } = await supabase
      .from('colors')
      .update({ name: c.to }, { count: 'exact' })
      .eq('id', c.id)
      .eq('name', c.from);
    if (error) throw new Error(`update failed for ${c.slug}: ${error.message} (${done} applied)`);
    if (count !== 1) console.warn(`  skip ${c.slug}: name changed since it was read`);
    else done++;
  }
  return done;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  if (revertFile) {
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as Change[];
    const n = await writeAll(supabase, backup.map((c) => ({ ...c, from: c.to, to: c.from })));
    console.log(`Reverted ${n} of ${backup.length} rows.`);
    return;
  }
  if (!scanDir) {
    console.error('Usage: tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/<date> [--brand=a,b] [--apply [--renames]]');
    process.exit(1);
  }
  const dir = path.resolve(process.cwd(), scanDir);
  const wanted = brandArg ? new Set(brandArg.split(',')) : new Set(['benjamin-moore', 'behr']);
  const { data: brands, error } = await supabase.from('brands').select('id, slug').order('slug');
  if (error) throw new Error(error.message);

  const all: Change[] = [];
  for (const b of brands as { id: string; slug: string }[]) {
    const liveFile = path.join(dir, `${b.slug}-live.json`);
    const manual = MANUAL[b.slug] ?? {};
    const hasLive = fs.existsSync(liveFile);
    if (!wanted.has(b.slug) || (!hasLive && !Object.keys(manual).length)) continue;
    const norm = NORMALIZE[b.slug];
    const key = (s: string | null | undefined) => code(norm && s ? norm(s) : s);
    const byCode = new Map<string, LiveColor>();
    for (const c of hasLive ? (JSON.parse(fs.readFileSync(liveFile, 'utf8')) as LiveColor[]) : []) {
      if (!byCode.has(key(c.code))) byCode.set(key(c.code), c);
    }
    const changes: Change[] = [];
    for (const r of await loadBrandRows(supabase, b.id)) {
      if (KEEP_STYLED.has(`${b.slug}/${r.slug}`)) continue;
      if (manual[r.slug]) {
        if (manual[r.slug] !== r.name) {
          changes.push({ id: r.id, brand: b.slug, slug: r.slug, from: r.name, to: manual[r.slug], group: 'artifact', note: 'manual' });
        }
        continue;
      }
      const c = byCode.get(key(r.color_number));
      if (!c) continue;
      const feedName = FEED_NAME_STYLE[`${b.slug}/${r.slug}`] ?? cleanName(c.name);
      if (feedName === r.name) continue;
      const dE = c.hex ? deltaE2000(lab(r.hex), lab(c.hex)) : 0;
      const note = `${c.code}, dE ${dE.toFixed(1)}`;
      // Capitalization only. Feeds title-case every word ("A Touch Of Gold",
      // "Hush-A-Bye"), so the feed's casing is not copied; only the two import
      // artifacts in caseFix() are, and only with --case.
      if (feedName.toLowerCase() === r.name.toLowerCase()) {
        const fixed = caseFix(r.name, feedName);
        if (fixed !== r.name) changes.push({ id: r.id, brand: b.slug, slug: r.slug, from: r.name, to: fixed, group: 'case', note });
        continue;
      }
      // Straight-vs-curly punctuation only: not worth a write.
      const asciiClean = !/[^\x20-\x7e]/.test(r.name.replace(/[‐’]/g, ''));
      if (asciiClean && letters(feedName) === letters(r.name)) continue;
      const group: Group = dE > 5 ? 'conflict' : classify(r.name, feedName, c.code);
      changes.push({ id: r.id, brand: b.slug, slug: r.slug, from: r.name, to: feedName, group, note });
    }
    for (const g of ['artifact', 'rename', 'case', 'conflict'] as Group[]) {
      const list = changes.filter((c) => c.group === g);
      if (!list.length) continue;
      console.log(`\n[${b.slug}] ${g}: ${list.length}`);
      for (const c of list) console.log(`  ${c.slug.padEnd(36)} "${c.from}" -> "${c.to}"  (${c.note})`);
    }
    all.push(...changes);
  }

  const toWrite = all.filter(
    (c) =>
      c.group === 'artifact' ||
      (CASE && c.group === 'case') ||
      (RENAMES && c.group === 'rename' && !SKIP_RENAME.has(`${c.brand}/${c.slug}`)),
  );
  const groups = all.reduce<Record<string, number>>((acc, c) => ({ ...acc, [`${c.brand}/${c.group}`]: (acc[`${c.brand}/${c.group}`] ?? 0) + 1 }), {});
  console.log('\nTally by brand/group:', groups);
  const scope = ['artifacts', ...(RENAMES ? ['renames'] : []), ...(CASE ? ['case'] : [])].join(' + ');
  console.log(`Would write ${toWrite.length} names (${scope}; --renames and --case add the other groups).`);
  if (!APPLY) {
    console.log('Dry run — no DB changes. Re-run with --apply.');
    return;
  }
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `published-names-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(toWrite, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);
  const n = await writeAll(supabase, toWrite);
  console.log(`Updated ${n} names. Redeploy (or revalidate) so pages pick them up.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

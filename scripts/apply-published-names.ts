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
 *
 * Name only. Slugs stay as they are (same rule as reconcile-regional.ts):
 * URLs are stable, so there are no redirects to maintain.
 *
 * Usage:
 *   tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/2026-10-11                 # dry run
 *   tsx scripts/apply-published-names.ts --scan-dir=... --brand=benjamin-moore,behr --apply      # artifacts only
 *   tsx scripts/apply-published-names.ts --scan-dir=... --apply --renames                        # artifacts + renames
 *   tsx scripts/apply-published-names.ts --revert=scripts/data/backups/published-names-<ts>.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { deltaE2000, hexToRgb, rgbToLab } from '../src/lib/color-utils';

// Env, scan dir and backups resolve from the working directory, so the script
// can be run from the main checkout even when the file lives in a worktree.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const RENAMES = process.argv.includes('--renames');
const scanDir = arg('scan-dir');
const brandArg = arg('brand');
const revertFile = arg('revert');

// Rows the feed no longer lists (discontinued), fixed by hand.
const MANUAL: Record<string, Record<string, string>> = {
  behr: {
    'grape-cr-me-ul250-10': 'Grape Crème', // stored as "Grape CrÃˆme" (UTF-8 read as Latin-1)
    'ultra-pure-white-ppu18-06': 'Ultra Pure White', // "Ultra Pure WhiteÂ®"; the Â defeats the artifact check
    'ultra-pure-white-ppu18-6': 'Ultra Pure White', // not in the feed; drop ® like the other rows
  },
};

interface Row { id: string; slug: string; name: string; color_number: string | null; hex: string }
interface LiveColor { code: string; name: string; hex: string }
type Group = 'artifact' | 'rename' | 'conflict';
interface Change { id: string; slug: string; from: string; to: string; group: Group; note?: string }

const code = (s: string | null | undefined) => (s ?? '').trim().toUpperCase();
// Feed names carry HTML entities ("Strand of Pearls&reg;"). Trademark marks
// are dropped: no other row in the catalog shows them.
const ENTITIES: Record<string, string> = { '&reg;': '', '&trade;': '', '&amp;': '&', '&#39;': "'", '&quot;': '"' };
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
    if (!wanted.has(b.slug) || !fs.existsSync(liveFile)) continue;
    const byCode = new Map<string, LiveColor>();
    for (const c of JSON.parse(fs.readFileSync(liveFile, 'utf8')) as LiveColor[]) {
      if (!byCode.has(code(c.code))) byCode.set(code(c.code), c);
    }
    const manual = MANUAL[b.slug] ?? {};
    const changes: Change[] = [];
    for (const r of await loadBrandRows(supabase, b.id)) {
      if (manual[r.slug] && manual[r.slug] !== r.name) {
        changes.push({ id: r.id, slug: r.slug, from: r.name, to: manual[r.slug], group: 'artifact', note: 'manual' });
        continue;
      }
      const c = byCode.get(code(r.color_number));
      if (!c) continue;
      const to = cleanName(c.name);
      if (to === r.name) continue;
      // Case or straight-vs-curly punctuation only: not worth a write.
      if (letters(to) === letters(r.name) && !/[^\x20-\x7e]/.test(r.name.replace(/[‐’]/g, ''))) continue;
      const dE = deltaE2000(lab(r.hex), lab(c.hex));
      const group: Group = dE > 5 ? 'conflict' : classify(r.name, to, c.code);
      changes.push({ id: r.id, slug: r.slug, from: r.name, to, group, note: `${c.code}, dE ${dE.toFixed(1)}` });
    }
    for (const g of ['artifact', 'rename', 'conflict'] as Group[]) {
      const list = changes.filter((c) => c.group === g);
      if (!list.length) continue;
      console.log(`\n[${b.slug}] ${g}: ${list.length}`);
      for (const c of list) console.log(`  ${c.slug.padEnd(36)} "${c.from}" -> "${c.to}"  (${c.note})`);
    }
    all.push(...changes);
  }

  const toWrite = all.filter((c) => c.group === 'artifact' || (RENAMES && c.group === 'rename'));
  console.log(`\nWould write ${toWrite.length} names (${RENAMES ? 'artifacts + renames' : 'artifacts only; add --renames for renames'}).`);
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

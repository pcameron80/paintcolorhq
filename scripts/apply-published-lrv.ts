/**
 * Set colors.lrv to the manufacturer's published LRV, read from a palette
 * drift scan (data/brand-scans/<date>/<brand>-live.json).
 *
 * Why: most rows still carry the LRV computed from hex at import (migration
 * 004). scrape-bm-lrv.ts / scrape-behr-lrv.ts only overwrote rows off by 2+,
 * so ~1,250 Benjamin Moore rows stayed 1-2 points off the published value
 * (Hale Navy HC-154: 7.1 stored, 8.4 published). Brands whose feed carries
 * LRV: Benjamin Moore, Behr, Sherwin-Williams, Dutch Boy.
 *
 * Scope: LRV only. Rows listed in <brand>-hex-changed.json are skipped;
 * apply-hex-corrections.ts owns those and sets their LRV with the hex.
 * LRV does not feed Delta E, so matches do not need recomputing.
 *
 * Matching: color_number, then alternate_numbers. A row whose name does not
 * match the feed entry's name is reported and skipped, never written.
 * Each write is conditional on the row's lrv still holding the value read,
 * so a concurrent edit is skipped rather than overwritten.
 *
 * Usage:
 *   tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/2026-10-11              # dry run
 *   tsx scripts/apply-published-lrv.ts --scan-dir=... --brand=benjamin-moore --apply       # writes, backup first
 *   tsx scripts/apply-published-lrv.ts --revert=scripts/data/backups/published-lrv-<ts>.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Env, scan dir and backups resolve from the working directory, so the script
// can be run from the main checkout even when the file lives in a worktree.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');
const scanDir = arg('scan-dir');
const brandArg = arg('brand');
const revertFile = arg('revert');

interface Row {
  id: string;
  slug: string;
  name: string;
  color_number: string | null;
  alternate_numbers: string[] | null;
  lrv: number | string | null;
}
interface LiveColor {
  code: string;
  name: string;
  lrv?: number;
}
interface Update {
  id: string;
  slug: string;
  from: number | null;
  to: number;
}

// Feed codes whose LRV disagrees with the manufacturer's own color page.
// BM's API gives premixed PM- codes their own LRV (PM-1 Super White 89.1)
// while the color page shows the base color's (87.36). Checked 2026-10-11.
const SKIP_CODES: Record<string, RegExp> = { 'benjamin-moore': /^PM-/ };

const code = (s: string | null | undefined) => (s ?? '').trim().toUpperCase();
// Compare names loosely: case, punctuation, accents and trademark marks differ
// between feed and DB without being different colors.
const nameKey = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[®™]|\breg$/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

async function loadBrandRows(supabase: SupabaseClient, brandId: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('colors')
      .select('id, slug, name, color_number, alternate_numbers, lrv')
      .eq('brand_id', brandId)
      .order('slug')
      .range(from, from + 999);
    if (error) throw new Error(`DB read failed: ${error.message}`);
    rows.push(...(data as Row[]));
    if (!data || data.length < 1000) return rows;
  }
}

async function writeAll(supabase: SupabaseClient, updates: Update[]): Promise<number> {
  let done = 0;
  let skipped = 0;
  let failed = 0;
  await pool(updates, 8, async (u) => {
    let q = supabase.from('colors').update({ lrv: u.to }, { count: 'exact' }).eq('id', u.id);
    q = u.from === null ? q.is('lrv', null) : q.eq('lrv', u.from);
    const { error, count } = await q;
    if (error) {
      failed++;
      console.error(`  update failed for ${u.slug}: ${error.message}`);
    } else if (count !== 1) {
      skipped++;
      console.warn(`  skip ${u.slug}: lrv changed since it was read`);
    } else if (++done % 500 === 0) {
      console.log(`  ${done}/${updates.length}`);
    }
  });
  if (skipped) console.warn(`${skipped} rows skipped (edited concurrently).`);
  if (failed) throw new Error(`${failed} updates failed; ${done} applied. Re-run is safe (applied rows match and are skipped).`);
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
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as Update[];
    // Revert swaps from/to so the conditional write only touches rows still at the applied value.
    const n = await writeAll(supabase, backup.map((u) => ({ ...u, from: u.to, to: u.from as number })));
    console.log(`Reverted ${n} of ${backup.length} rows.`);
    return;
  }
  if (!scanDir) {
    console.error('Usage: tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/<date> [--brand=a,b] [--apply]');
    process.exit(1);
  }
  const dir = path.resolve(process.cwd(), scanDir);
  const wanted = brandArg ? new Set(brandArg.split(',')) : null;
  const { data: brands, error } = await supabase.from('brands').select('id, slug').order('slug');
  if (error) throw new Error(error.message);

  const updates: Update[] = [];
  for (const b of brands as { id: string; slug: string }[]) {
    const liveFile = path.join(dir, `${b.slug}-live.json`);
    if ((wanted && !wanted.has(b.slug)) || !fs.existsSync(liveFile)) continue;
    const live = JSON.parse(fs.readFileSync(liveFile, 'utf8')) as LiveColor[];
    if (!live.some((c) => c.lrv != null)) continue;

    const byCode = new Map<string, LiveColor>();
    // Some feeds encode a missing LRV as 0 (Sherwin-Williams 6995 Superwhite); no paint has a published LRV of 0.
    const skipCode = SKIP_CODES[b.slug];
    for (const c of live) {
      if (c.lrv == null || c.lrv <= 0 || skipCode?.test(code(c.code)) || byCode.has(code(c.code))) continue;
      byCode.set(code(c.code), c);
    }
    const hexFile = path.join(dir, `${b.slug}-hex-changed.json`);
    const hexOwned = new Set(
      fs.existsSync(hexFile) ? (JSON.parse(fs.readFileSync(hexFile, 'utf8')) as { slug?: string }[]).map((h) => h.slug) : [],
    );

    const tally = { rows: 0, matched: 0, hexOwned: 0, nameMismatch: 0, truncatedName: 0, same: 0, update: 0, over1: 0 };
    const mismatches: string[] = [];
    const brandUpdates: Update[] = [];
    for (const r of await loadBrandRows(supabase, b.id)) {
      tally.rows++;
      const c = byCode.get(code(r.color_number)) ?? (r.alternate_numbers ?? []).map((a) => byCode.get(code(a))).find(Boolean);
      if (!c) continue;
      tally.matched++;
      if (hexOwned.has(r.slug)) { tally.hexOwned++; continue; }
      // Prefix match tolerates names truncated at import ("Almond" for CC-280 Almond Bisque).
      const [dbName, feedName] = [nameKey(r.name), nameKey(c.name)];
      if (!dbName || !feedName.startsWith(dbName)) {
        tally.nameMismatch++;
        mismatches.push(`${r.slug} ("${r.name}" vs feed "${c.name}" ${c.code})`);
        continue;
      }
      if (dbName !== feedName) tally.truncatedName++;
      const to = Math.round(c.lrv! * 10) / 10;
      const from = r.lrv == null ? null : Number(r.lrv);
      if (from !== null && Math.abs(from - to) < 0.05) { tally.same++; continue; }
      tally.update++;
      if (from === null || Math.abs(from - to) >= 1) tally.over1++;
      brandUpdates.push({ id: r.id, slug: r.slug, from, to });
    }
    console.log(`[${b.slug}]`, tally);
    if (mismatches.length) {
      console.log(`  name mismatches (skipped):`);
      for (const m of VERBOSE ? mismatches : mismatches.slice(0, 15)) console.log(`    ${m}`);
      if (!VERBOSE && mismatches.length > 15) console.log(`    ... ${mismatches.length - 15} more (--verbose)`);
    }
    brandUpdates.sort((x, y) => Math.abs(y.to - (y.from ?? 0)) - Math.abs(x.to - (x.from ?? 0)));
    for (const u of brandUpdates.slice(0, VERBOSE ? Infinity : 8)) console.log(`    ${u.slug.padEnd(40)} ${u.from} -> ${u.to}`);
    updates.push(...brandUpdates);
  }

  console.log(`\nTotal rows to update: ${updates.length}`);
  if (!APPLY) {
    console.log('Dry run — no DB changes. Re-run with --apply.');
    return;
  }
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `published-lrv-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(updates, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);
  const n = await writeAll(supabase, updates);
  console.log(`Updated ${n} rows. Redeploy (or revalidate) so color pages pick up the new values.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * Set colors.lrv to the manufacturer's published LRV, read from a palette
 * drift scan (data/brand-scans/<date>/<brand>-live.json).
 *
 * Why: most rows still carry the LRV computed from hex at import (migration
 * 004). scrape-bm-lrv.ts / scrape-behr-lrv.ts only overwrote rows off by 2+,
 * so ~1,250 Benjamin Moore rows stayed 1-2 points off the published value
 * (Hale Navy HC-154: 7.1 stored, 8.4 published). Brands whose feed carries
 * LRV: Benjamin Moore, Behr, Sherwin-Williams, Dutch Boy, and since
 * 2026-10-24 Dunn-Edwards, Hirshfield's, Vista Paint and PPG (all four read
 * it off pages the scan already fetches).
 *
 * Scope: LRV only. Rows listed in <brand>-hex-changed.json are skipped;
 * apply-hex-corrections.ts owns those and sets their LRV with the hex.
 * LRV does not feed Delta E, so matches do not need recomputing.
 *
 * Matching: color_number, then alternate_numbers, both mapped through the
 * brand's normalizeCode from scripts/lib/palette-sources.ts (Behr "PR-W05"
 * and "PR-W5" are one code; PPG's "PPG1104-2" is our "1104-2"). Every DB row
 * holding the code is updated, so duplicate rows stay in step. A row whose
 * name does not match the feed entry's name is reported and skipped.
 *
 * Guards: a change under --min-diff (default 0.05) is not written. A change
 * larger than --max-delta (default 10 points) is listed as an outlier for
 * review and not written: a jump that size usually means the code points at
 * a different color, not a corrected LRV.
 * Each write is conditional on the row's lrv still holding the value read,
 * so a concurrent edit is skipped rather than overwritten.
 * The 13 head colors (src/lib/head-colors.ts) are frozen until 2026-11-27 and
 * skipped unless --include-head is passed.
 *
 * Source: once migration 017 is applied, each write also sets
 * lrv_source = 'manufacturer' and lrv_checked_on (--checked-on, else the scan
 * dir's date, else today), and the backup records the old values so --revert
 * restores them. Before the migration only lrv is written; run
 * backfill-lrv-source.ts afterwards to label those rows.
 *
 * Usage:
 *   tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/2026-10-11              # dry run
 *   tsx scripts/apply-published-lrv.ts --scan-dir=... --brand=dunn-edwards --verbose        # every row, per-prefix tally
 *   tsx scripts/apply-published-lrv.ts --scan-dir=... --min-diff=0.5 --max-delta=10         # thresholds
 *   tsx scripts/apply-published-lrv.ts --scan-dir=... --brand=benjamin-moore --apply       # writes, backup first
 *   tsx scripts/apply-published-lrv.ts --scan-dir=... --checked-on=2026-10-24             # lrv_checked_on (017)
 *   tsx scripts/apply-published-lrv.ts --revert=scripts/data/backups/published-lrv-<ts>.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  HEAD_KEYS,
  feedLrvIndex,
  hasLrvSourceColumn,
  loadBrandRows,
  namesAgree,
  nameKey,
  scanDate,
} from './lib/lrv-source';

// Env, scan dir and backups resolve from the working directory, so the script
// can be run from the main checkout even when the file lives in a worktree.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');
const INCLUDE_HEAD = process.argv.includes('--include-head');
const scanDir = arg('scan-dir');
const brandArg = arg('brand');
const revertFile = arg('revert');
const numArg = (name: string, dflt: number) => {
  const v = arg(name);
  if (v === undefined) return dflt;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`--${name} must be a non-negative number, got "${v}"`);
  return n;
};
const MIN_DIFF = numArg('min-diff', 0.05);
const MAX_DELTA = numArg('max-delta', 10);

interface Row {
  id: string;
  slug: string;
  name: string;
  color_number: string | null;
  alternate_numbers: string[] | null;
  lrv: number | string | null;
  lrv_source?: string | null;
  lrv_checked_on?: string | null;
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
  /** Present only when migration 017 is applied: the row's lrv_source / lrv_checked_on before the write. */
  fromSource?: string | null;
  fromCheckedOn?: string | null;
}
interface SourcePatch {
  lrv_source: string | null;
  lrv_checked_on: string | null;
}

// Leading letters of a code, for the per-prefix tally ("DET477" -> "DET", "0471" -> "#").
const prefixOf = (c: string) => c.match(/^[A-Z]+/)?.[0] ?? '#';

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// source: the lrv_source / lrv_checked_on to write with each row (migration 017), or a
// per-row function (revert restores each row's own previous values), or null before 017.
async function writeAll(
  supabase: SupabaseClient,
  updates: Update[],
  source: SourcePatch | ((u: Update) => SourcePatch) | null,
): Promise<number> {
  let done = 0;
  let skipped = 0;
  let failed = 0;
  await pool(updates, 8, async (u) => {
    const extra = typeof source === 'function' ? source(u) : source ?? {};
    let q = supabase.from('colors').update({ lrv: u.to, ...extra }, { count: 'exact' }).eq('id', u.id);
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
  const withSource = await hasLrvSourceColumn(supabase);

  if (revertFile) {
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as Update[];
    // Backups written after migration 017 carry each row's previous source; restore it alongside lrv.
    const hasSourceInBackup = backup.some((u) => 'fromSource' in u);
    if (hasSourceInBackup && !withSource) throw new Error('Backup has lrv_source values but the column is missing; was migration 017 rolled back?');
    // Revert swaps from/to so the conditional write only touches rows still at the applied value.
    const n = await writeAll(
      supabase,
      backup.map((u) => ({ ...u, from: u.to, to: u.from as number })),
      hasSourceInBackup ? (u) => ({ lrv_source: u.fromSource ?? null, lrv_checked_on: u.fromCheckedOn ?? null }) : null,
    );
    console.log(`Reverted ${n} of ${backup.length} rows.`);
    return;
  }
  if (!scanDir) {
    console.error('Usage: tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/<date> [--brand=a,b] [--apply]');
    process.exit(1);
  }
  const dir = path.resolve(process.cwd(), scanDir);
  const checkedOn = arg('checked-on') ?? scanDate(dir) ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)) throw new Error(`--checked-on must be YYYY-MM-DD, got "${checkedOn}"`);
  console.log(withSource
    ? `lrv_source column present: writes set lrv_source='manufacturer', lrv_checked_on=${checkedOn}.`
    : 'lrv_source column absent (migration 017 not applied): writes set lrv only. Run backfill-lrv-source.ts after the migration.');
  const wanted = brandArg ? new Set(brandArg.split(',')) : null;
  const { data: brands, error } = await supabase.from('brands').select('id, slug').order('slug');
  if (error) throw new Error(error.message);

  const updates: Update[] = [];
  for (const b of brands as { id: string; slug: string }[]) {
    const liveFile = path.join(dir, `${b.slug}-live.json`);
    if ((wanted && !wanted.has(b.slug)) || !fs.existsSync(liveFile)) continue;
    const live = JSON.parse(fs.readFileSync(liveFile, 'utf8')) as LiveColor[];
    if (!live.some((c) => c.lrv != null)) continue;

    // Feed values of 0, over 100, BM PM- and Vista R codes are not usable LRVs (scripts/lib/lrv-source.ts).
    const feed = feedLrvIndex(b.slug, live);
    const key = feed.key;
    const hexFile = path.join(dir, `${b.slug}-hex-changed.json`);
    const hexOwned = new Set(
      fs.existsSync(hexFile) ? (JSON.parse(fs.readFileSync(hexFile, 'utf8')) as { slug?: string }[]).map((h) => h.slug) : [],
    );

    const tally = { rows: 0, matched: 0, hexOwned: 0, head: 0, nameMismatch: 0, truncatedName: 0, same: 0, update: 0, over1: 0, over3: 0, outlier: 0 };
    const mismatches: string[] = [];
    const outliers: string[] = [];
    const byPrefix = new Map<string, { update: number; over3: number; outlier: number; sumAbs: number }>();
    const brandUpdates: Update[] = [];
    const fields = `id, slug, name, color_number, alternate_numbers, lrv${withSource ? ', lrv_source, lrv_checked_on' : ''}`;
    for (const r of await loadBrandRows<Row>(supabase, b.id, fields)) {
      tally.rows++;
      const c = feed.lookup(r);
      if (!c) continue;
      tally.matched++;
      if (hexOwned.has(r.slug)) { tally.hexOwned++; continue; }
      if (!INCLUDE_HEAD && HEAD_KEYS.has(`${b.slug}/${r.slug}`)) { tally.head++; continue; }
      // Prefix match tolerates names truncated at import ("Almond" for CC-280 Almond Bisque).
      if (!namesAgree(r.name, c.name)) {
        tally.nameMismatch++;
        mismatches.push(`${r.slug} ("${r.name}" vs feed "${c.name}" ${c.code})`);
        continue;
      }
      if (nameKey(r.name) !== nameKey(c.name)) tally.truncatedName++;
      const to = c.published;
      const from = r.lrv == null ? null : Number(r.lrv);
      const delta = from === null ? null : Math.abs(from - to);
      if (delta !== null && delta < Math.max(MIN_DIFF, 1e-9)) { tally.same++; continue; }
      const p = byPrefix.get(prefixOf(key(r.color_number))) ?? { update: 0, over3: 0, outlier: 0, sumAbs: 0 };
      byPrefix.set(prefixOf(key(r.color_number)), p);
      if (delta !== null && delta > MAX_DELTA) {
        tally.outlier++;
        p.outlier++;
        outliers.push(`${r.slug.padEnd(40)} ${r.color_number} "${r.name}": ${from} -> ${to} (feed ${c.code} "${c.name}")`);
        continue;
      }
      tally.update++;
      p.update++;
      if (delta === null || delta >= 1) tally.over1++;
      if (delta === null || delta >= 3) { tally.over3++; p.over3++; }
      p.sumAbs += delta ?? 0;
      brandUpdates.push({
        id: r.id,
        slug: r.slug,
        from,
        to,
        ...(withSource ? { fromSource: r.lrv_source ?? null, fromCheckedOn: r.lrv_checked_on ?? null } : {}),
      });
    }
    console.log(`[${b.slug}]`, tally);
    console.log('  by prefix (update / off by 3+ / outlier / mean shift):');
    for (const [pre, p] of [...byPrefix].sort((x, y) => y[1].update - x[1].update)) {
      console.log(`    ${pre.padEnd(6)} ${String(p.update).padStart(5)} ${String(p.over3).padStart(5)} ${String(p.outlier).padStart(4)}  ${p.update ? (p.sumAbs / p.update).toFixed(2) : '-'}`);
    }
    if (outliers.length) {
      console.log(`  outliers over --max-delta=${MAX_DELTA} (not written; review by hand):`);
      for (const o of outliers) console.log(`    ${o}`);
    }
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
  const n = await writeAll(supabase, updates, withSource ? { lrv_source: 'manufacturer', lrv_checked_on: checkedOn } : null);
  console.log(`Updated ${n} rows. Redeploy (or revalidate) so color pages pick up the new values.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

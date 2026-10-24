/**
 * Label every colors row's LRV as 'manufacturer' or 'computed'
 * (colors.lrv_source, migration 017), from palette drift scans.
 *
 * Why: about 9,000 Benjamin Moore and Behr rows already hold the
 * manufacturer's published LRV (scrape-bm-lrv, scrape-behr-lrv and the
 * 2026-10-11 apply-published-lrv run), and the 2026-11 runs add Dunn-Edwards,
 * Hirshfield's, Vista, PPG, Sherwin-Williams and Dutch Boy. Every color page
 * still says "estimated", because nothing recorded which values are
 * published. MP-80 reads this column to label them.
 *
 * Rule: a row is 'manufacturer' when its stored lrv equals the brand feed's
 * published LRV for that code (within --tolerance, default 0.05) and its
 * name matches the feed entry, with the same code and name matching as
 * apply-published-lrv.ts (scripts/lib/lrv-source.ts). lrv_checked_on is the
 * scan's date. Rows with no LRV get NULL for both, in every brand.
 *
 * Demotion is narrow, so a re-run with a partial scan cannot undo earlier
 * work. A row already labeled 'manufacturer' is demoted to 'computed' only
 * when the feed has its code, the name agrees, and the value no longer
 * matches. A 'manufacturer' row whose code is missing from the feed (an
 * archived color) or whose name disagrees keeps its label and date. A brand
 * with no live file in the --scan-dir list is left as-is ("no feed"): only
 * its rows with no LRV are normalized. --demote-missing turns both of those
 * into demotions (for a brand with no feed, only when --brand names it), for
 * a deliberate full reset.
 *
 * Only lrv_source and lrv_checked_on are written. migration 014's
 * content_updated_at trigger does not watch them, so the sitemap lastmod of
 * ~25,000 color pages does not move; the page change ships with MP-80.
 * Each write is conditional on the row's lrv and lrv_source still holding the
 * values read. The 13 head colors are skipped unless --include-head.
 *
 * Also prints the LRV ceiling check: every row above LRV_CEILING (94.5)
 * that would not be labeled 'manufacturer'. That list should be empty once
 * the LRV corrections and apply-lrv-nulls.ts are applied.
 *
 * Safe to re-run after any LRV or import step, with any subset of scan dirs:
 * without --demote-missing it never removes a 'manufacturer' label except
 * where the feed it was given shows a different value.
 *
 * Usage (from the main checkout, after migration 017):
 *   tsx scripts/backfill-lrv-source.ts --scan-dir=data/brand-scans/2026-10-11,data/brand-scans/2026-10-24   # dry run
 *   tsx scripts/backfill-lrv-source.ts --scan-dir=... --brand=benjamin-moore,behr --verbose
 *   tsx scripts/backfill-lrv-source.ts --scan-dir=... --apply              # writes, backup first
 *   tsx scripts/backfill-lrv-source.ts --revert=scripts/data/backups/lrv-source-<ts>.json
 *
 * --scan-dir takes a comma-separated list; for a brand present in several,
 * the last dir listed wins. The dry run works before the migration (every
 * current value is read as the column default) so the counts can be reviewed
 * first; --apply refuses until the columns exist.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { pool } from './lib/palette-sources';
import {
  HEAD_KEYS,
  LRV_CEILING,
  feedLrvIndex,
  hasLrvSourceColumn,
  loadBrandRows,
  namesAgree,
  scanDate,
  type FeedColor,
  type LrvSource,
} from './lib/lrv-source';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');
const INCLUDE_HEAD = process.argv.includes('--include-head');
const DEMOTE_MISSING = process.argv.includes('--demote-missing');
const scanDirs = (arg('scan-dir') ?? '').split(',').filter(Boolean);
const brandArg = arg('brand');
const revertFile = arg('revert');
const TOLERANCE = Number(arg('tolerance') ?? 0.05);
if (!Number.isFinite(TOLERANCE) || TOLERANCE < 0 || TOLERANCE > 0.5) throw new Error('--tolerance must be between 0 and 0.5');

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
interface SourceState {
  lrv_source: LrvSource | null;
  lrv_checked_on: string | null;
}
interface Change {
  id: string;
  slug: string;
  brand: string;
  lrv: number | null;
  from: SourceState;
  to: SourceState;
}

async function writeAll(supabase: SupabaseClient, changes: Change[]): Promise<number> {
  let done = 0;
  let skipped = 0;
  let failed = 0;
  await pool(changes, 8, async (c) => {
    let q = supabase.from('colors').update(c.to, { count: 'exact' }).eq('id', c.id);
    q = c.lrv === null ? q.is('lrv', null) : q.eq('lrv', c.lrv);
    q = c.from.lrv_source === null ? q.is('lrv_source', null) : q.eq('lrv_source', c.from.lrv_source);
    const { error, count } = await q;
    if (error) {
      failed++;
      console.error(`  update failed for ${c.brand}/${c.slug}: ${error.message}`);
    } else if (count !== 1) {
      skipped++;
      console.warn(`  skip ${c.brand}/${c.slug}: lrv or lrv_source changed since it was read`);
    } else if (++done % 1000 === 0) {
      console.log(`  ${done}/${changes.length}`);
    }
  });
  if (skipped) console.warn(`${skipped} rows skipped (edited concurrently).`);
  if (failed) throw new Error(`${failed} updates failed; ${done} applied. Re-run is safe (applied rows read as unchanged).`);
  return done;
}

/** Latest live file per brand slug across the scan dirs (last dir wins). */
function liveFiles(): Map<string, { file: string; date: string }> {
  const out = new Map<string, { file: string; date: string }>();
  for (const d of scanDirs) {
    const dir = path.resolve(process.cwd(), d);
    if (!fs.existsSync(dir)) throw new Error(`scan dir not found: ${dir}`);
    const date = scanDate(dir);
    if (!date) throw new Error(`scan dir must end in a YYYY-MM-DD folder (it sets lrv_checked_on): ${dir}`);
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(.+)-live\.json$/);
      if (m) out.set(m[1], { file: path.join(dir, f), date });
    }
  }
  return out;
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
    if (!withSource) throw new Error('lrv_source column missing; nothing to revert.');
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as Change[];
    const n = await writeAll(supabase, backup.map((c) => ({ ...c, from: c.to, to: c.from })));
    console.log(`Reverted ${n} of ${backup.length} rows.`);
    return;
  }
  if (!scanDirs.length) {
    console.error('Usage: tsx scripts/backfill-lrv-source.ts --scan-dir=data/brand-scans/<date>[,<date>...] [--brand=a,b] [--demote-missing] [--apply]');
    process.exit(1);
  }
  if (APPLY && !withSource) {
    console.error('colors.lrv_source does not exist yet. Apply supabase/migrations/017_colors_lrv_source.sql first.');
    process.exit(1);
  }
  if (!withSource) console.log('lrv_source column absent: dry run reads every row as the migration will leave it (computed, or NULL with no LRV).\n');

  const files = liveFiles();
  const wanted = brandArg ? new Set(brandArg.split(',')) : null;
  const { data: brands, error } = await supabase.from('brands').select('id, slug').order('slug');
  if (error) throw new Error(error.message);

  const changes: Change[] = [];
  const ceiling: string[] = [];
  const totals: Record<string, number> = {};
  const fields = `id, slug, name, color_number, alternate_numbers, lrv${withSource ? ', lrv_source, lrv_checked_on' : ''}`;
  for (const b of brands as { id: string; slug: string }[]) {
    if (wanted && !wanted.has(b.slug)) continue;
    const src = files.get(b.slug);
    const live = src ? (JSON.parse(fs.readFileSync(src.file, 'utf8')) as FeedColor[]) : [];
    const feed = feedLrvIndex(b.slug, live);
    const hasFeed = !!src && feed.size > 0;
    const named = !!wanted?.has(b.slug);
    // A label is only removed on evidence from a feed, unless a reset is asked for.
    const demoteUnconfirmed = DEMOTE_MISSING && (hasFeed || named);
    const tally = { rows: 0, noLrv: 0, head: 0, matched: 0, nameMismatch: 0, offFeed: 0, notInFeed: 0, manufacturer: 0, kept: 0, computed: 0, newManufacturer: 0, refreshed: 0, demoted: 0, unchanged: 0 };
    const demotions: string[] = [];

    for (const r of await loadBrandRows<Row>(supabase, b.id, fields)) {
      tally.rows++;
      const lrv = r.lrv == null ? null : Number(r.lrv);
      // Before the migration, read each row as 017 leaves it.
      const from: SourceState = withSource
        ? { lrv_source: (r.lrv_source ?? null) as LrvSource | null, lrv_checked_on: r.lrv_checked_on ?? null }
        : { lrv_source: lrv === null ? null : 'computed', lrv_checked_on: null };
      if (!INCLUDE_HEAD && HEAD_KEYS.has(`${b.slug}/${r.slug}`)) { tally.head++; continue; }

      let to: SourceState;
      if (lrv === null) {
        tally.noLrv++;
        to = { lrv_source: null, lrv_checked_on: null };
      } else {
        const c = hasFeed ? feed.lookup(r) : undefined;
        let verdict: 'published' | 'differs' | 'nameMismatch' | 'notInFeed' = 'notInFeed';
        if (c) {
          tally.matched++;
          if (!namesAgree(r.name, c.name)) verdict = 'nameMismatch';
          else if (Math.abs(lrv - c.published) < TOLERANCE + 1e-9) verdict = 'published';
          else verdict = 'differs';
        }
        if (verdict === 'nameMismatch') tally.nameMismatch++;
        else if (verdict === 'differs') tally.offFeed++;
        else if (verdict === 'notInFeed') tally.notInFeed++;

        if (verdict === 'published') {
          to = { lrv_source: 'manufacturer', lrv_checked_on: src!.date };
          tally.manufacturer++;
        } else if (from.lrv_source === 'manufacturer' && verdict !== 'differs' && !demoteUnconfirmed) {
          // No feed evidence against the label: keep it and its date.
          to = from;
          tally.kept++;
        } else {
          to = { lrv_source: 'computed', lrv_checked_on: null };
          tally.computed++;
        }
        if (lrv > LRV_CEILING && to.lrv_source !== 'manufacturer') ceiling.push(`${b.slug}/${r.slug} "${r.name}" ${r.color_number ?? ''}: ${lrv}`);
      }

      if (to.lrv_source === from.lrv_source && to.lrv_checked_on === from.lrv_checked_on) { tally.unchanged++; continue; }
      if (to.lrv_source === 'manufacturer') {
        if (from.lrv_source === 'manufacturer') tally.refreshed++;
        else tally.newManufacturer++;
      } else if (from.lrv_source === 'manufacturer') {
        tally.demoted++;
        demotions.push(`${r.slug} ${r.color_number ?? ''}: ${lrv}`);
      }
      changes.push({ id: r.id, slug: r.slug, brand: b.slug, lrv, from, to });
    }
    for (const [k, v] of Object.entries(tally)) totals[k] = (totals[k] ?? 0) + v;
    const feedNote = hasFeed
      ? `feed ${path.relative(process.cwd(), src!.file)} (${feed.size} published LRVs)`
      : `no feed, labels left as-is${demoteUnconfirmed ? ' (--demote-missing: manufacturer labels demoted)' : ''}; only rows with no LRV normalized`;
    if (!hasFeed && named && !demoteUnconfirmed) console.warn(`  --brand names ${b.slug} but no live file in --scan-dir has published LRVs for it.`);
    console.log(`[${b.slug}] ${feedNote}`);
    console.log('  ', tally);
    if (demotions.length) {
      console.log(`  demoted to computed (labeled manufacturer${demoteUnconfirmed ? ', not confirmed by the feed' : ', feed shows a different value'}):`);
      for (const d of VERBOSE ? demotions : demotions.slice(0, 10)) console.log(`    ${d}`);
      if (!VERBOSE && demotions.length > 10) console.log(`    ... ${demotions.length - 10} more (--verbose)`);
    }
  }

  console.log('\nTotals:', totals);
  console.log(`\nLRV ceiling check: ${ceiling.length} rows above ${LRV_CEILING} that are not a published value${ceiling.length ? ':' : '.'}`);
  for (const c of VERBOSE ? ceiling : ceiling.slice(0, 40)) console.log(`  ${c}`);
  if (!VERBOSE && ceiling.length > 40) console.log(`  ... ${ceiling.length - 40} more (--verbose)`);

  console.log(`\nRows to write: ${changes.length}`);
  if (!APPLY) {
    console.log('Dry run — no DB changes. Re-run with --apply.');
    return;
  }
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `lrv-source-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(changes, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);
  const n = await writeAll(supabase, changes);
  console.log(`Updated ${n} rows. No redeploy needed until MP-80 reads the column.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

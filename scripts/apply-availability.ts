/**
 * Apply color availability states from a palette scan
 * (docs/superpowers/specs/2026-10-11-color-availability-states-design.md).
 *
 * A state changes only on evidence:
 *   - A brand's feed flags the color archived AND the brand has a recorded,
 *     passing retailer spot check in EVIDENCE below -> 'retired'.
 *   - A row the feed lists as current that we hold as 'retired' -> 'current'
 *     (the brand brought it back).
 *   - 'discontinued' is never set here: it needs positive evidence that the
 *     color cannot be bought, which no feed flag provides.
 * Rows absent from the feed are left alone; their last_seen_live_on simply
 * stops advancing. Matching uses the row's own color_number only, never an
 * alias (BM premix aliases carry different data than the colors they alias).
 *
 * Also stamps last_seen_live_on = scan date on every row found in the feed.
 *
 * Usage:
 *   tsx scripts/apply-availability.ts --scan-dir=data/brand-scans/2026-10-11            # dry run
 *   tsx scripts/apply-availability.ts --scan-dir=data/brand-scans/2026-10-11 --apply    # backup first
 *   tsx scripts/apply-availability.ts --revert=scripts/data/backups/availability-<ts>.json
 *
 * Retired colors become match targets again, so recompute matches afterwards
 * (export-db-colors, compute-matches, TRUNCATE + seed-matches) and redeploy.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SOURCES, pool } from './lib/palette-sources';
import { normCode, type LiveColor } from './lib/palette-diff';

dotenv.config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });

/**
 * Brands whose archive flag has been verified to mean "still buyable".
 * Each entry records the brand's own statement and the spot check behind it.
 * Add a brand here only after its check passes.
 */
const EVIDENCE: Record<string, { checkedOn: string; source: string }> = {
  behr: {
    checkedOn: '2026-10-11',
    source:
      "Behr feed archived=true; behr.com archived color pages say 'you can still purchase this color online or in-store at The Home Depot' (10/10 random archived colors; absent on a current-color control)",
  },
  'sherwin-williams': {
    checkedOn: '2026-10-11',
    source:
      "Sherwin-Williams feed archived=true; sherwin-williams.com archived pages say 'This color is archived and available only in paint or Color to Go' (10/10 random archived colors listed on the 220-color archived page)",
  },
  'farrow-ball': {
    checkedOn: '2026-10-11',
    source:
      "Farrow & Ball Archive category; farrow-ball.com: 'All Archive colours are made to order' (23/23 archived rows checked)",
  },
};

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const scanDir = arg('scan-dir');
const revertFile = arg('revert');

type Availability = 'current' | 'retired' | 'discontinued';
interface Row {
  id: string;
  slug: string;
  color_number: string | null;
  availability: Availability;
  availability_source: string | null;
  availability_checked_on: string | null;
}
type Backup = Omit<Row, 'slug' | 'color_number'> & { slug: string };

async function loadBrandRows(supabase: SupabaseClient, brandId: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('colors')
      .select('id, slug, color_number, availability, availability_source, availability_checked_on')
      .eq('brand_id', brandId)
      .order('id')
      .range(from, from + 999);
    if (error) throw new Error(`DB read failed: ${error.message}`);
    rows.push(...(data as Row[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function updateEach(
  supabase: SupabaseClient,
  updates: { id: string; patch: Partial<Row> }[],
): Promise<number> {
  let done = 0;
  let failed = 0;
  await pool(updates, 8, async (u) => {
    const { error, count } = await supabase.from('colors').update(u.patch, { count: 'exact' }).eq('id', u.id);
    if (error || count !== 1) {
      failed++;
      console.error(`  update failed for ${u.id}: ${error?.message ?? `${count} rows`}`);
      return;
    }
    done++;
  });
  if (failed) throw new Error(`${failed} updates failed; ${done} applied. Re-running is safe.`);
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
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as Backup[];
    const n = await updateEach(
      supabase,
      backup.map(({ id, slug: _slug, ...patch }) => ({ id, patch })),
    );
    console.log(`Reverted ${n} of ${backup.length} rows. Recompute matches afterwards.`);
    return;
  }
  if (!scanDir) {
    console.error('Usage: tsx scripts/apply-availability.ts --scan-dir=data/brand-scans/<date> [--apply]');
    process.exit(1);
  }
  const dir = path.resolve(process.cwd(), scanDir);
  const scanDate = path.basename(dir);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scanDate)) throw new Error(`scan dir must be dated: ${dir}`);

  const { data: brands, error } = await supabase.from('brands').select('id, slug').order('slug');
  if (error || !brands) throw new Error(`Failed to fetch brands: ${error?.message}`);

  const stateUpdates: { id: string; patch: Partial<Row> }[] = [];
  const backup: Backup[] = [];
  const seenIds: string[] = [];

  for (const b of brands) {
    const file = path.join(dir, `${b.slug}-live.json`);
    const src = SOURCES[b.slug];
    if (!src || !fs.existsSync(file)) continue;
    const toKey = (c: string) => normCode(src.normalizeCode ? src.normalizeCode(c) : c);
    const live = new Map<string, LiveColor>();
    for (const c of JSON.parse(fs.readFileSync(file, 'utf8')) as LiveColor[]) {
      if (c.code?.trim() && !live.has(toKey(c.code))) live.set(toKey(c.code), c);
    }
    const evidence = EVIDENCE[b.slug];
    const tally = { seen: 0, toRetired: 0, toCurrent: 0, archivedNoEvidence: 0, keptDiscontinuedNotInFeed: 0 };

    for (const row of await loadBrandRows(supabase, b.id)) {
      const c = row.color_number ? live.get(toKey(row.color_number)) : undefined;
      if (!c) {
        if (row.availability === 'discontinued') tally.keptDiscontinuedNotInFeed++;
        continue;
      }
      tally.seen++;
      seenIds.push(row.id);
      let next: Availability | null = null;
      if (c.archived) {
        if (!evidence) tally.archivedNoEvidence++;
        else if (row.availability !== 'retired') next = 'retired';
      } else if (row.availability === 'retired') {
        next = 'current';
      }
      if (!next) continue;
      backup.push({
        id: row.id,
        slug: row.slug,
        availability: row.availability,
        availability_source: row.availability_source,
        availability_checked_on: row.availability_checked_on,
      });
      stateUpdates.push({
        id: row.id,
        patch: {
          availability: next,
          availability_source: next === 'retired' ? evidence!.source : `${b.slug} feed lists it as current again`,
          availability_checked_on: next === 'retired' ? evidence!.checkedOn : scanDate,
        },
      });
      if (next === 'retired') tally.toRetired++;
      else tally.toCurrent++;
    }
    console.log(`[${b.slug}]`, tally);
  }

  console.log(`\nState changes: ${stateUpdates.length}. Rows to stamp last_seen_live_on=${scanDate}: ${seenIds.length}`);
  if (!APPLY) {
    console.log('Dry run — no DB changes. Re-run with --apply.');
    return;
  }

  const backupDir = path.resolve(__dirname, 'data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `availability-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);

  const changed = await updateEach(supabase, stateUpdates);
  console.log(`Updated availability on ${changed} rows.`);

  let stamped = 0;
  for (let i = 0; i < seenIds.length; i += 300) {
    const ids = seenIds.slice(i, i + 300);
    const { error: e, count } = await supabase
      .from('colors')
      .update({ last_seen_live_on: scanDate }, { count: 'exact' })
      .in('id', ids);
    if (e) throw new Error(`last_seen_live_on update failed at ${i}: ${e.message}`);
    stamped += count ?? 0;
  }
  console.log(`Stamped last_seen_live_on on ${stamped} rows.`);
  if (stamped !== seenIds.length) throw new Error(`expected ${seenIds.length} stamped, got ${stamped}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

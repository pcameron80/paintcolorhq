/**
 * Clear LRVs that have no manufacturer value behind them and that a computed
 * value gets wrong, so the page shows no LRV rather than a wrong one.
 *
 * Why (MP-50, checked 2026-10-24):
 * - Colorhouse: Bisque .01 (#ffffff) shows LRV 100, Imagine .02 97.1 and
 *   Imagine .01 95.1. No paint reflects 95-100% of light (SW 9500 UltraWhite
 *   publishes 93.5), and Colorhouse's site is gone, so there is no published
 *   value to substitute.
 * - Sherwin-Williams 2927 Weathervane, 2936 Black Emerald and 2942 Liberty
 *   Blue: archived colors whose feed LRV is 0 (SW's "none"). The stored 1.6,
 *   1.4 and 0.9 are computed from hex.
 *
 * Candidates: the EXPECTED rows, plus every row at LRV 0 or less or above
 * LRV_CEILING (94.5), listed so nothing impossible goes unseen. Only EXPECTED
 * rows are cleared by default; others need --include-unexpected. Dunn-Edwards
 * whites above 94.5 are corrected by apply-published-lrv.ts, not cleared.
 *
 * Guards:
 * - A row whose dataQualityScore (src/lib/indexing.ts) would drop below
 *   --min-score (default 3) without its LRV is listed and skipped. The three
 *   SW rows have no undertone, so they score 2 without LRV (still indexable,
 *   which needs 2) and are held at the default; --min-score=2 clears them.
 * - The 13 head colors are skipped unless --include-head.
 * - Each write is conditional on lrv still holding the value read.
 * Once migration 017 is applied, lrv_source and lrv_checked_on are cleared
 * with the LRV, and the backup keeps them for --revert.
 *
 * Usage (from the main checkout):
 *   tsx scripts/apply-lrv-nulls.ts                     # dry run
 *   tsx scripts/apply-lrv-nulls.ts --apply             # writes, backup first
 *   tsx scripts/apply-lrv-nulls.ts --revert=scripts/data/backups/lrv-nulls-<ts>.json
 * Then redeploy (LRV is not in the match JSON), and run
 *   npm run audit-colors -- --changed=<backup>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { dataQualityScore } from '../src/lib/indexing';
import { HEAD_KEYS, LRV_CEILING, hasLrvSourceColumn } from './lib/lrv-source';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const INCLUDE_HEAD = process.argv.includes('--include-head');
const INCLUDE_UNEXPECTED = process.argv.includes('--include-unexpected');
const revertFile = arg('revert');

const MIN_SCORE = Number(arg('min-score') ?? 3);
if (![2, 3, 4].includes(MIN_SCORE)) throw new Error('--min-score must be 2, 3 or 4 (2 is the indexability floor)');
/** Reviewed 2026-10-24 for MP-50: "brandSlug/colorSlug". */
const EXPECTED: ReadonlySet<string> = new Set([
  'colorhouse/bisque-01-bisque-01',
  'colorhouse/imagine-02-imagine-02',
  'colorhouse/imagine-01-imagine-01',
  'sherwin-williams/weathervane-2927',
  'sherwin-williams/black-emerald-2936',
  'sherwin-williams/liberty-blue-2942',
]);

interface Row {
  id: string;
  slug: string;
  name: string;
  color_number: string | null;
  lrv: number | string | null;
  undertone: string | null;
  color_family: string | null;
  lrv_source?: string | null;
  lrv_checked_on?: string | null;
  brand: { slug: string } | { slug: string }[] | null;
}
interface Backup {
  id: string;
  key: string;
  lrv: number;
  lrv_source?: string | null;
  lrv_checked_on?: string | null;
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
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as Backup[];
    let n = 0;
    for (const b of backup) {
      const patch: Record<string, unknown> = { lrv: b.lrv };
      if (withSource && 'lrv_source' in b) Object.assign(patch, { lrv_source: b.lrv_source ?? null, lrv_checked_on: b.lrv_checked_on ?? null });
      const { error, count } = await supabase.from('colors').update(patch, { count: 'exact' }).eq('id', b.id).is('lrv', null);
      if (error) console.error(`  revert failed for ${b.key}: ${error.message}`);
      else if (count !== 1) console.warn(`  skip ${b.key}: lrv is no longer NULL`);
      else n++;
    }
    console.log(`Reverted ${n} of ${backup.length} rows.`);
    return;
  }

  const rows = await candidateRows(supabase, withSource);
  const targets: { row: Row; key: string; lrv: number }[] = [];
  const found = new Set<string>();
  console.log(`Candidates (EXPECTED, LRV <= 0, LRV > ${LRV_CEILING}): ${rows.length}`);
  for (const r of rows) {
    const brand = Array.isArray(r.brand) ? r.brand[0]?.slug : r.brand?.slug;
    const k = `${brand}/${r.slug}`;
    if (found.has(k)) continue;
    found.add(k);
    const lrv = Number(r.lrv);
    const score = dataQualityScore({ ...r, lrv: null });
    const line = `${k.padEnd(48)} "${r.name}" ${r.color_number ?? ''}: LRV ${lrv}, score without LRV ${score}`;
    if (!INCLUDE_HEAD && HEAD_KEYS.has(k)) { console.log(`  head (skipped)  ${line}`); continue; }
    if (score < MIN_SCORE) { console.log(`  score (skipped) ${line}`); continue; }
    if (!EXPECTED.has(k) && !INCLUDE_UNEXPECTED) { console.log(`  unexpected      ${line}  (--include-unexpected to clear)`); continue; }
    console.log(`  clear           ${line}`);
    targets.push({ row: r, key: k, lrv });
  }
  for (const k of EXPECTED) if (!found.has(k)) console.log(`  expected row not found (already cleared or renamed): ${k}`);

  console.log(`\nRows to clear: ${targets.length}`);
  if (!APPLY) {
    console.log('Dry run — no DB changes. Re-run with --apply.');
    return;
  }
  const backup: Backup[] = targets.map(({ row, key: k, lrv }) => ({
    id: row.id,
    key: k,
    lrv,
    ...(withSource ? { lrv_source: row.lrv_source ?? null, lrv_checked_on: row.lrv_checked_on ?? null } : {}),
  }));
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `lrv-nulls-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);
  let n = 0;
  for (const t of targets) {
    const patch: Record<string, unknown> = { lrv: null };
    if (withSource) Object.assign(patch, { lrv_source: null, lrv_checked_on: null });
    const { error, count } = await supabase.from('colors').update(patch, { count: 'exact' }).eq('id', t.row.id).eq('lrv', t.lrv);
    if (error) console.error(`  update failed for ${t.key}: ${error.message}`);
    else if (count !== 1) console.warn(`  skip ${t.key}: lrv changed since it was read`);
    else n++;
  }
  console.log(`Cleared ${n} of ${targets.length}. Redeploy, then: npm run audit-colors -- --changed=${path.relative(process.cwd(), backupPath)}`);
}

async function candidateRows(supabase: SupabaseClient, withSource: boolean): Promise<Row[]> {
  const fields = `id, slug, name, color_number, lrv, undertone, color_family${withSource ? ', lrv_source, lrv_checked_on' : ''}, brand:brand_id (slug)`;
  const out: Row[] = [];
  const odd = await supabase.from('colors').select(fields).or(`lrv.lte.0,lrv.gt.${LRV_CEILING}`).order('slug');
  if (odd.error) throw new Error(`DB read failed: ${odd.error.message}`);
  out.push(...(odd.data as unknown as Row[]));
  // EXPECTED by slug, then keep only the row whose brand matches the key.
  const slugs = [...EXPECTED].map((k) => k.split('/')[1]);
  const exp = await supabase.from('colors').select(fields).in('slug', slugs).not('lrv', 'is', null);
  if (exp.error) throw new Error(`DB read failed: ${exp.error.message}`);
  for (const r of exp.data as unknown as Row[]) {
    const brand = Array.isArray(r.brand) ? r.brand[0]?.slug : r.brand?.slug;
    if (EXPECTED.has(`${brand}/${r.slug}`)) out.push(r);
  }
  return out;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

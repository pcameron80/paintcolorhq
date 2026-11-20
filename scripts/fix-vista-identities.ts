/**
 * Repair the 12 Vista rows the June 2026 reconcile (reconcile-regional.ts)
 * re-pointed at another color. Found in the 2026-11 data audit
 * (docs/data-audit-2026-11.md, finding identity-vista-reconcile-mispaired).
 *
 * The near-hex pass gave a live code to the wrong row: goldfinch-k-545 now
 * shows 7861 Under the Sun while the row named for Under the Sun
 * (under-the-sun-k-464) was left behind as a duplicate. The plan in
 * scripts/data/vista-identity-plan.json fixes this per row:
 *   assign     the same-name row takes the live code, name, hex and LRV from
 *              vistapaint.com (11 rows, 10 legacy C-/K- rows plus
 *              evoultion-c-129, which takes 0130 Evolution);
 *   restore    the re-pointed row gets its own code, name and a manufacturer
 *              hex back, and last_seen_live_on is cleared (10 rows);
 *   alternates plum-cake-1232's alternate "1232" becomes "C-1232".
 * Hex-derived columns (rgb, Lab, family, undertone, LRV) are recomputed.
 * Slugs never change, so no redirects are needed here. Three restored rows
 * (goldfinch-k-545, sporty-yellow-k-1203, woodland-fern-k-272) duplicate a
 * live row afterwards; scripts/data/explicit-duplicates.json retires them
 * through dedupe-colors.ts, and refuses to until this script has run.
 *
 * Each write is conditional on the row still holding the color_number and
 * hex the plan expects, so a row edited since 2026-10-31 is skipped.
 *
 * Usage (from the main checkout):
 *   npx tsx scripts/fix-vista-identities.ts                      # dry run
 *   npx tsx scripts/fix-vista-identities.ts --apply              # backup, then write
 *   npx tsx scripts/fix-vista-identities.ts --revert=scripts/data/backups/vista-identities-<ts>.json
 *
 * Afterwards: dedupe-colors.ts (plan) -> retire-bad-color-rows.ts, then the
 * match recompute. Matches are stale for these rows until then.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { patchFor, validatePlan, type IdentityPatch, type IdentityPlan } from './lib/vista-identity';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const revertFile = arg('revert');
const PLAN_FILE = path.resolve(__dirname, 'data/vista-identity-plan.json');

const COLUMNS =
  'id, slug, color_number, alternate_numbers, name, hex, rgb_r, rgb_g, rgb_b, lab_l, lab_a, lab_b_val, lrv, color_family, undertone, last_seen_live_on, availability';
type Row = IdentityPatch & { id: string; slug: string; color_number: string; hex: string };
interface BackupEntry {
  id: string;
  slug: string;
  before: Row;
  patch: IdentityPatch;
}

async function write(supabase: SupabaseClient, id: string, patch: IdentityPatch, guard: { color_number: string; hex: string }) {
  const { error, count } = await supabase
    .from('colors')
    .update(patch, { count: 'exact' })
    .eq('id', id)
    .eq('color_number', guard.color_number)
    .eq('hex', guard.hex);
  if (error) throw new Error(`update failed for ${id}: ${error.message}`);
  return count === 1;
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
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as BackupEntry[];
    let n = 0;
    for (const b of backup) {
      const before = Object.fromEntries(Object.entries(b.before).filter(([k]) => k !== 'id' && k !== 'slug')) as IdentityPatch;
      const guard = { color_number: b.patch.color_number ?? b.before.color_number, hex: b.patch.hex ?? b.before.hex };
      if (!APPLY) { console.log(`  would revert ${b.slug} (guard ${guard.color_number} ${guard.hex})`); continue; }
      if (await write(supabase, b.id, before, guard)) n++;
      else console.warn(`  skip ${b.slug}: changed since the fix was applied`);
    }
    console.log(APPLY ? `Reverted ${n} of ${backup.length} rows.` : 'Dry run of the revert. Add --apply to write.');
    return;
  }

  const plan = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8')) as IdentityPlan;
  const errors = validatePlan(plan);
  if (errors.length) {
    for (const e of errors) console.error(`  plan error: ${e}`);
    process.exit(1);
  }
  const { data: brand, error: brandErr } = await supabase.from('brands').select('id').eq('slug', plan.brand).single();
  if (brandErr || !brand) throw new Error(`brand ${plan.brand}: ${brandErr?.message}`);
  const { data, error } = await supabase
    .from('colors')
    .select(COLUMNS)
    .eq('brand_id', brand.id)
    .in('slug', plan.ops.map((o) => o.slug));
  if (error) throw new Error(error.message);
  const rows = new Map((data as unknown as Row[]).map((r) => [r.slug, r]));

  const todo: (BackupEntry & { guard: { color_number: string; hex: string } })[] = [];
  const tally = { ready: 0, missing: 0, changed: 0, done: 0 };
  for (const o of plan.ops) {
    const r = rows.get(o.slug);
    if (!r) { tally.missing++; console.warn(`  missing ${o.slug}`); continue; }
    const patch = patchFor(o, `${plan.brand}/${o.slug}`);
    const atTarget = (patch.color_number ?? r.color_number) === r.color_number && (patch.hex ?? r.hex) === r.hex.toLowerCase() &&
      JSON.stringify(patch.alternate_numbers ?? r.alternate_numbers) === JSON.stringify(r.alternate_numbers);
    if (atTarget) { tally.done++; continue; }
    if (r.color_number !== o.expect.color_number || r.hex.toLowerCase() !== o.expect.hex.toLowerCase()) {
      tally.changed++;
      console.warn(`  skip ${o.slug}: holds ${r.color_number} ${r.hex}, plan expects ${o.expect.color_number} ${o.expect.hex}`);
      continue;
    }
    tally.ready++;
    console.log(
      `  ${o.op.padEnd(10)} ${o.slug.padEnd(28)} ${r.color_number} "${r.name}" ${r.hex} -> ` +
        `${patch.color_number ?? r.color_number} "${patch.name ?? r.name}" ${patch.hex ?? r.hex}` +
        `${patch.color_family && patch.color_family !== r.color_family ? ` [family ${r.color_family} -> ${patch.color_family}]` : ''}`,
    );
    todo.push({ id: r.id, slug: r.slug, before: r, patch, guard: { color_number: r.color_number, hex: r.hex } });
  }
  console.log(`\n${JSON.stringify(tally)}`);
  if (!APPLY) {
    console.log('Dry run, no DB changes. Re-run with --apply.');
    return;
  }
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `vista-identities-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const backup: BackupEntry[] = todo.map((t) => ({ id: t.id, slug: t.slug, before: t.before, patch: t.patch }));
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);
  let n = 0;
  for (const t of todo) {
    if (await write(supabase, t.id, t.patch, t.guard)) n++;
    else console.warn(`  skip ${t.slug}: changed since it was read`);
  }
  console.log(`Updated ${n} of ${todo.length} rows. Next: dedupe-colors.ts, retire-bad-color-rows.ts, then the match recompute.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

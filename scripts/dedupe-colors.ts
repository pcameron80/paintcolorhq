/**
 * Plan the consolidation of duplicate color rows into one canonical row per
 * group. Grouping rules and canonical choice live in scripts/lib/dedupe-rules.ts.
 *
 * This script only reads. It writes:
 *   - scripts/data/dedupe-plan-<date>.json (always): every group, its
 *     canonical and losers, the redirects it adds, the project_colors rows
 *     that point at losers, and a `pairs` list in the format
 *     scripts/retire-bad-color-rows.ts --pairs takes.
 *   - src/data/color-redirects.json, only with --write-redirects. The new
 *     redirects are merged into the existing map; no entry is ever dropped.
 *     Commit and deploy the map BEFORE retiring rows, so the old URLs 301
 *     the moment the rows are gone.
 *
 * Deleting rows is done by retire-bad-color-rows.ts, which backs up every
 * row, match and project_colors ref first and can --revert. A group whose
 * canonical is not in the live feed while one of its losers is ("live
 * conflict") is left out of `pairs`, and the retire tool refuses such a pair
 * again at apply time.
 *
 * Inputs: the colors table (read-only), data/bm-ac-aliases.json when present
 * (npx tsx scripts/fetch-bm-aliases.ts), and scripts/data/explicit-duplicates.json
 * (hand-listed pairs from the 2026-11 audit; refused pairs are printed).
 *
 * Usage:
 *   npx tsx scripts/dedupe-colors.ts                    # plan only
 *   npx tsx scripts/dedupe-colors.ts --write-redirects  # plan + merge redirects
 *   npx tsx scripts/dedupe-colors.ts --snapshot=<file>  # plan from a JSON
 *     export instead of the DB (rows with brand_slug; id/brand_id optional)
 *   then:
 *   npx tsx scripts/retire-bad-color-rows.ts --pairs=scripts/data/dedupe-plan-<date>.json          # dry run
 *   npx tsx scripts/retire-bad-color-rows.ts --pairs=scripts/data/dedupe-plan-<date>.json --apply  # write
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  explicitGroups,
  type ExplicitDuplicate,
  findDuplicateGroups,
  mergeRedirects,
  pickCanonical,
  primaryReason,
  type AcAlias,
  type GroupReason,
} from './lib/dedupe-rules';

dotenv.config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });

const REDIRECTS_FILE = path.resolve(__dirname, '../src/data/color-redirects.json');
const AC_ALIAS_FILE = path.resolve(__dirname, '../data/bm-ac-aliases.json');
const EXPLICIT_FILE = path.resolve(__dirname, 'data/explicit-duplicates.json');
const PLAN_DIR = path.resolve(__dirname, 'data');
const args = process.argv.slice(2);
const WRITE_REDIRECTS = args.includes('--write-redirects');
const SNAPSHOT = args.find((a) => a.startsWith('--snapshot='))?.slice('--snapshot='.length);

if (args.includes('--apply')) {
  console.error(
    'dedupe-colors.ts no longer deletes rows. Run it to write the plan, then:\n' +
      '  npx tsx scripts/retire-bad-color-rows.ts --pairs=scripts/data/dedupe-plan-<date>.json [--apply]',
  );
  process.exit(1);
}

interface ColorRow {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  color_number: string | null;
  hex: string;
  alternate_numbers: string[] | null;
  created_at: string | null;
  last_seen_live_on: string | null;
  availability: string | null;
}

export interface RetirePair {
  brand: string;
  slug: string;
  redirectTo: string;
  /** fold the loser's code into the target's alternate_numbers */
  foldCode: boolean;
  reason: string;
}

async function loadFromDb(): Promise<{ colors: ColorRow[]; brandSlugById: Map<string, string>; refs: Map<string, number> | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const { data: brands, error: brandErr } = await supabase.from('brands').select('id, slug');
  if (brandErr || !brands) throw new Error(`Failed to fetch brands: ${brandErr?.message}`);
  const brandSlugById = new Map<string, string>(brands.map((b) => [b.id, b.slug]));

  const colors: ColorRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('colors')
      .select('id, brand_id, name, slug, color_number, hex, alternate_numbers, created_at, last_seen_live_on, availability')
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(`Failed to fetch colors: ${error.message}`);
    colors.push(...((data ?? []) as ColorRow[]));
    if (!data || data.length < 1000) break;
  }

  const refs = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('project_colors').select('color_id').order('color_id').range(from, from + 999);
    if (error) throw new Error(`Failed to fetch project_colors: ${error.message}`);
    for (const r of (data ?? []) as { color_id: string }[]) refs.set(r.color_id, (refs.get(r.color_id) ?? 0) + 1);
    if (!data || data.length < 1000) break;
  }
  return { colors, brandSlugById, refs };
}

function loadFromSnapshot(file: string): { colors: ColorRow[]; brandSlugById: Map<string, string>; refs: null } {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as (Partial<ColorRow> & { brand_slug: string; slug: string })[];
  const brandSlugById = new Map<string, string>();
  const colors = raw.map((r) => {
    const brandId = r.brand_id ?? r.brand_slug;
    brandSlugById.set(brandId, r.brand_slug);
    return {
      id: r.id ?? `${r.brand_slug}/${r.slug}`,
      brand_id: brandId,
      name: r.name ?? '',
      slug: r.slug,
      color_number: r.color_number ?? null,
      hex: r.hex ?? '',
      alternate_numbers: r.alternate_numbers ?? null,
      created_at: r.created_at ?? null,
      last_seen_live_on: r.last_seen_live_on ?? null,
      availability: r.availability ?? null,
    };
  });
  return { colors, brandSlugById, refs: null };
}

function loadAcAliases(): AcAlias[] {
  if (!fs.existsSync(AC_ALIAS_FILE)) {
    console.warn(`No ${path.relative(process.cwd(), AC_ALIAS_FILE)}: BM AC- rows are not grouped. Run scripts/fetch-bm-aliases.ts first.`);
    return [];
  }
  const file = JSON.parse(fs.readFileSync(AC_ALIAS_FILE, 'utf8')) as { aliases: AcAlias[] };
  return file.aliases;
}

async function main() {
  const { colors, brandSlugById, refs } = SNAPSHOT ? loadFromSnapshot(SNAPSHOT) : await loadFromDb();
  console.log(`${colors.length} colors loaded${SNAPSHOT ? ` from ${SNAPSHOT}` : ''}`);
  const acAliases = loadAcAliases();

  const { groups, acUnresolved } = findDuplicateGroups(colors, brandSlugById, acAliases);
  const live = (c: ColorRow) => (c.last_seen_live_on ? 'live' : 'not-live');

  const plan = groups.map((g) => {
    const d = pickCanonical(g.rows, g.brandSlug);
    return { ...g, ...d, reason: primaryReason(g.reasons) };
  });

  // Hand-listed pairs (scripts/data/explicit-duplicates.json). A row already
  // in a rule-based group is never planned twice.
  const explicitPairs = fs.existsSync(EXPLICIT_FILE)
    ? (JSON.parse(fs.readFileSync(EXPLICIT_FILE, 'utf8')) as { pairs: ExplicitDuplicate[] }).pairs
    : [];
  const taken = new Set(plan.flatMap((p) => p.rows.map((r) => `${p.brandSlug}/${r.slug}`)));
  const explicit = explicitGroups(colors, brandSlugById, explicitPairs, taken);
  for (const g of explicit.groups) {
    plan.push({ ...g, reasons: ['explicit'] as GroupReason[], reason: 'explicit' as GroupReason });
  }
  console.log(`Explicit pairs: ${explicitPairs.length} listed, ${explicit.groups.reduce((n, g) => n + g.dupes.length, 0)} planned, ${explicit.refused.length} refused`);
  for (const r of explicit.refused) console.log(`  refused ${r}`);
  plan.sort((a, b) => `${a.brandSlug}/${a.canonical.slug}`.localeCompare(`${b.brandSlug}/${b.canonical.slug}`));

  // --- Tally ----------------------------------------------------------------
  const tally = new Map<string, { groups: number; losers: number }>();
  for (const p of plan) {
    const k = `${p.brandSlug} ${p.reason}`;
    const t = tally.get(k) ?? { groups: 0, losers: 0 };
    t.groups++;
    t.losers += p.dupes.length;
    tally.set(k, t);
  }
  const conflicts = plan.filter((p) => p.liveConflict);
  const bigGroups = plan.filter((p) => p.rows.length > 2);
  console.log(`\nDuplicate groups: ${plan.length} (${plan.reduce((n, p) => n + p.dupes.length, 0)} rows to retire)`);
  for (const [k, t] of [...tally].sort()) console.log(`  ${k.padEnd(32)} ${String(t.groups).padStart(4)} groups  ${String(t.losers).padStart(4)} losers`);
  console.log(`Groups with 3+ rows: ${bigGroups.length}`);
  for (const p of bigGroups) console.log(`  ${p.brandSlug}: ${p.rows.map((r) => r.slug).join(', ')} [${p.reasons.join(', ')}]`);
  console.log(`Not-live canonicals with a live twin (refused): ${conflicts.length}`);
  for (const p of conflicts) console.log(`  ${p.brandSlug}/${p.canonical.slug} <- ${p.dupes.map((d) => `${d.slug} (${live(d)})`).join(', ')}`);
  if (acAliases.length) {
    const acGroups = plan.filter((p) => p.reasons.includes('bm-ac')).length;
    console.log(`BM AC- aliases in file: ${acAliases.length}; groups joined by them: ${acGroups}`);
    for (const p of plan.filter((g) => g.reasons.includes('bm-ac'))) {
      const ac = p.rows.find((r) => /^AC-/i.test(r.color_number ?? ''));
      console.log(`  ${ac?.color_number} ${ac?.slug} -> ${p.canonical.slug}`);
    }
  }
  for (const u of acUnresolved) console.log(`  AC unresolved: ${u}`);

  // --- Redirects ------------------------------------------------------------
  const additions: Record<string, string> = {};
  const pairs: RetirePair[] = [];
  for (const p of plan) {
    if (p.liveConflict) continue;
    for (const d of p.dupes) {
      additions[`${p.brandSlug}/${d.slug}`] = `${p.brandSlug}/${p.canonical.slug}`;
      pairs.push({ brand: p.brandSlug, slug: d.slug, redirectTo: p.canonical.slug, foldCode: true, reason: p.reason });
    }
  }
  const existing = JSON.parse(fs.readFileSync(REDIRECTS_FILE, 'utf8')) as Record<string, string>;
  const merge = mergeRedirects(existing, additions);
  const canonicalShadowed = plan
    .map((p) => `${p.brandSlug}/${p.canonical.slug}`)
    .filter((k) => k in existing);
  console.log(
    `\nRedirects: ${Object.keys(existing).length} existing, ${merge.added.length} added, ` +
      `${merge.repointed.length} re-pointed, ${merge.conflicts.length} conflicts, ` +
      `${Object.keys(merge.merged).length} after merge (never fewer than existing)`,
  );
  for (const r of merge.repointed) console.log(`  re-pointed ${r}`);
  for (const c of merge.conflicts) console.log(`  CONFLICT ${c}`);
  for (const c of canonicalShadowed) console.log(`  WARNING canonical ${c} is itself a redirect source`);
  if (Object.keys(merge.merged).length < Object.keys(existing).length) throw new Error('merge dropped a redirect');

  // --- Plan file ------------------------------------------------------------
  const today = new Date().toISOString().slice(0, 10);
  const planFile = path.join(PLAN_DIR, `dedupe-plan-${today}.json`);
  const summary: Record<string, { groups: number; losers: number }> = Object.fromEntries(tally);
  const out = {
    generated_on: new Date().toISOString(),
    source: SNAPSHOT ? `snapshot ${SNAPSHOT}` : 'colors table',
    summary,
    live_conflicts: conflicts.length,
    redirects: { existing: Object.keys(existing).length, added: merge.added.length, repointed: merge.repointed, conflicts: merge.conflicts },
    ac_unresolved: acUnresolved,
    groups: plan.map((p) => ({
      brand: p.brandSlug,
      reason: p.reason,
      reasons: p.reasons as GroupReason[],
      live_conflict: p.liveConflict,
      canonical: { slug: p.canonical.slug, color_number: p.canonical.color_number, live: !!p.canonical.last_seen_live_on, availability: p.canonical.availability },
      losers: p.dupes.map((d) => ({
        slug: d.slug,
        color_number: d.color_number,
        live: !!d.last_seen_live_on,
        availability: d.availability,
        project_colors: refs ? refs.get(d.id) ?? 0 : null,
      })),
      alternates: p.alternates,
    })),
    pairs,
  };
  fs.mkdirSync(PLAN_DIR, { recursive: true });
  fs.writeFileSync(planFile, JSON.stringify(out, null, 1) + '\n');
  const refTotal = refs ? out.groups.reduce((n, g) => n + g.losers.reduce((m, l) => m + (l.project_colors ?? 0), 0), 0) : null;
  console.log(`\nPlan written: ${path.relative(process.cwd(), planFile)} (${pairs.length} pairs; project_colors refs on losers: ${refTotal ?? 'n/a in snapshot mode'})`);

  if (WRITE_REDIRECTS) {
    fs.writeFileSync(REDIRECTS_FILE, JSON.stringify(merge.merged, null, 2) + '\n');
    console.log(`Redirect map written: ${path.relative(process.cwd(), REDIRECTS_FILE)} (${Object.keys(merge.merged).length} entries)`);
  } else {
    console.log('src/data/color-redirects.json not touched (pass --write-redirects to merge the new entries).');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

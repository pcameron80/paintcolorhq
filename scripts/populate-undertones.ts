/**
 * Recompute colors.undertone with scripts/lib/undertone.ts.
 *
 * Dry run by default: reads every color (paged by id), prints the per-family
 * before/after, the 13 head colors, the top label transitions and the changed
 * count. Nothing is written.
 *
 * Usage:
 *   tsx scripts/populate-undertones.ts                         # dry run, all rows
 *   tsx scripts/populate-undertones.ts --missing-only          # dry run, null undertone only
 *   tsx scripts/populate-undertones.ts --exclude-keys=head     # skip the 13 head colors
 *   tsx scripts/populate-undertones.ts --only-keys=sherwin-williams/alabaster-7008,head
 *   tsx scripts/populate-undertones.ts --apply                 # backup, then guarded writes
 *   tsx scripts/populate-undertones.ts --revert=scripts/data/backups/undertones-<ts>.json
 *
 * Keys are "brandSlug/colorSlug"; the token "head" expands to HEAD_COLOR_PUSH.
 *
 * --apply writes a JSON backup first ({id, key, old, new} per changed row),
 * then updates each row only if its undertone still equals the value read
 * (old value in the WHERE). A row edited in between is skipped and listed.
 * --revert puts the backup's old values back with the same guard (WHERE
 * undertone = the value this script wrote).
 *
 * Date gates (the label prints in the color-page meta description and body):
 *   - --apply refuses to run before APPLY_NOT_BEFORE, the day after the
 *     color-page title/meta test ends (src/lib/title-test.ts).
 *   - Head colors are excluded until HEAD_FREEZE_ENDS unless --include-head,
 *     because their page bodies are frozen for the head-color measurement.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { undertoneLabel } from './lib/undertone';
import { pool } from './lib/palette-sources';
import { HEAD_COLOR_PUSH } from '../src/lib/head-colors';

dotenv.config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });

const APPLY_NOT_BEFORE = '2026-11-04';
const HEAD_FREEZE_ENDS = '2026-11-28';

const argv = process.argv.slice(2);
const arg = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const flag = (name: string) => argv.includes(`--${name}`);

const APPLY = flag('apply');
const MISSING_ONLY = flag('missing-only');
const INCLUDE_HEAD = flag('include-head');
const revertFile = arg('revert');

function parseKeys(v: string | undefined): Set<string> | null {
  if (!v) return null;
  const out = new Set<string>();
  for (const k of v.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (k === 'head') HEAD_COLOR_PUSH.forEach((h) => out.add(h));
    else out.add(k);
  }
  return out;
}
const onlyKeys = parseKeys(arg('only-keys'));
const excludeKeys = parseKeys(arg('exclude-keys')) ?? new Set<string>();
const today = new Date().toISOString().slice(0, 10);
const headFrozen = today < HEAD_FREEZE_ENDS && !INCLUDE_HEAD;
if (headFrozen) HEAD_COLOR_PUSH.forEach((h) => excludeKeys.add(h));

interface Row {
  id: string;
  slug: string;
  brand_id: string;
  hex: string;
  lab_a: number | null;
  lab_b_val: number | null;
  color_family: string | null;
  undertone: string | null;
}
interface Change {
  id: string;
  key: string;
  old: string | null;
  new: string;
}

const PAGE = 1000;

async function readAll(supabase: SupabaseClient): Promise<Row[]> {
  const rows: Row[] = [];
  let lastId: string | null = null;
  for (;;) {
    let q = supabase
      .from('colors')
      .select('id, slug, brand_id, hex, lab_a, lab_b_val, color_family, undertone')
      .order('id', { ascending: true })
      .limit(PAGE);
    if (lastId) q = q.gt('id', lastId);
    if (MISSING_ONLY) q = q.is('undertone', null);
    const { data, error } = await q;
    if (error) throw new Error(`DB read failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as Row[]));
    lastId = data[data.length - 1].id;
    if (data.length < PAGE) break;
  }
  return rows;
}

/** Guarded write: only touches a row whose undertone still equals `expect`. */
async function writeGuarded(
  supabase: SupabaseClient,
  items: { id: string; key: string; expect: string | null; value: string | null }[],
): Promise<{ done: number; stale: string[]; failed: string[] }> {
  let done = 0;
  const stale: string[] = [];
  const failed: string[] = [];
  await pool(items, 8, async (it) => {
    let q = supabase.from('colors').update({ undertone: it.value }, { count: 'exact' }).eq('id', it.id);
    q = it.expect == null ? q.is('undertone', null) : q.eq('undertone', it.expect);
    const { error, count } = await q;
    if (error) {
      failed.push(`${it.key}: ${error.message}`);
      return;
    }
    if (count !== 1) {
      stale.push(it.key);
      return;
    }
    if (++done % 1000 === 0) console.log(`  ${done}/${items.length}`);
  });
  return { done, stale, failed };
}

function report(rows: Row[], brandSlug: Map<string, string>, changes: Map<string, Change>) {
  const fam = new Map<string, { before: Record<string, number>; after: Record<string, number> }>();
  const transitions = new Map<string, number>();
  for (const r of rows) {
    const f = r.color_family ?? '(none)';
    if (!fam.has(f)) fam.set(f, { before: {}, after: {} });
    const t = fam.get(f)!;
    const before = r.undertone ?? '(null)';
    const after = changes.get(r.id)?.new ?? before;
    t.before[before] = (t.before[before] ?? 0) + 1;
    t.after[after] = (t.after[after] ?? 0) + 1;
    if (before !== after) transitions.set(`${before} -> ${after}`, (transitions.get(`${before} -> ${after}`) ?? 0) + 1);
  }
  const fmt = (m: Record<string, number>) =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(', ');
  console.log('\nPer family, before -> after (rows in scope):');
  for (const [f, t] of [...fam.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const n = Object.values(t.before).reduce((s, v) => s + v, 0);
    console.log(`  ${f} (${n})`);
    console.log(`    before: ${fmt(t.before)}`);
    console.log(`    after:  ${fmt(t.after)}`);
  }
  console.log('\nTop transitions:');
  for (const [k, v] of [...transitions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`  ${String(v).padStart(6)}  ${k}`);
  }
  console.log(`\nHead colors${headFrozen ? ` (excluded from --apply until ${HEAD_FREEZE_ENDS}; pass --include-head to override)` : ''}:`);
  const byKey = new Map(rows.map((r) => [`${brandSlug.get(r.brand_id)}/${r.slug}`, r]));
  for (const k of HEAD_COLOR_PUSH) {
    const r = byKey.get(k);
    if (!r) {
      console.log(`  ${k}: not in scope`);
      continue;
    }
    const next = undertoneLabel(r.hex, num(r.lab_a), num(r.lab_b_val), k);
    console.log(`  ${k}: ${r.undertone ?? '(null)'} -> ${next}`);
  }
}

const num = (v: number | string | null) => (v == null ? null : Number(v));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    global: { fetch: (u, init) => fetch(u, { ...init, cache: 'no-store' }) },
  });

  if (revertFile) {
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as Change[];
    const r = await writeGuarded(
      supabase,
      backup.map((c) => ({ id: c.id, key: c.key, expect: c.new, value: c.old })),
    );
    console.log(`Reverted ${r.done} of ${backup.length}. Skipped (edited since): ${r.stale.length}. Failed: ${r.failed.length}.`);
    for (const s of r.stale) console.log(`  stale ${s}`);
    for (const f of r.failed) console.log(`  failed ${f}`);
    if (r.failed.length) process.exit(1);
    return;
  }

  const { data: brands, error } = await supabase.from('brands').select('id, slug');
  if (error || !brands) throw new Error(`Failed to fetch brands: ${error?.message}`);
  const brandSlug = new Map<string, string>(brands.map((b) => [b.id, b.slug]));

  console.log(`Reading colors${MISSING_ONLY ? ' with null undertone' : ''}...`);
  const all = await readAll(supabase);
  const keyOf = (r: Row) => `${brandSlug.get(r.brand_id)}/${r.slug}`;
  const rows = onlyKeys ? all.filter((r) => onlyKeys.has(keyOf(r))) : all;

  const changes = new Map<string, Change>();
  let excluded = 0;
  for (const r of rows) {
    const k = keyOf(r);
    const next = undertoneLabel(r.hex, num(r.lab_a), num(r.lab_b_val), k);
    if (next === r.undertone) continue;
    if (excludeKeys.has(k)) {
      excluded++;
      continue;
    }
    changes.set(r.id, { id: r.id, key: k, old: r.undertone, new: next });
  }

  const nulls = rows.filter((r) => r.undertone == null).length;
  report(rows, brandSlug, changes);
  console.log(
    `\nRows in scope: ${rows.length}. Null before: ${nulls}. Would change: ${changes.size}. ` +
      `Would change but excluded: ${excluded}.`,
  );

  if (!APPLY) {
    console.log('Dry run, no DB changes. Re-run with --apply to write (backup first).');
    return;
  }
  if (today < APPLY_NOT_BEFORE) {
    console.error(`Refusing --apply before ${APPLY_NOT_BEFORE}: the label is in the color-page meta description, and the title/meta test runs until 2026-11-03.`);
    process.exit(1);
  }
  if (changes.size === 0) {
    console.log('Nothing to write.');
    return;
  }

  const list = [...changes.values()];
  const backupDir = path.resolve(__dirname, 'data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `undertones-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(list, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);

  const r = await writeGuarded(
    supabase,
    list.map((c) => ({ id: c.id, key: c.key, expect: c.old, value: c.new })),
  );
  console.log(`Updated ${r.done} of ${list.length}. Skipped (edited since read): ${r.stale.length}. Failed: ${r.failed.length}.`);
  for (const s of r.stale) console.log(`  stale ${s}`);
  for (const f of r.failed) console.log(`  failed ${f}`);
  console.log(`Revert with: tsx scripts/populate-undertones.ts --revert=${path.relative(process.cwd(), backupPath)}`);
  if (r.failed.length) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

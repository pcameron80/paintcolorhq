/**
 * Import missing Behr colors from the live-palette dump captured off
 * behr.com/consumer/colors/paint (window.colorData, saved as
 * data/behr-live-palette.json).
 *
 * Filters out spray/gloss entries and anything already in the DB (matched
 * by color_number OR slug), then inserts the rest with the same derived
 * fields (family, LRV, Lab) the colornerd import computes.
 *
 * Usage:
 *   tsx scripts/import-behr-live.ts          # dry run: writes data/behr-import-plan.json
 *   tsx scripts/import-behr-live.ts --apply  # insert into the DB
 *
 * After applying, fold the new colors into cross-brand matches:
 *   npm run export-db-colors && npm run compute-matches && npm run seed-matches
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  parseLivePalette,
  shouldImport,
  titleCaseName,
  makeSlug,
  type LivePaletteRaw,
} from './lib/behr-import-rules';
import {
  classifyColorFamily,
  calculateLrv,
  rgbToLab,
  hexToRgb,
} from './lib/color-math';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PALETTE_FILE = path.resolve(__dirname, '../data/behr-live-palette.json');
const PLAN_FILE = path.resolve(__dirname, '../data/behr-import-plan.json');
const APPLY = process.argv.includes('--apply');
const BATCH_SIZE = 500;

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  if (!fs.existsSync(PALETTE_FILE)) {
    console.error(`Palette dump not found: ${PALETTE_FILE}`);
    console.error('Capture window.colorData from behr.com/consumer/colors/paint first.');
    process.exit(1);
  }
  let raw: LivePaletteRaw | string = JSON.parse(fs.readFileSync(PALETTE_FILE, 'utf8'));
  if (typeof raw === 'string') raw = JSON.parse(raw) as LivePaletteRaw; // double-encoded dump

  const live = parseLivePalette(raw);
  const importable = live.filter(shouldImport);
  console.log(`Live palette: ${live.length} unique ids, ${importable.length} importable wall-paint colors`);

  // --- Existing Behr rows ---------------------------------------------------
  const { data: brand, error: brandErr } = await supabase
    .from('brands')
    .select('id, slug')
    .eq('slug', 'behr')
    .single();
  if (brandErr || !brand) {
    console.error('Failed to fetch behr brand:', brandErr?.message);
    process.exit(1);
  }

  const existingNumbers = new Set<string>();
  const existingSlugs = new Set<string>();
  let offset = 0;
  const PAGE = 1000;
  for (;;) {
    const { data: page, error } = await supabase
      .from('colors')
      .select('color_number, slug')
      .eq('brand_id', brand.id)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.error('Failed to fetch existing colors:', error.message);
      process.exit(1);
    }
    if (!page || page.length === 0) break;
    for (const c of page) {
      if (c.color_number) existingNumbers.add(String(c.color_number).toUpperCase());
      existingSlugs.add(c.slug);
    }
    offset += page.length;
    if (page.length < PAGE) break;
  }
  console.log(`Existing Behr rows: ${existingSlugs.size} (${existingNumbers.size} distinct numbers)`);

  // --- Build insert rows ----------------------------------------------------
  const rows = [];
  let skippedExisting = 0;
  const slugCollisions: string[] = [];
  for (const c of importable) {
    if (existingNumbers.has(c.id)) {
      skippedExisting++;
      continue;
    }
    const name = titleCaseName(c.name);
    const slug = makeSlug(name, c.id);
    if (existingSlugs.has(slug)) {
      // Same name+number shape already in DB under a different/absent
      // color_number — never silently overwrite, list for manual review.
      slugCollisions.push(slug);
      continue;
    }
    const rgb = hexToRgb(c.hex)!;
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    rows.push({
      brand_id: brand.id,
      name,
      slug,
      color_number: c.id,
      hex: c.hex,
      rgb_r: rgb.r,
      rgb_g: rgb.g,
      rgb_b: rgb.b,
      lab_l: lab.l,
      lab_a: lab.a,
      lab_b_val: lab.b_val,
      lrv: Math.round(calculateLrv(rgb.r, rgb.g, rgb.b) * 10) / 10,
      color_family: classifyColorFamily(rgb.r, rgb.g, rgb.b),
    });
  }

  console.log(`To import: ${rows.length} (already in DB: ${skippedExisting}, slug collisions: ${slugCollisions.length})`);
  if (slugCollisions.length) {
    console.log('Slug collisions (NOT imported, review manually):');
    for (const s of slugCollisions) console.log(`  ${s}`);
  }
  const familyDist = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.color_family] = (acc[r.color_family] ?? 0) + 1;
    return acc;
  }, {});
  console.log('Family distribution:', familyDist);

  fs.writeFileSync(PLAN_FILE, JSON.stringify({ slugCollisions, rows }, null, 1));
  console.log(`Plan written: ${PLAN_FILE}`);

  if (!APPLY) {
    console.log('\nDry run — no DB changes. Re-run with --apply to insert.');
    return;
  }

  // --- Insert ---------------------------------------------------------------
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('colors').insert(batch);
    if (error) {
      console.error(`Insert failed at batch ${i} (${inserted} already inserted):`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  ${inserted}/${rows.length} inserted`);
  }

  const { count } = await supabase
    .from('colors')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id);
  if (count !== null) {
    const { error: updErr } = await supabase
      .from('brands')
      .update({ color_count: count })
      .eq('id', brand.id);
    if (updErr) console.error('brands.color_count update failed:', updErr.message);
    else console.log(`brands.color_count updated: ${count}`);
  }

  console.log(`\nDone. Inserted ${inserted} Behr colors. Now recompute matches:`);
  console.log('  npm run export-db-colors && npm run compute-matches && npm run seed-matches');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

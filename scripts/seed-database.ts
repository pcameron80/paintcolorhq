import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProcessedColor {
  name: string;
  slug: string;
  color_number: string | null;
  hex: string;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  lab_l: number;
  lab_a: number;
  lab_b_val: number;
  lrv: number;
  color_family: string;
  brand_slug: string;
}

// ---------------------------------------------------------------------------
// Brand display names (slug -> name)
// ---------------------------------------------------------------------------

const BRAND_NAMES: Record<string, string> = {
  'behr': 'Behr',
  'benjamin-moore': 'Benjamin Moore',
  'sherwin-williams': 'Sherwin-Williams',
  'dunn-edwards': 'Dunn-Edwards',
  'ppg': 'PPG',
  'valspar': 'Valspar',
  'farrow-ball': 'Farrow & Ball',
  'kilz': 'Kilz',
  'colorhouse': 'Colorhouse',
  'ral': 'RAL',
  'dutch-boy': 'Dutch Boy',
  'vista-paint': 'Vista Paint',
  'hirshfields': "Hirshfield's",
  'mpc': 'MPC',
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read processed data
  const dataFile = path.resolve(__dirname, '../data/colors-processed.json');
  if (!fs.existsSync(dataFile)) {
    console.error(`Processed data not found: ${dataFile}`);
    console.error('Run: npm run import-colors');
    process.exit(1);
  }

  const allColors: ProcessedColor[] = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  console.log(`Loaded ${allColors.length} colors from processed data`);

  // Collect unique brands
  const brandSlugs = [...new Set(allColors.map(c => c.brand_slug))];
  console.log(`Found ${brandSlugs.length} brands: ${brandSlugs.join(', ')}`);

  // Upsert brands
  console.log('\n--- Upserting brands ---');
  const brandIdMap = new Map<string, string>();

  for (const slug of brandSlugs) {
    const name = BRAND_NAMES[slug] || slug;
    const { data, error } = await supabase
      .from('brands')
      .upsert({ name, slug }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to upsert brand ${slug}:`, error.message);
      continue;
    }

    brandIdMap.set(slug, data.id);
    console.log(`  ${name} (${slug}) -> ${data.id}`);
  }

  // Insert colors in batches
  console.log('\n--- Inserting colors ---');
  const BATCH_SIZE = 500;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < allColors.length; i += BATCH_SIZE) {
    const batch = allColors.slice(i, i + BATCH_SIZE);
    const rows = batch
      .filter(c => brandIdMap.has(c.brand_slug))
      .map(c => ({
        brand_id: brandIdMap.get(c.brand_slug)!,
        name: c.name,
        slug: c.slug,
        color_number: c.color_number,
        hex: c.hex,
        rgb_r: c.rgb_r,
        rgb_g: c.rgb_g,
        rgb_b: c.rgb_b,
        lab_l: c.lab_l,
        lab_a: c.lab_a,
        lab_b_val: c.lab_b_val,
        lrv: c.lrv,
        color_family: c.color_family,
      }));

    const { error, count } = await supabase
      .from('colors')
      .upsert(rows, { onConflict: 'brand_id,slug', ignoreDuplicates: true })
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      skipped += rows.length;
    } else {
      inserted += count ?? rows.length;
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allColors.length / BATCH_SIZE)}: ${rows.length} rows`);
    }
  }

  console.log(`\nInserted/updated: ${inserted}, Skipped/errors: ${skipped}`);

  // Update brand color counts
  console.log('\n--- Updating brand color counts ---');
  for (const [slug, brandId] of brandIdMap) {
    const { count, error } = await supabase
      .from('colors')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId);

    if (error) {
      console.error(`Failed to count colors for ${slug}:`, error.message);
      continue;
    }

    const { error: updateError } = await supabase
      .from('brands')
      .update({ color_count: count ?? 0 })
      .eq('id', brandId);

    if (updateError) {
      console.error(`Failed to update count for ${slug}:`, updateError.message);
    } else {
      console.log(`  ${BRAND_NAMES[slug] || slug}: ${count} colors`);
    }
  }

  console.log('\nSeed complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

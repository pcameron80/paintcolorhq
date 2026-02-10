import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColorNerdEntry {
  name: string;
  label: string | number;
  hex: string;
}

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
// Brand mapping: filename (without .json) -> { name, slug }
// ---------------------------------------------------------------------------

const BRAND_MAP: Record<string, { name: string; slug: string }> = {
  'behr':             { name: 'Behr',              slug: 'behr' },
  'benjamin-moore':   { name: 'Benjamin Moore',    slug: 'benjamin-moore' },
  'sherwin-williams': { name: 'Sherwin-Williams',  slug: 'sherwin-williams' },
  'dunn-edwards':     { name: 'Dunn-Edwards',      slug: 'dunn-edwards' },
  'ppg':              { name: 'PPG',               slug: 'ppg' },
  'valspar':          { name: 'Valspar',           slug: 'valspar' },
  'farrow-ball':      { name: 'Farrow & Ball',     slug: 'farrow-ball' },
  'kilz':             { name: 'Kilz',              slug: 'kilz' },
  'colorhouse':       { name: 'Colorhouse',        slug: 'colorhouse' },
  'ral':              { name: 'RAL',               slug: 'ral' },
  'dutch':            { name: 'Dutch Boy',         slug: 'dutch-boy' },
  'vista':            { name: 'Vista Paint',       slug: 'vista-paint' },
  'hl':               { name: 'Hirshfield\'s',     slug: 'hirshfields' },
  'mpc':              { name: 'MPC',               slug: 'mpc' },
};

// Files to skip (not paint brands relevant to our site)
const SKIP_FILES = new Set([
  'avery',      // vinyl wrap colors
  'dic',        // Japanese print colors
  'hks',        // European print colors
  'ikea',       // furniture store
  'kobra',      // spray paint
  'neenah',     // paper colors
  'toyo',       // Japanese ink colors
  'trumatch',   // print color system
]);

// ---------------------------------------------------------------------------
// Hex parsing
// ---------------------------------------------------------------------------

function parseHex(raw: string): { hex: string; r: number; g: number; b: number } | null {
  const trimmed = raw.trim();

  // Handle rgb(R, G, B) format
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    if (r > 255 || g > 255 || b > 255) return null;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return { hex, r, g, b };
  }

  // Handle hex format
  const cleaned = trimmed.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const hex = `#${cleaned.toLowerCase()}`;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return { hex, r, g, b };
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

function makeSlug(name: string, label: string | number | null): string {
  let base = name
    .toLowerCase()
    .replace(/[''"]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (label != null) {
    const labelStr = String(label).trim();
    if (labelStr) {
      const labelSlug = labelStr
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      base = `${base}-${labelSlug}`;
    }
  }

  return base;
}

// ---------------------------------------------------------------------------
// Color family classification (HSL-based)
// ---------------------------------------------------------------------------

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr: h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6; break;
      case gg: h = ((bb - rr) / d + 2) / 6; break;
      case bb: h = ((rr - gg) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function classifyColorFamily(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Achromatic checks first (low saturation)
  if (l > 90 && s < 15) return 'white';
  if (l > 85 && s < 20) return 'off-white';
  if (l < 10) return 'black';
  if (s < 15 && l >= 10 && l <= 90) return 'gray';

  // Beige: warm neutral, light
  if (s >= 10 && s <= 30 && h >= 30 && h <= 55 && l >= 60 && l <= 85) return 'beige';

  // Brown: warm, dark-to-mid
  if (s >= 15 && s <= 50 && h >= 15 && h <= 45 && l < 60) return 'brown';

  // Neutral catch-all for low saturation
  if (s < 20) return 'neutral';

  // Chromatic hue-based classification
  if (h >= 345 || h < 15) return 'red';
  if (h >= 15 && h < 45) return 'orange';
  if (h >= 45 && h < 70) return 'yellow';
  if (h >= 70 && h < 170) return 'green';
  if (h >= 170 && h < 260) return 'blue';
  if (h >= 260 && h < 290) return 'purple';
  if (h >= 290 && h < 345) return 'pink';

  return 'neutral';
}

// ---------------------------------------------------------------------------
// LRV calculation
// ---------------------------------------------------------------------------

function calculateLrv(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 * 100;
}

// ---------------------------------------------------------------------------
// RGB -> CIELAB conversion
// ---------------------------------------------------------------------------

function gammaDecodeChannel(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  const lr = gammaDecodeChannel(r);
  const lg = gammaDecodeChannel(g);
  const lb = gammaDecodeChannel(b);

  // sRGB -> XYZ (D65 illuminant)
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  return { x, y, z };
}

function xyzToLab(x: number, y: number, z: number): { l: number; a: number; b: number } {
  // D65 reference white
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : (903.3 * t + 16) / 116;

  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { l, a, b };
}

function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b_val: number } {
  const xyz = rgbToXyz(r, g, b);
  const lab = xyzToLab(xyz.x, xyz.y, xyz.z);
  return {
    l: Math.round(lab.l * 100) / 100,
    a: Math.round(lab.a * 100) / 100,
    b_val: Math.round(lab.b * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const jsonDir = path.resolve(__dirname, '../data/colornerd/json');
  const outFile = path.resolve(__dirname, '../data/colors-processed.json');

  if (!fs.existsSync(jsonDir)) {
    console.error(`Data directory not found: ${jsonDir}`);
    console.error('Run: git clone https://github.com/jpederson/colornerd data/colornerd');
    process.exit(1);
  }

  const allColors: ProcessedColor[] = [];
  const brandCounts: Record<string, number> = {};
  const seenSlugs = new Map<string, Set<string>>(); // brand_slug -> set of color slugs

  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const fileKey = file.replace('.json', '');

    if (SKIP_FILES.has(fileKey)) {
      console.log(`  Skipping ${file} (not a paint brand)`);
      continue;
    }

    const brandInfo = BRAND_MAP[fileKey];
    if (!brandInfo) {
      console.log(`  Skipping ${file} (no brand mapping)`);
      continue;
    }

    const raw = fs.readFileSync(path.join(jsonDir, file), 'utf8');
    const entries: ColorNerdEntry[] = JSON.parse(raw);

    if (!seenSlugs.has(brandInfo.slug)) {
      seenSlugs.set(brandInfo.slug, new Set());
    }
    const brandSlugs = seenSlugs.get(brandInfo.slug)!;
    let count = 0;

    for (const entry of entries) {
      const parsed = parseHex(entry.hex);
      if (!parsed) {
        console.warn(`  Invalid hex "${entry.hex}" for ${entry.name} in ${file}, skipping`);
        continue;
      }

      let slug = makeSlug(entry.name, entry.label);

      // Handle duplicate slugs within same brand
      if (brandSlugs.has(slug)) {
        let suffix = 2;
        while (brandSlugs.has(`${slug}-${suffix}`)) suffix++;
        slug = `${slug}-${suffix}`;
      }
      brandSlugs.add(slug);

      const lab = rgbToLab(parsed.r, parsed.g, parsed.b);

      allColors.push({
        name: entry.name.trim(),
        slug,
        color_number: entry.label != null ? String(entry.label).trim() || null : null,
        hex: parsed.hex,
        rgb_r: parsed.r,
        rgb_g: parsed.g,
        rgb_b: parsed.b,
        lab_l: lab.l,
        lab_a: lab.a,
        lab_b_val: lab.b_val,
        lrv: Math.round(calculateLrv(parsed.r, parsed.g, parsed.b) * 100) / 100,
        color_family: classifyColorFamily(parsed.r, parsed.g, parsed.b),
        brand_slug: brandInfo.slug,
      });

      count++;
    }

    brandCounts[brandInfo.name] = count;
  }

  // Write output
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(allColors, null, 2));

  // Summary
  console.log('\n=== Import Summary ===');
  console.log(`Total colors: ${allColors.length}`);
  console.log('\nColors per brand:');
  const sorted = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
  for (const [brand, count] of sorted) {
    console.log(`  ${brand}: ${count}`);
  }

  // Color family distribution
  const familyCounts: Record<string, number> = {};
  for (const c of allColors) {
    familyCounts[c.color_family] = (familyCounts[c.color_family] || 0) + 1;
  }
  console.log('\nColor family distribution:');
  const sortedFamilies = Object.entries(familyCounts).sort((a, b) => b[1] - a[1]);
  for (const [family, count] of sortedFamilies) {
    console.log(`  ${family}: ${count}`);
  }

  console.log(`\nOutput written to: ${outFile}`);
}

main();

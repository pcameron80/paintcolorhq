import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Each brand's actual website color family categories
const BRAND_FAMILIES: Record<string, string[]> = {
  "sherwin-williams": [
    "red", "orange", "yellow", "green", "blue", "purple", "neutral", "white-and-pastel",
  ],
  valspar: [
    "pink", "red", "orange", "yellow", "green", "teal", "blue",
    "white", "gray", "black", "brown", "neutral", "purple",
  ],
  ppg: [
    "reds", "oranges", "yellows", "greens", "blues", "purples",
    "pinks", "browns", "neutrals", "whites", "blacks",
    "grays", "beiges", "aquas", "metallics",
  ],
};

// Our color family -> best guess for each brand's website family
const FAMILY_GUESSES: Record<string, Record<string, string>> = {
  "sherwin-williams": {
    red: "red", orange: "orange", yellow: "yellow", green: "green",
    blue: "blue", purple: "purple", pink: "red",
    beige: "yellow", brown: "orange", gray: "neutral", neutral: "neutral",
    white: "white-and-pastel", "off-white": "white-and-pastel", black: "neutral",
  },
  valspar: {
    red: "red", orange: "orange", yellow: "yellow", green: "green",
    blue: "blue", purple: "purple", pink: "pink",
    beige: "brown", brown: "brown", gray: "gray", neutral: "neutral",
    white: "white", "off-white": "white", black: "black",
  },
  ppg: {
    red: "reds", orange: "oranges", yellow: "yellows", green: "greens",
    blue: "blues", purple: "purples", pink: "pinks", brown: "browns",
    gray: "grays", beige: "beiges", neutral: "neutrals",
    white: "whites", "off-white": "whites", black: "blacks",
  },
};

type ColorRow = {
  id: string;
  name: string;
  slug: string;
  color_number: string | null;
  color_family: string | null;
};

function buildUrl(brandSlug: string, color: ColorRow, family: string): string {
  const name = color.name;
  const num = color.color_number ?? "";

  switch (brandSlug) {
    case "sherwin-williams":
      return `https://www.sherwin-williams.com/en-us/color/color-family/${family}-paint-colors/SW${num}-${slugify(name)}`;
    case "ppg":
      return `https://www.ppgpaints.com/color/color-families/${family}/${slugify(name)}`;
    case "valspar": {
      const slug = `${slugify(name)}-${num.toLowerCase()}`;
      return `https://www.valspar.com/en/colors/browse-colors/lowes/${family}/${slug}`;
    }
    default:
      return "";
  }
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return true;
    if (res.status === 405 || res.status === 403) {
      const res2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(10000),
      });
      await res2.text();
      return res2.ok;
    }
    return false;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch all colors with pagination (Supabase limits to 1000 per query)
async function fetchAllColors(brandId: string): Promise<ColorRow[]> {
  const all: ColorRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("colors")
      .select("id, name, slug, color_number, color_family")
      .eq("brand_id", brandId)
      .order("name")
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(`Fetch error at offset ${offset}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

interface OverrideEntry {
  slug: string;
  colorNumber: string;
  ourFamily: string;
  correctFamily: string;
}

async function main() {
  const brandSlug = process.argv[2] || "valspar";
  const delayMs = parseInt(process.argv[3] || "150");

  const families = BRAND_FAMILIES[brandSlug];
  const guesses = FAMILY_GUESSES[brandSlug];
  if (!families || !guesses) {
    console.log(`Brand "${brandSlug}" not configured. Use: sherwin-williams, ppg, or valspar`);
    return;
  }

  console.log(`\nChecking ${brandSlug} (delay: ${delayMs}ms)`);
  console.log(`Website families: ${families.join(", ")}\n`);

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", brandSlug)
    .single();

  if (!brand) {
    console.log("Brand not found in DB");
    return;
  }

  const colors = await fetchAllColors(brand.id);
  console.log(`Colors to check: ${colors.length}\n`);

  const overrides: OverrideEntry[] = [];
  const notFound: string[] = [];
  let checked = 0;
  let passed = 0;

  const outputFile = path.resolve(__dirname, `retailer-links-${brandSlug}.json`);

  for (const color of colors) {
    const ourFamily = color.color_family ?? "neutral";
    const guessedFamily = guesses[ourFamily] ?? families[0];

    // Step 1: Try our best guess
    const guessUrl = buildUrl(brandSlug, color, guessedFamily);
    const guessOk = await checkUrl(guessUrl);
    await sleep(delayMs);

    if (guessOk) {
      passed++;
      process.stdout.write(".");
    } else {
      // Step 2: Try all other families
      let found: string | null = null;
      for (const tryFamily of families) {
        if (tryFamily === guessedFamily) continue;
        const tryUrl = buildUrl(brandSlug, color, tryFamily);
        const tryOk = await checkUrl(tryUrl);
        await sleep(delayMs);
        if (tryOk) {
          found = tryFamily;
          break;
        }
      }

      if (found) {
        overrides.push({
          slug: color.slug,
          colorNumber: color.color_number ?? "",
          ourFamily,
          correctFamily: found,
        });
        process.stdout.write("F");
      } else {
        notFound.push(`${color.name} (${color.color_number}) [${ourFamily}]`);
        process.stdout.write("X");
      }
    }

    checked++;
    if (checked % 50 === 0) {
      process.stdout.write(` [${checked}/${colors.length}]\n`);
      // Save progress
      fs.writeFileSync(outputFile, JSON.stringify({ overrides, notFound, checked, passed }, null, 2));
    }
  }

  // Final save
  fs.writeFileSync(outputFile, JSON.stringify({ overrides, notFound, checked, passed }, null, 2));

  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`Results for ${brandSlug}:`);
  console.log(`  Checked:        ${checked}`);
  console.log(`  Passed (guess): ${passed}`);
  console.log(`  Fixed (found):  ${overrides.length}`);
  console.log(`  Not on website: ${notFound.length}`);

  // Print correction summary
  if (overrides.length > 0) {
    console.log(`\nFamily mapping corrections needed:`);
    const byMapping: Record<string, number> = {};
    for (const o of overrides) {
      const guessed = guesses[o.ourFamily] ?? "?";
      const key = `our "${o.ourFamily}" → guessed "${guessed}" → actual "${o.correctFamily}"`;
      byMapping[key] = (byMapping[key] ?? 0) + 1;
    }
    for (const [mapping, count] of Object.entries(byMapping).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count}x: ${mapping}`);
    }
  }

  if (notFound.length > 0) {
    console.log(`\nNot found on website (first 20):`);
    for (const nf of notFound.slice(0, 20)) {
      console.log(`  ${nf}`);
    }
    if (notFound.length > 20) console.log(`  ... and ${notFound.length - 20} more`);
  }

  console.log(`\nOverrides saved to: ${outputFile}`);
}

main().catch(console.error);

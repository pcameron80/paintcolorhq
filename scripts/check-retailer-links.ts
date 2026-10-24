/**
 * Checks outbound brand and retailer links.
 *
 *   npx tsx scripts/check-retailer-links.ts <brand-slug> [delay-ms]
 *       Every color of one brand from Supabase; writes retailer-links-<brand>.json
 *       for generate-retailer-overrides.ts (needs SUPABASE_SERVICE_ROLE_KEY).
 *       PPG, Valspar, Dutch Boy and Vista are not brute-forced here: their links
 *       come from the brands' sitemaps (scripts/generate-official-color-urls.ts).
 *   npx tsx scripts/check-retailer-links.ts --sample [per-brand=20] [delay-ms=1000] [site]
 *       Up to N links per brand, built by getRetailerLinks from colors the site's
 *       public /api/brand/<slug>/colors returns. Prints only; writes nothing.
 *   npx tsx scripts/check-retailer-links.ts --org [delay-ms=1000]
 *       Every url in src/lib/brand-org-data.ts (brand-page "Visit" link + schema).
 *   npx tsx scripts/check-retailer-links.ts --url <url> [url...]
 *
 * A link passes only when it ends on a 2xx AND on the host it was sent to
 * (ignoring "www."). Any redirect off-site fails, even when it ends in a 200.
 * In --sample, a brand's own per-color link must also stay on its path (Valspar
 * redirects retired colors to the generic browse page with a 200) and carry the
 * color's name in <title> (ppgpaints.com served a "PPG Paints is now Pittsburgh
 * Paints" interstitial with a 200 for every color).
 * The --sample, --org and --url modes exit 1 when anything fails.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { BRAND_ORG_DATA } from "../src/lib/brand-org-data";
import { getRetailerLinks, isAffiliateRetailer, nameSlug, RETAILER_LINK_BRANDS } from "../src/lib/retailer-links";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Created on first use so --sample, --org and --url run without credentials.
let supabaseClient: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  supabaseClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return supabaseClient;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Each brand's actual website color family categories
const BRAND_FAMILIES: Record<string, string[]> = {
  // The eight family segments in SW's sitemap (2026-10-24); "white-and-pastel"
  // was retired for "white".
  "sherwin-williams": [
    "red", "orange", "yellow", "green", "blue", "purple", "neutral", "white",
  ],
  "dunn-edwards": ["_none_"],  // No family segment needed — just color number
  kilz: ["_none_"],            // No family segment needed — just color number + name
  ral: ["_none_"],             // No family segment needed — just color number + name
};

// Our color family -> best guess for each brand's website family
const FAMILY_GUESSES: Record<string, Record<string, string>> = {
  "sherwin-williams": {
    red: "red", orange: "orange", yellow: "yellow", green: "green",
    blue: "blue", purple: "purple", pink: "red",
    beige: "yellow", brown: "orange", gray: "neutral", neutral: "neutral",
    white: "white", "off-white": "white", black: "neutral",
  },
  "dunn-edwards": { _: "_none_" },  // Single URL pattern, no family needed
  kilz: { _: "_none_" },            // Single URL pattern, no family needed
  ral: { _: "_none_" },
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
    case "dunn-edwards":
      return `https://www.dunnedwards.com/colors/browser/${num.toLowerCase()}/`;
    case "kilz":
      return `https://www.kilz.com/color/${slugify(name)}-${num}`;
    case "ral":
      return `https://www.ralcolorchart.com/ral-classic/ral-${num}-${slugify(name)}`;
    default:
      return "";
  }
}

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

interface UrlCheck {
  ok: boolean;
  status: number;        // final HTTP status; 0 when the request itself failed
  finalUrl: string;
  offSiteHost?: string;  // set when the redirect chain ended on another site
  reason?: string;       // why it failed
}

function bareHost(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
}

function barePath(url: string): string {
  return new URL(url).pathname.toLowerCase().replace(/\/+$/, "");
}

/** Lowercase letters and digits only, accents folded, entities decoded. */
function squash(text: string): string {
  return nameSlug(
    text.replace(/&#0*39;|&#x0*27;|&apos;|&rsquo;/gi, "'").replace(/&amp;/gi, "&"),
  ).replace(/-/g, "");
}

/**
 * expectName: the link is a brand's own page for that color, so it must also
 * end on the same path and name the color in its <title>. That catches a 200
 * that is not the color: an interstitial, or a redirect to a listing page.
 */
async function checkUrl(url: string, expectName?: string): Promise<UrlCheck> {
  const request = (method: "HEAD" | "GET") => fetch(url, {
    method,
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15000),
  });
  try {
    let res = await request(expectName ? "GET" : "HEAD");
    const body = expectName ? await res.text() : "";
    if (!expectName && (res.status === 405 || res.status === 403)) {
      res = await request("GET");
      await res.text();
    }
    const finalUrl = res.url || url;
    // Status alone is not enough: colorhousepaint.store 301'd every color to a
    // gambling site and passed 128/128 because the 200 at the end of the chain
    // counted (found 2026-10-23). Ending on another host is a failure.
    const finalHost = bareHost(finalUrl);
    if (finalHost !== bareHost(url)) {
      return { ok: false, status: res.status, finalUrl, offSiteHost: finalHost, reason: `redirects off-site to ${finalHost}` };
    }
    if (!res.ok) {
      // Behr, Kilz (Cloudflare), Benjamin Moore (Akamai) and the big-box
      // search pages answer scripts with 403/503 while working in a browser.
      const blocked = [403, 429, 503].includes(res.status) ? " (bot wall or dead; check in a browser)" : "";
      return { ok: false, status: res.status, finalUrl, reason: `HTTP ${res.status}${blocked}` };
    }
    if (expectName) {
      if (barePath(finalUrl) !== barePath(url)) {
        return { ok: false, status: res.status, finalUrl, reason: `redirects to ${new URL(finalUrl).pathname}` };
      }
      const title = body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
      if (!squash(title).includes(squash(expectName))) {
        return { ok: false, status: res.status, finalUrl, reason: `<title> lacks "${expectName}": "${title.slice(0, 80)}"` };
      }
    }
    return { ok: true, status: res.status, finalUrl };
  } catch (err) {
    const cause = err instanceof Error && err.cause instanceof Error ? `: ${err.cause.message}` : "";
    return { ok: false, status: 0, finalUrl: url, reason: `${err instanceof Error ? err.message : String(err)}${cause}` };
  }
}

function describe(r: UrlCheck): string {
  return r.ok ? `PASS ${r.status}` : `FAIL ${r.reason}`;
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
    const { data, error } = await supabase()
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

async function checkBrand(brandSlug: string, delayMs: number) {
  const families = BRAND_FAMILIES[brandSlug];
  const guesses = FAMILY_GUESSES[brandSlug];
  if (!families || !guesses) {
    console.log(`Brand "${brandSlug}" not configured. Use: ${Object.keys(BRAND_FAMILIES).join(", ")}`);
    return;
  }

  const noFamilyBrand = families.length === 1 && families[0] === "_none_";

  console.log(`\nChecking ${brandSlug} (delay: ${delayMs}ms)`);
  console.log(`Website families: ${families.join(", ")}\n`);

  const { data: brand } = await supabase()
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
  const offSite = new Map<string, number>();
  let checked = 0;
  let passed = 0;

  const check = async (url: string): Promise<boolean> => {
    const r = await checkUrl(url);
    await sleep(delayMs);
    if (r.offSiteHost) offSite.set(r.offSiteHost, (offSite.get(r.offSiteHost) ?? 0) + 1);
    return r.ok;
  };

  const outputFile = path.resolve(__dirname, `retailer-links-${brandSlug}.json`);

  for (const color of colors) {
    const ourFamily = color.color_family ?? "neutral";

    if (noFamilyBrand) {
      // Simple check — no family segment to guess
      const url = buildUrl(brandSlug, color, "_none_");
      const ok = await check(url);

      if (ok) {
        passed++;
        process.stdout.write(".");
      } else {
        notFound.push(`${color.name} (${color.color_number}) [${ourFamily}]`);
        process.stdout.write("X");
      }
    } else {
      const guessedFamily = guesses[ourFamily] ?? families[0];

      // Step 1: Try our best guess
      const guessUrl = buildUrl(brandSlug, color, guessedFamily);
      const guessOk = await check(guessUrl);

      if (guessOk) {
        passed++;
        process.stdout.write(".");
      } else {
        // Step 2: Try all other families
        let found: string | null = null;
        for (const tryFamily of families) {
          if (tryFamily === guessedFamily) continue;
          const tryUrl = buildUrl(brandSlug, color, tryFamily);
          const tryOk = await check(tryUrl);
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

  if (offSite.size > 0) {
    console.log(`\nREDIRECTED TO ANOTHER SITE (possible hijack; counted as not found):`);
    for (const [host, n] of [...offSite].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${n}x -> ${host}`);
    }
  }

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

async function checkUrls(urls: string[]) {
  if (urls.length === 0) {
    console.log("Usage: npx tsx scripts/check-retailer-links.ts --url <url> [url...]");
    process.exitCode = 1;
    return;
  }
  for (const url of urls) {
    const r = await checkUrl(url);
    console.log(`${describe(r)}  ${url}`);
    if (!r.ok) process.exitCode = 1;
  }
}

async function checkOrgUrls(delayMs: number) {
  let failed = 0;
  for (const [slug, org] of Object.entries(BRAND_ORG_DATA)) {
    if (!org.url) {
      console.log(`SKIP (no url)  ${slug}`);
      continue;
    }
    const r = await checkUrl(org.url);
    console.log(`${describe(r)}  ${slug}  ${org.url}`);
    if (!r.ok) failed++;
    await sleep(delayMs);
  }
  console.log(`\n${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

// The catalog's color families, in brand-page order. Sampling across families
// exercises the family segment of the SW URLs and the family folders in the
// sitemap-built PPG, Valspar, Dutch Boy and Vista maps.
const SAMPLE_FAMILIES = [
  "white", "off-white", "gray", "beige", "neutral", "brown", "tan", "red",
  "orange", "yellow", "green", "blue", "purple", "pink", "black",
];

interface ApiColor { name: string; slug: string; color_number: string | null }

// Brands whose own link is one library page for every color, so its <title>
// cannot name the color.
const STATIC_OFFICIAL_LINK = new Set(["hirshfields"]);

async function sampleBrands(perBrand: number, delayMs: number, site: string) {
  const rows: { brand: string; checked: number; offSite: number; failures: string[] }[] = [];

  for (const brandSlug of RETAILER_LINK_BRANDS) {
    // url -> the color it came from. A brand whose link is one static page
    // (Hirshfield's) collapses to a single URL.
    const urls = new Map<string, { from: string; expectName?: string }>();
    let inCatalog = true;

    for (const family of SAMPLE_FAMILIES) {
      if (urls.size >= perBrand) break;
      const res = await fetch(`${site}/api/brand/${brandSlug}/colors?family=${family}`);
      if (res.status === 404) { inCatalog = false; break; }
      if (!res.ok) throw new Error(`${site} returned ${res.status} for ${brandSlug}/${family}`);
      const { colors } = (await res.json()) as { colors: ApiColor[] };
      // Two colors per family, from the start and middle of the A-Z page.
      const picks = [colors[0], colors[Math.floor(colors.length / 2)]]
        .filter((c, i, all): c is ApiColor => Boolean(c) && all.indexOf(c) === i);
      const before = urls.size;
      let built = 0;
      for (const c of picks) {
        // brandName is not part of any URL pattern, so the slug stands in.
        for (const link of getRetailerLinks(brandSlug, brandSlug, c.name, c.color_number ?? undefined, family)) {
          built++;
          if (urls.size < perBrand && !urls.has(link.url)) {
            const own = !isAffiliateRetailer(link.retailerName) && !STATIC_OFFICIAL_LINK.has(brandSlug);
            urls.set(link.url, { from: `${c.name} [${family}]`, expectName: own ? c.name : undefined });
          }
        }
      }
      // Links were built but all were already seen: the brand's links are static.
      if (built > 0 && urls.size === before) break;
      await sleep(250);
    }

    if (!inCatalog) {
      console.log(`\n${brandSlug}: not in the catalog, skipped`);
      continue;
    }

    console.log(`\n${brandSlug}: ${urls.size} URLs`);
    const failures: string[] = [];
    let offSite = 0;
    for (const [url, { from, expectName }] of urls) {
      const r = await checkUrl(url, expectName);
      console.log(`  ${describe(r)}  ${url}  (${from})`);
      if (!r.ok) failures.push(`${r.reason}: ${url}`);
      if (r.offSiteHost) offSite++;
      await sleep(delayMs);
    }
    rows.push({ brand: brandSlug, checked: urls.size, offSite, failures });
  }

  console.log(`\n| Brand | URLs checked | Passed | Redirected off-site | Other failures |`);
  console.log(`|---|---|---|---|---|`);
  for (const r of rows) {
    console.log(`| ${r.brand} | ${r.checked} | ${r.checked - r.failures.length} | ${r.offSite} | ${r.failures.length - r.offSite} |`);
  }
  const failed = rows.flatMap((r) => r.failures.map((f) => `${r.brand}: ${f}`));
  if (failed.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failed) console.log(`  ${f}`);
    process.exitCode = 1;
  }
}

async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === "--url") return checkUrls(rest);
  if (mode === "--org") return checkOrgUrls(parseInt(rest[0] || "1000"));
  if (mode === "--sample") {
    return sampleBrands(
      parseInt(rest[0] || "20"),
      parseInt(rest[1] || "1000"),
      (rest[2] || "https://www.paintcolorhq.com").replace(/\/$/, "")
    );
  }
  return checkBrand(mode || "valspar", parseInt(rest[0] || "150"));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

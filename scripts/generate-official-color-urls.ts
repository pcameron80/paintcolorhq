/**
 * Builds the per-color "View official color" URL maps in src/lib/official-urls/
 * from each brand's own sitemap, so a color page links to that color's page on
 * the brand site instead of a guessed URL, an interstitial or a generic library.
 *
 *   npx tsx scripts/generate-official-color-urls.ts [brand...] [--site=<url>] [--dry-run]
 *
 * Brands: ppg, valspar, dutch-boy, vista-paint (default: all four).
 * --site     where our catalog is read from (default https://www.paintcolorhq.com,
 *            via the public /api/brand/<slug>/colors endpoint; no credentials).
 * --dry-run  prints coverage without writing the JSON files.
 *
 * Network cost per run: one sitemap fetch per brand (Vista: its index plus three
 * product sitemaps), plus, for PPG only, one page per name the sitemap cannot
 * resolve on its own (a repeated name, e.g. misty-moor-2), at 1 request per
 * second, about 150 pages. No brute-force URL guessing.
 *
 * Each map is keyed by our color_number exactly as stored, so the lookup in
 * src/lib/retailer-links.ts is direct. A color missing from a map gets no
 * official link (the page falls back to its retailer or Amazon CTA).
 *
 * Re-run quarterly, then `npx tsx scripts/check-retailer-links.ts --sample`.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { nameSlug } from "../src/lib/retailer-links";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../src/lib/official-urls");
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SITE = (args.find((a) => a.startsWith("--site="))?.slice("--site=".length) ?? "https://www.paintcolorhq.com").replace(/\/$/, "");
const BRANDS = ["ppg", "valspar", "dutch-boy", "vista-paint"] as const;
type Brand = (typeof BRANDS)[number];
const requested = args.filter((a) => !a.startsWith("--"));
for (const b of requested) {
  if (!(BRANDS as readonly string[]).includes(b)) throw new Error(`Unknown brand "${b}". Use: ${BRANDS.join(", ")}`);
}
const selected = (requested.length ? requested : BRANDS) as Brand[];

interface CatalogColor { name: string; color_number: string | null }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${url} returned HTTP ${res.status}`);
  return res.text();
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

async function catalog(brand: Brand): Promise<CatalogColor[]> {
  const all: CatalogColor[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${SITE}/api/brand/${brand}/colors?page=${page}`);
    if (!res.ok) throw new Error(`${SITE} returned ${res.status} for ${brand} page ${page}`);
    const data = (await res.json()) as { colors: CatalogColor[]; totalPages: number };
    all.push(...data.colors);
    if (page >= data.totalPages) break;
    await sleep(250);
  }
  return all;
}

type UrlMap = Record<string, string>;
interface Result { map: UrlMap; unmatched: string[]; notes: string[] }

interface SitePage { value: string; nameSlug: string }
type CodeIndex = Map<string, SitePage[]>;

function addPage(index: CodeIndex, code: string, page: SitePage) {
  const list = index.get(code) ?? [];
  if (!list.some((p) => p.value === page.value)) list.push(page);
  index.set(code, list);
}

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Joins brand-site pages, indexed by normalized color code, onto our catalog.
 * A page is linked only when its URL name also matches our color name: codes
 * alone collide (Vista's stock base "49-vista-white" shares 49 with
 * "49-auburn-wave"), and a link to the wrong color is worse than none. A
 * spelling variant of two characters or fewer on the only page for that code
 * still links ("Ashen Grey" -> ashen-gray-6004-1c).
 */
function joinByCode(colors: CatalogColor[], index: CodeIndex, normalize: (code: string) => string): Result {
  const map: UrlMap = {};
  const unmatched: string[] = [];
  const notes: string[] = [];
  for (const c of colors) {
    if (!c.color_number) { unmatched.push(`${c.name} (no number)`); continue; }
    const pages = index.get(normalize(c.color_number)) ?? [];
    const ours = nameSlug(c.name);
    const hit = pages.find((p) => p.nameSlug === ours);
    if (hit) { map[c.color_number] = hit.value; continue; }
    if (pages.length === 1 && editDistance(pages[0].nameSlug, ours) <= 2) {
      notes.push(`spelling variant, linked: ${c.name} (${c.color_number}) -> ${pages[0].value}`);
      map[c.color_number] = pages[0].value;
      continue;
    }
    if (pages.length > 0) {
      notes.push(`code matches but name does not, not linked: ${c.name} (${c.color_number}) vs ${pages.map((p) => p.value).join(", ")}`);
    }
    unmatched.push(`${c.name} (${c.color_number})`);
  }
  return { map, unmatched, notes };
}

async function buildPpg(colors: CatalogColor[]): Promise<Result> {
  // PPG Paints moved its consumer color pages to pittsburghpaints.com; every
  // ppgpaints.com color URL now lands on a "PPG Paints is now Pittsburgh Paints"
  // interstitial. Color pages there are /ppg-colors/<name-slug>, with a suffix
  // when a name repeats (misty-moor-2 is PPG1116-4; aster-petal-3c843).
  const prefix = "https://www.pittsburghpaints.com/ppg-colors/";
  const slugs = locs(await get("https://www.pittsburghpaints.com/sitemap.xml"))
    .filter((u) => u.startsWith(prefix))
    .map((u) => u.slice(prefix.length).replace(/\/$/, ""))
    .filter((s) => s && !s.includes("/"));
  if (slugs.length < 3000) throw new Error(`pittsburghpaints.com sitemap lists only ${slugs.length} /ppg-colors/ pages; expected about 3,300`);

  const groups = new Map<string, CatalogColor[]>();
  for (const c of colors) {
    const key = nameSlug(c.name);
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }

  const map: UrlMap = {};
  const unmatched: string[] = [];
  const notes: string[] = [];
  const titleCode = new Map<string, string | null>();
  let fetched = 0;

  const norm = (code: string) => code.toUpperCase().replace(/^PPG\s*/, "").replace(/\s+/g, " ").trim();

  const codeOf = async (slug: string): Promise<string | null> => {
    if (titleCode.has(slug)) return titleCode.get(slug)!;
    let code: string | null = null;
    try {
      const html = await get(`${prefix}${slug}`);
      // "Field Poppy - PPG1195-7 Paint Color | PPG Paints"
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "";
      const raw = title.match(/ - (.+?) Paint Color/)?.[1];
      code = raw ? norm(raw) : null;
    } catch (err) {
      notes.push(`fetch failed for ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
    fetched++;
    titleCode.set(slug, code);
    await sleep(1000);
    return code;
  };

  for (const [key, group] of groups) {
    if (!key) {
      for (const c of group) unmatched.push(`${c.name} (${c.color_number})`);
      continue;
    }
    // Repeats carry "-2" or a 5-hex-digit suffix ("afternoon-tea-c56df").
    const suffixed = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+|[0-9a-f]{5})$`);
    const candidates = slugs.filter((s) => s === key || suffixed.test(s));
    if (candidates.length === 0) {
      for (const c of group) unmatched.push(`${c.name} (${c.color_number})`);
      continue;
    }
    if (candidates.length === 1 && candidates[0] === key && group.length === 1) {
      if (group[0].color_number) map[group[0].color_number] = key;
      else unmatched.push(`${group[0].name} (no number)`);
      continue;
    }
    // Ambiguous: read the code from each candidate's <title>.
    const byCode = new Map<string, string>();
    for (const s of candidates) {
      const code = await codeOf(s);
      if (code) byCode.set(code, s);
    }
    for (const c of group) {
      const hit = c.color_number ? byCode.get(norm(c.color_number)) : undefined;
      if (hit) map[c.color_number!] = hit;
      else unmatched.push(`${c.name} (${c.color_number}) [candidates: ${candidates.join(", ")}]`);
    }
  }
  notes.push(`${slugs.length} /ppg-colors/ pages in the sitemap; ${fetched} pages fetched to resolve repeated names`);
  return { map, unmatched, notes };
}

async function buildValspar(colors: CatalogColor[]): Promise<Result> {
  // /en/colors/browse-colors/<channel>/<family>/<name-slug>-<code>. Lowe's is the
  // channel our buy CTA points at, so its page wins; independent-retailers covers
  // colors Lowe's does not list. A color absent from the sitemap is gone: its old
  // URL either 404s or redirects to the generic browse page.
  const prefix = "https://www.valspar.com/en/colors/browse-colors/";
  const urls = locs(await get("https://www.valspar.com/en.sitemap.xml")).filter((u) => u.startsWith(prefix));
  const lowes: CodeIndex = new Map();
  const other: CodeIndex = new Map();
  for (const u of urls) {
    const rest = u.slice(prefix.length);
    const m = rest.match(/^([a-z-]+)\/([a-z-]+)\/(.+)-(\d{4}-\d+[a-z]?)$/);
    if (!m) continue;
    addPage(m[1] === "lowes" ? lowes : other, m[4].toUpperCase(), { value: rest, nameSlug: m[3] });
  }
  const lowesCount = [...lowes.values()].reduce((n, l) => n + l.length, 0);
  if (lowesCount < 1500) throw new Error(`valspar.com sitemap lists only ${lowesCount} Lowe's color pages; expected at least 1,500`);
  const index: CodeIndex = new Map();
  for (const [code, pages] of lowes) for (const p of pages) addPage(index, code, p);
  for (const [code, pages] of other) for (const p of pages) addPage(index, code, p);
  const result = joinByCode(colors, index, (c) => c.toUpperCase());
  result.notes.push(`${lowesCount} Lowe's color pages and ${index.size} distinct codes in the sitemap`);
  return result;
}

async function buildDutchBoy(colors: CatalogColor[]): Promise<Result> {
  // /en/colors/color-library/paint/<family>/<name-slug>-<code>, e.g. .../black/true-black-438-7db
  const prefix = "https://www.dutchboy.com/en/colors/color-library/paint/";
  const index: CodeIndex = new Map();
  for (const u of locs(await get("https://www.dutchboy.com/en.sitemap.xml"))) {
    if (!u.startsWith(prefix)) continue;
    const rest = u.slice(prefix.length);
    const m = rest.match(/^([a-z-]+)\/(.+)-(\d+-\d+db)$/);
    if (m) addPage(index, m[3].toUpperCase(), { value: rest, nameSlug: m[2] });
  }
  if (index.size < 1000) throw new Error(`dutchboy.com sitemap lists only ${index.size} paint color pages; expected about 1,300`);
  const result = joinByCode(colors, index, (c) => c.toUpperCase());
  result.notes.push(`${index.size} paint color codes in the sitemap`);
  return result;
}

function normVista(code: string): string {
  const m = code.trim().toLowerCase().match(/^([a-z]*)0*(\d+)$/);
  return m ? `${m[1]}${m[2]}` : code.trim().toLowerCase();
}

async function buildVista(colors: CatalogColor[]): Promise<Result> {
  // /colors/<Family>/<number>-<name-slug>/ (a few have no family segment). Our
  // numbers carry leading zeros ("0175"); Vista's URLs do not ("175-3am-latte").
  const prefix = "https://www.vistapaint.com/colors/";
  const sitemaps = locs(await get("https://www.vistapaint.com/sitemap_index.xml"))
    .filter((u) => /\/product-sitemap\d*\.xml$/.test(u));
  const index: CodeIndex = new Map();
  for (const sm of sitemaps) {
    await sleep(1000);
    for (const u of locs(await get(sm))) {
      if (!u.startsWith(prefix)) continue;
      const rest = u.slice(prefix.length);
      const m = rest.match(/^(?:[A-Za-z-]+\/)?([a-z]*\d+)-([^/]+)\/?$/i);
      if (m) addPage(index, normVista(m[1]), { value: rest, nameSlug: m[2].toLowerCase() });
    }
  }
  if (index.size < 2000) throw new Error(`vistapaint.com sitemaps list only ${index.size} color codes; expected about 2,900`);
  const result = joinByCode(colors, index, normVista);
  result.notes.push(`${index.size} color codes across ${sitemaps.length} product sitemaps`);
  return result;
}

const BUILDERS: Record<Brand, (c: CatalogColor[]) => Promise<Result>> = {
  ppg: buildPpg,
  valspar: buildValspar,
  "dutch-boy": buildDutchBoy,
  "vista-paint": buildVista,
};

async function main() {
  if (!DRY_RUN) fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const brand of selected) {
    console.log(`\n${brand}`);
    const colors = await catalog(brand);
    const { map, unmatched, notes } = await BUILDERS[brand](colors);
    const mapped = Object.keys(map).length;
    console.log(`  ${colors.length} colors in our catalog, ${mapped} mapped, ${unmatched.length} without an official page`);
    for (const n of notes.slice(0, 20)) console.log(`  note: ${n}`);
    if (notes.length > 20) console.log(`  ... ${notes.length - 20} more notes`);
    for (const u of unmatched.slice(0, 20)) console.log(`  unmatched: ${u}`);
    if (unmatched.length > 20) console.log(`  ... ${unmatched.length - 20} more unmatched`);
    if (mapped < colors.length * 0.5) throw new Error(`${brand}: only ${mapped}/${colors.length} mapped; refusing to write a map this sparse`);
    if (DRY_RUN) continue;
    const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    const body = entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n");
    const file = path.join(OUT_DIR, `${brand}.json`);
    fs.writeFileSync(file, `{\n${body}\n}\n`);
    console.log(`  wrote ${path.relative(process.cwd(), file)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

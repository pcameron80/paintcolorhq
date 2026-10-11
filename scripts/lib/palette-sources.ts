/**
 * Where each brand publishes its live palette, and how to turn it into
 * { code, name, hex }. One entry per brand slug in the `brands` table.
 *
 * Every fetcher is read-only and uses the same public endpoints the brand's
 * own website calls. When a brand changes its site, its fetcher throws and
 * the scan reports that brand as failed instead of reporting 0 missing.
 */

import type { LiveColor } from './palette-diff';

export interface PaletteSource {
  /** human-readable source, written into the report */
  source: string;
  fetch: () => Promise<LiveColor[]>;
  /** map the manufacturer's code onto our DB color_number convention */
  normalizeCode?: (code: string) => string;
  /** drop out-of-scope entries (stains, metallics, spray) before diffing */
  keep?: (c: LiveColor) => boolean;
}

export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export async function getText(url: string, init: RequestInit = {}): Promise<string> {
  // Retries 429/503 with backoff: some brand sites (Dunn-Edwards) shed load under modest concurrency.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': UA, Accept: '*/*', ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(60_000),
    });
    if (res.ok) return res.text();
    if ((res.status === 429 || res.status === 503) && attempt < 5) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} — ${url}`);
  }
}

export async function getJson<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  return JSON.parse(await getText(url, { ...init, headers: { Accept: 'application/json', ...(init.headers ?? {}) } })) as T;
}

/** Fail loudly when a source shrinks to nothing — a broken scraper must not read as "no new colors". */
export function assertCount(brand: string, colors: LiveColor[], min: number): LiveColor[] {
  if (colors.length < min) {
    throw new Error(`${brand}: source returned ${colors.length} colors, expected at least ${min} — source format probably changed`);
  }
  return colors;
}

/** Run `fn` over `items` with at most `n` in flight. */
export async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

/**
 * Fetch a JS-rendered page through the self-hosted crawl4ai server on the NAS,
 * for sites behind Cloudflare bot checks. Needs CRAWL4AI_TOKEN in .env.local
 * (the server's API token); CRAWL4AI_URL defaults to the NAS address.
 */
export async function getRenderedHtml(url: string): Promise<string> {
  const base = process.env.CRAWL4AI_URL ?? 'http://192.168.2.110:11235';
  const token = process.env.CRAWL4AI_TOKEN;
  if (!token) throw new Error('CRAWL4AI_TOKEN not set — this source needs the crawl4ai server (Cloudflare blocks plain fetch)');
  const res = await fetch(`${base}/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ urls: [url] }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`crawl4ai ${res.status} for ${url}`);
  const body = (await res.json()) as { results?: { html?: string; success?: boolean }[] };
  const html = body.results?.[0]?.html;
  if (!html) throw new Error(`crawl4ai returned no HTML for ${url}`);
  return html;
}

// ---------------------------------------------------------------------------
// Sherwin-Williams, Valspar and Dutch Boy share one "prism" color API
// (all three are Sherwin-Williams Company brands).
// ---------------------------------------------------------------------------

interface PrismColor {
  colorNumber: string;
  name: string;
  hex: string;
  archived?: boolean;
}

function prism(host: string, brandPath: string, min: number): () => Promise<LiveColor[]> {
  return async () => {
    const data = await getJson<PrismColor[]>(
      `https://${host}/prism/v1/colors/${brandPath}?lng=en-US&_corev=7.10.0`,
    );
    return assertCount(
      brandPath,
      data.map((c) => ({ code: c.colorNumber, name: c.name, hex: c.hex, archived: c.archived || undefined })),
      min,
    );
  };
}

// ---------------------------------------------------------------------------
// Farrow & Ball: Magento GraphQL lists the paint products (no code or hex),
// then each product page carries the code ("No. 239") and the swatch hex.
// Archive colours are included and flagged; the DB keeps some as is_archived.
// ---------------------------------------------------------------------------

async function farrowBall(): Promise<LiveColor[]> {
  type Item = { name: string; url_key: string; categories: { name: string }[] };
  const items: Item[] = [];
  for (let page = 1; ; page++) {
    const query = `{ products(filter:{category_uid:{eq:"Ng=="}}, pageSize:100, currentPage:${page}, sort:{name:ASC}) {
      page_info { total_pages } items { name url_key categories { name } } } }`;
    const res = await getJson<{ data: { products: { page_info: { total_pages: number }; items: Item[] } } }>(
      'https://www.farrow-ball.com/graphql',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) },
    );
    items.push(...res.data.products.items);
    if (page >= res.data.products.page_info.total_pages) break;
  }
  const inCat = (x: Item, cat: string) => x.categories.some((c) => c.name.trim() === cat);
  // Drops the colour cards and fans, which sit in neither category.
  const colors = items.filter((x) => inCat(x, 'All Paint Colours') || inCat(x, 'Archive Paint Colours'));
  const parsed = await pool(colors, 6, async (x): Promise<LiveColor | null> => {
    const html = await getText(`https://www.farrow-ball.com/paint/${x.url_key}`);
    const code = html.match(/product-top-info-code">\s*<span>([^<]+)<\/span>/)?.[1]?.trim();
    const hex = html.match(/product-top-info[^>]*\n?\s*style="background-color: (?:&#x23;|#)([0-9A-Fa-f]{6})/)?.[1];
    if (!code) return null;
    return { code, name: x.name.trim(), hex: hex ? `#${hex}` : null, archived: inCat(x, 'Archive Paint Colours') || undefined };
  });
  return assertCount('farrow-ball', parsed.filter((c): c is LiveColor => c !== null), 120);
}

// ---------------------------------------------------------------------------
// Kilz: kilz.com/color holds all three collections (Tribute, Tribute Trim,
// Chalk Style) as tab panes of chips. Cloudflare blocks plain fetch.
// ---------------------------------------------------------------------------

async function kilz(): Promise<LiveColor[]> {
  const html = await getRenderedHtml('https://www.kilz.com/color');
  const rx = /openColorDetail\('([^']+)'(?:, *\w+)?\)".*?background:\s*(#[0-9A-Fa-f]{6}).*?color-name">([^<]*)<\/span>/gs;
  const out: LiveColor[] = [];
  for (const m of html.matchAll(rx)) out.push({ code: m[1], name: titleCase(m[3].trim()), hex: m[2] });
  return assertCount('kilz', out, 90);
}

const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, p, c) => p + c.toUpperCase());

// ---------------------------------------------------------------------------
// Benjamin Moore: api.benjaminmoore.io (Azure API Management). The site's
// frontend sends a public subscription key from its _app bundle; resolve the
// bundle and key from the live page each run, since both change per deploy.
// Pagination is offset/limit (the start_at/max_results the API echoes back
// are ignored on input).
// ---------------------------------------------------------------------------

async function benjaminMoore(): Promise<LiveColor[]> {
  const page = await getText('https://www.benjaminmoore.com/en-us/paint-colors');
  const bundle = page.match(/\/_next\/static\/chunks\/pages\/_app-[0-9a-f]+\.js/)?.[0];
  if (!bundle) throw new Error('benjamin-moore: _app bundle not found on paint-colors page');
  const js = await getText(`https://www.benjaminmoore.com${bundle}`);
  const key = js.match(/"Ocp-Apim-Subscription-Key":"([0-9a-f]{32})"/)?.[1];
  if (!key) throw new Error('benjamin-moore: subscription key not found in _app bundle');

  type Page = { is_last: boolean; colors: { number: string; name: string; hex: string }[] };
  const out: LiveColor[] = [];
  for (let offset = 0; ; ) {
    const res = await getJson<Page>(
      `https://api.benjaminmoore.io/colors/colors?version=v1.0&locale=en_US&color_response_type=simple&offset=${offset}&limit=100`,
      { headers: { 'Ocp-Apim-Subscription-Key': key } },
    );
    out.push(...res.colors.map((c) => ({ code: c.number, name: c.name, hex: `#${c.hex}` })));
    if (res.is_last || res.colors.length === 0) break;
    offset += res.colors.length;
    if (offset > 20_000) throw new Error('benjamin-moore: pagination did not terminate');
  }
  return assertCount('benjamin-moore', out, 3500);
}

// ---------------------------------------------------------------------------
// Behr: the color pages on behr.com (AEM Edge Delivery) are Cloudflare-gated,
// but the query index they load is not. One request returns every color,
// archived ones flagged.
// ---------------------------------------------------------------------------

async function behr(): Promise<LiveColor[]> {
  type Row = { 'color-code': string; 'color-name': string; rgbhex: string; archived: string };
  const res = await getJson<{ data: Row[]; total: number }>(
    'https://www.behr.com/colors/color-detail/query-index.json?limit=20000',
  );
  if (res.data.length < res.total) throw new Error(`behr: index returned ${res.data.length} of ${res.total} rows`);
  return assertCount(
    'behr',
    res.data.map((r) => ({
      code: r['color-code'],
      name: r['color-name'],
      hex: `#${r.rgbhex}`,
      archived: r.archived === 'true' || undefined,
    })),
    4000,
  );
}

// ---------------------------------------------------------------------------
// Hirshfield's: the color picker on hirshfields.com is a Chameleon Power
// iframe that loads static JSON. color-is-historic.json is the full retail
// book (1,320 "Color Is" + 149 Historic H-codes).
// ---------------------------------------------------------------------------

async function hirshfields(): Promise<LiveColor[]> {
  const text = await getText('https://hirshfieldscolorpicker.chameleonpower.com/data/color-is-historic.json');
  const data = JSON.parse(text.replace(/^\uFEFF/, '')) as { Master: { Sku: string; Name: string; HexaDecimal: string }[] };
  return assertCount(
    'hirshfields',
    data.Master.map((x) => ({ code: x.Sku.trim(), name: x.Name.trim(), hex: `#${x.HexaDecimal}` })),
    1200,
  );
}

// ---------------------------------------------------------------------------
// Vista Paint: colors are WooCommerce products. The Store API lists code and
// name; hex lives only in each color page's Elementor inline CSS, so this is
// ~2,900 page fetches (about 15 minutes at 8 concurrent).
// ---------------------------------------------------------------------------

const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

async function vistaPaint(): Promise<LiveColor[]> {
  type Item = { sku: string; name: string; permalink: string };
  const items: Item[] = [];
  for (let page = 1; ; page++) {
    const batch = await getJson<Item[]>(`https://www.vistapaint.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) break;
    if (page > 100) throw new Error('vista-paint: pagination did not terminate');
  }
  // Real color codes only; drops the "02xxxPF05 – name – product" and vp-* junk pages.
  const colors = items.filter((x) => /\/colors\//.test(x.permalink) && /^(\d{4}|(R|AC|OW|H|V)\d+)$/i.test(x.sku?.trim() ?? ''));
  const parsed = await pool(colors, 8, async (x): Promise<LiveColor> => {
    const html = await getText(x.permalink);
    const hex = html.match(
      /id="elementor-frontend-inline-css">[\s\S]*?elementor-motion-effects-layer\{background-color:(#[0-9a-fA-F]{6})/,
    )?.[1];
    return { code: x.sku.trim().toUpperCase(), name: decodeEntities(x.name).trim(), hex: hex ?? null };
  });
  return assertCount('vista-paint', parsed, 2400);
}

const rgbHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

/** Every <loc> in a sitemap whose path matches `pattern`. */
async function sitemapUrls(url: string, pattern: RegExp): Promise<string[]> {
  const xml = await getText(url);
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => pattern.test(u));
}

// ---------------------------------------------------------------------------
// PPG: ppgpaints.com is Webflow now (the June Algolia index is gone). The
// sitemap lists every /ppg-colors/<slug> page; each page carries name, code
// and R/G/B. Sitemap <loc>s point at mulco.ca but the paths serve on ppgpaints.com.
// ---------------------------------------------------------------------------

async function ppg(): Promise<LiveColor[]> {
  const urls = await sitemapUrls('https://www.ppgpaints.com/sitemap.xml', /\/ppg-colors\/[^/]+\/?$/);
  const pages = urls.map((u) => `https://www.ppgpaints.com${new URL(u).pathname}`);
  const parsed = await pool(pages, 8, async (url): Promise<LiveColor | null> => {
    const html = await getText(url);
    const name = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim();
    const code = html.match(/<\/h1><p[^>]*>([^<]*)<\/p>/)?.[1]?.trim();
    const rgb = html.match(/<b>R:<\/b>\s*(\d+)\s*<b>G:<\/b>\s*(\d+)\s*<b>B:<\/b>\s*(\d+)/);
    if (!name || !code) return null;
    // Metallics (MTL###) publish no R/G/B; keep them with hex null so they are filtered, not lost.
    return { code, name: decodeEntities(name), hex: rgb ? rgbHex(+rgb[1], +rgb[2], +rgb[3]) : null };
  });
  return assertCount('ppg', parsed.filter((c): c is LiveColor => c !== null), 2800);
}

// ---------------------------------------------------------------------------
// Dunn-Edwards: three WordPress color sitemaps list every color page; each
// page has the code in og:title and the swatch on the hero. The site 503s
// under load, so this runs 2 at a time with a pause (several minutes).
// ---------------------------------------------------------------------------

async function dunnEdwards(): Promise<LiveColor[]> {
  const pages: string[] = [];
  for (const sm of ['colors-sitemap.xml', 'colors-sitemap2.xml', 'colors-sitemap3.xml']) {
    pages.push(...(await sitemapUrls(`https://www.dunnedwards.com/${sm}`, /\/colors\/browser\/[^/]+\/?$/)));
  }
  const parsePage = async (url: string): Promise<LiveColor | null> => {
    const html = await getText(url);
    const name = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim();
    const code = html.match(/<meta property="og:title" content="[^"]*?\b(DE[A-Z]*\s?\d+)\s*\|/)?.[1]?.replace(/\s+/g, '');
    const hex = html.match(/color-detail-hero[^>]*style="background-color:\s*(#[0-9A-Fa-f]{6})/)?.[1]
      ?? html.match(/style="background-color:\s*(#[0-9A-Fa-f]{6})"[^>]*color-detail-hero/)?.[1];
    if (!name || !code) return null;
    return { code, name: decodeEntities(name), hex: hex ?? null };
  };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const failed: string[] = [];
  const parsed = await pool(pages, 2, async (url) => {
    await sleep(300);
    try {
      return await parsePage(url);
    } catch {
      failed.push(url);
      return null;
    }
  });
  // Second pass, one at a time with a longer pause, for pages the site shed.
  for (const url of failed.splice(0)) {
    await sleep(2000);
    try {
      parsed.push(await parsePage(url));
    } catch {
      failed.push(url);
    }
  }
  if (failed.length) throw new Error(`dunn-edwards: ${failed.length} pages still failing after retry, e.g. ${failed[0]}`);
  return assertCount('dunn-edwards', parsed.filter((c): c is LiveColor => c !== null), 2000);
}

export const SOURCES: Record<string, PaletteSource> = {
  'sherwin-williams': {
    source: 'api.sherwin-williams.com prism API',
    fetch: prism('api.sherwin-williams.com', 'sherwin', 1500),
    // Canonical form is the bare number without leading zeros: the feed writes
    // "0001" for the historic Colonial Revival line, the DB stores "1", and a
    // few DB rows still carry an "SW " prefix.
    normalizeCode: (c) => c.replace(/^SW\s*/i, '').replace(/^0+(?=\d)/, ''),
  },
  valspar: {
    source: 'api.valspar.com prism API',
    fetch: prism('api.valspar.com', 'valspar', 1000),
  },
  'dutch-boy': {
    source: 'api.dutchboy.com prism API',
    fetch: prism('api.dutchboy.com', 'dutchboy', 1000),
  },
  'farrow-ball': {
    source: 'farrow-ball.com Magento GraphQL (Paint category) + product pages',
    fetch: farrowBall,
    // DB stores F&B numbers bare: "No. 300" -> "300", "No. CB1" -> "CB1"
    normalizeCode: (c) => c.replace(/^No\.\s*/i, ''),
  },
  'benjamin-moore': {
    source: 'api.benjaminmoore.io colors API (public frontend key from the _app bundle)',
    fetch: benjaminMoore,
    // ES-* are exterior stains, out of scope for the wall-paint dataset.
    keep: (c) => !/^ES-/i.test(c.code),
  },
  behr: {
    source: 'behr.com/colors/color-detail/query-index.json',
    fetch: behr,
    // Spray-paint line (same ids the live-palette importer excludes).
    keep: (c) => !['6694', '6695', '6794', '6795'].includes(c.code) && !/\bGLOSS\b/i.test(c.name),
  },
  ppg: {
    source: 'ppgpaints.com sitemap + /ppg-colors/ pages (R/G/B on page)',
    fetch: ppg,
    // MTL metallics have no published hex; ST-/SOL- are stains, not wall paint.
    keep: (c) => !/^(MTL|ST-|SOL-)/i.test(c.code),
    // The site writes "PPG1104-2"; most DB rows store "1104-2" (the June imports kept the prefix).
    normalizeCode: (c) => c.replace(/^PPG\s*/i, ''),
  },
  'dunn-edwards': {
    source: 'dunnedwards.com colors sitemaps + color pages',
    fetch: dunnEdwards,
  },
  hirshfields: {
    source: 'hirshfieldscolorpicker.chameleonpower.com/data/color-is-historic.json',
    fetch: hirshfields,
  },
  'vista-paint': {
    source: 'vistapaint.com WooCommerce Store API + color pages (slow: ~2,900 page fetches)',
    fetch: vistaPaint,
  },
  kilz: {
    source: 'kilz.com/color via crawl4ai (Cloudflare blocks plain fetch)',
    fetch: kilz,
  },
};

/** Brands we deliberately do not scan, with the reason shown in the report. */
export const NOT_SCANNED: Record<string, string> = {
  colorhouse:
    'colorhousepaint.com now redirects to an unrelated content site and the Portland store is listed closed (2026-03); no live palette to scan. DB rows stay as they are.',
  ral: 'RAL Classic is a fixed industry standard (213 colors); it does not add colors seasonally.',
};

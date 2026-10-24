import { NEARLY_IDENTICAL_MAX } from "./closeness";
import { isColorIndexable } from "./indexing";
import { colorNumberCandidates, colorNumberQueryValues, pickColorNumberMatch, type ColorNumberRow } from "./color-number";
import { findColorMatches } from "./color-match";
import { codeRegex, isCodePrefix, normalizeSearchQuery, pgQuote, type NormalizedSearch } from "./search-query";
import { supabase } from "./supabase";
import type { Brand, Color, ColorWithBrand, CrossBrandMatchWithColor, ColorFamily } from "./types";
import { expandUndertoneFilter, UNDERTONE_CATEGORIES } from "./undertone-utils";
import { getHueBand, inHueBand, labPrefilter } from "./hue-bands";

// Egress reduction: explicitly narrow SELECTs to the fields actually rendered.
// Migration 004 + the SEO push (Apr 2026) made egress the project's #1 cost
// driver. Pulling `*` returns ~18 Color columns and ~8 Brand columns when
// pages typically use 5–13 of each. See commit 274527b for the original
// cross_brand_matches narrowing.

// Fields the ColorCard component renders (brand/family grid + search results).
const COLOR_CARD_FIELDS =
  "id, name, slug, hex, color_number";
const COLOR_CARD_FIELDS_WITH_BRAND =
  "id, name, slug, hex, color_number, brand:brand_id (id, name, slug)";

// Fields the color detail page + color-description.ts utilities consume.
// rgb_* and lab_* are used by the description generator + nearest-color logic.
const COLOR_DETAIL_FIELDS =
  "id, brand_id, name, slug, color_number, hex, rgb_r, rgb_g, rgb_b, lab_l, lab_a, lab_b_val, lrv, color_family, undertone, samplize_available, samplize_handle, availability";
const COLOR_DETAIL_FIELDS_WITH_BRAND =
  COLOR_DETAIL_FIELDS + ", brand:brand_id (id, name, slug)";

export async function getAllBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("color_count", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  // PGRST116 is "no row". Anything else (timeout, 5xx after the retry in
  // supabase.ts) throws, so ISR keeps serving the cached page instead of
  // caching a real color as a 404 for 30 days.
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getColorsByBrand(
  brandId: string,
  options?: { family?: string; undertone?: string; limit?: number; offset?: number }
): Promise<Color[]> {
  // Brand grid renders ColorCard, which uses 5 fields per color.
  let query = supabase
    .from("colors")
    .select(COLOR_CARD_FIELDS)
    .eq("brand_id", brandId)
    .order("name").order("id");

  if (options?.family) {
    query = query.eq("color_family", options.family);
  }
  if (options?.undertone) {
    const labels = expandUndertoneFilter(options.undertone);
    if (labels.length === 1) {
      query = query.eq("undertone", labels[0]);
    } else if (labels.length > 1) {
      query = query.in("undertone", labels);
    }
  }
  if (options?.offset && options?.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  } else if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Color[];
}

export async function getColorBySlug(
  brandSlug: string,
  colorSlug: string
): Promise<ColorWithBrand | null> {
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return null;

  // Color detail page consumes 13 fields; color-description.ts adds lab_a/lab_b_val.
  const { data, error } = await supabase
    .from("colors")
    .select(COLOR_DETAIL_FIELDS)
    .eq("brand_id", brand.id)
    .eq("slug", colorSlug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return { ...(data as unknown as Color), brand };
}

// Batch fetch — same return shape as N parallel getColorBySlug calls but
// uses one `.in("slug", ...)` round-trip. Used by the brand-page popular
// mini-index where N goes up to 11 (BM) per render. The order of the
// returned array matches the `colorSlugs` input order so consuming code
// can iterate predictably.
export async function getColorsBySlugList(
  brandSlug: string,
  colorSlugs: string[]
): Promise<ColorWithBrand[]> {
  if (colorSlugs.length === 0) return [];
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return [];

  const { data, error } = await supabase
    .from("colors")
    .select(COLOR_DETAIL_FIELDS)
    .eq("brand_id", brand.id)
    .in("slug", colorSlugs);

  if (error || !data) return [];

  const bySlug = new Map<string, Color>(
    (data as unknown as Color[]).map((c) => [c.slug, c]),
  );
  return colorSlugs
    .map((slug) => bySlug.get(slug))
    .filter((c): c is Color => c !== undefined)
    .map((c) => ({ ...c, brand }));
}

export interface FamilyDemandColor {
  id: string;
  name: string;
  slug: string;
  hex: string;
  color_number: string | null;
  lrv: number | null;
  brand: { id: string; name: string; slug: string };
}

// Resolves the static most-searched list in src/lib/family-demand.ts to live
// rows in one round-trip. Keeps list order, and drops any entry that has left
// the family or been archived since the list was built.
export async function getFamilyDemandColors(
  familySlug: string,
  entries: { brand: string; slug: string }[],
): Promise<FamilyDemandColor[]> {
  if (entries.length === 0) return [];
  const { data, error } = await supabase
    .from("colors")
    .select("id, name, slug, hex, color_number, lrv, color_family, brand:brand_id (id, name, slug)")
    .in("slug", [...new Set(entries.map((e) => e.slug))])
    .eq("color_family", familySlug)
    .or("is_archived.is.null,is_archived.eq.false");
  if (error || !data) return [];
  const byKey = new Map(
    (data as unknown as FamilyDemandColor[]).map((c) => [`${c.brand.slug}/${c.slug}`, c]),
  );
  return entries
    .map((e) => byKey.get(`${e.brand}/${e.slug}`))
    .filter((c): c is FamilyDemandColor => c !== undefined);
}

// Renamed or misspelled slug -> canonical slug, by the color number the slug
// carries. Candidates come from colorNumberCandidates (most specific first);
// one round trip each for color_number and alternate_numbers, then the first
// candidate that hits wins. Returns null when nothing matches.
export async function getColorSlugByNumber(
  brandSlug: string,
  requestedSlug: string
): Promise<string | null> {
  const candidates = colorNumberCandidates(requestedSlug);
  if (candidates.length === 0) return null;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return null;

  const values = colorNumberQueryValues(candidates);
  const fields = "slug, color_number, alternate_numbers";
  const [byNumber, byAlternate] = await Promise.all([
    supabase.from("colors").select(fields).eq("brand_id", brand.id).in("color_number", values),
    supabase.from("colors").select(fields).eq("brand_id", brand.id).overlaps("alternate_numbers", values),
  ]);
  if (byNumber.error) throw byNumber.error;
  if (byAlternate.error) throw byAlternate.error;

  const rows = [...(byNumber.data ?? []), ...(byAlternate.data ?? [])] as ColorNumberRow[];
  return pickColorNumberMatch(requestedSlug, candidates, rows);
}

export async function getCrossBrandMatches(
  colorId: string
): Promise<CrossBrandMatchWithColor[]> {
  // Pre-computed match data lives at /match-data/{colorId}.json, generated
  // by scripts/build-match-data.ts at build time and served by Vercel's
  // static asset CDN. We fetch over HTTP rather than fs.readFile because
  // Turbopack would otherwise bundle-trace all ~23k JSON files into every
  // serverless function importing this module, blowing past Vercel's 250
  // MB function size limit.
  //
  // Falls back to the live Supabase query when no base URL is available
  // (local dev) or when the file is missing (e.g. a color added since the
  // last build).
  const baseUrl = getMatchDataBaseUrl();
  if (baseUrl) {
    try {
      const r = await fetch(`${baseUrl}/match-data/${colorId}.json`, {
        next: { revalidate: 86400 },
      });
      if (r.ok) {
        return (await r.json()) as CrossBrandMatchWithColor[];
      }
    } catch {
      // network error — fall through to Supabase
    }
  }

  const { data, error } = await supabase
    .from("cross_brand_matches")
    .select(`
      id,
      delta_e_score,
      match_color:match_color_id (
        id,
        name,
        slug,
        hex,
        availability,
        brand:brand_id (
          name,
          slug
        )
      )
    `)
    .eq("source_color_id", colorId)
    .order("delta_e_score", { ascending: true })
    .limit(50);

  if (error) throw error;

  // PostgREST returns nested embeds with looser types; cast at the boundary.
  return (data ?? []) as unknown as CrossBrandMatchWithColor[];
}

function getMatchDataBaseUrl(): string | null {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return null;
}

// Site search (/api/search) and the match pickers (brand-scoped).
//
// normalizeSearchQuery (search-query.ts) splits the query into a brand, color
// codes, name text and a hex color. Results come back in tiers: exact code
// hits (color_number or alternate_numbers), the hex color (exact, else the
// nearest paints), then names that equal, start with or contain the query,
// then partial codes. Prefix and contains tiers are alphabetical, as the match
// pickers sorted before. A query that names a brand is filtered to it, and runs
// again without the brand when that finds nothing.
const SEARCH_FIELDS = "id, name, slug, hex, color_number, brand:brand_id!inner (id, name, slug)";

export interface SearchResponse {
  results: ColorWithBrand[];
  // The brand the query named, so the page can link to it.
  brand: { slug: string; name: string } | null;
}

function searchBase(brandSlug: string | null) {
  const q = supabase.from("colors").select(SEARCH_FIELDS);
  return brandSlug ? q.eq("brand.slug", brandSlug) : q;
}

async function searchRows(
  brandSlug: string | null,
  limit: number,
  apply: (q: ReturnType<typeof searchBase>) => ReturnType<typeof searchBase>,
): Promise<ColorWithBrand[]> {
  const { data, error } = await apply(searchBase(brandSlug)).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ColorWithBrand[];
}

function likeToRegExp(pattern: string): RegExp {
  const body = pattern
    .split("")
    .map((ch) => (ch === "_" ? "." : ch === "%" ? ".*" : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("");
  return new RegExp(body, "i");
}

async function nearestAsResults(hex: string, brandSlug: string | null, limit: number): Promise<ColorWithBrand[]> {
  const matches = await findColorMatches(hex, brandSlug, Math.min(limit, 24), false);
  return matches.map(
    (m) =>
      ({
        id: m.id,
        name: m.name,
        slug: m.colorSlug,
        hex: m.hex,
        color_number: m.colorNumber,
        brand: { id: "", name: m.brandName, slug: m.brandSlug },
      }) as unknown as ColorWithBrand,
  );
}

async function undertoneSearch(text: string, limit: number): Promise<ColorWithBrand[] | null> {
  // "warm gray", "cool white", "neutral beige"
  const undertoneKeywords: Record<string, string[]> = {
    warm: UNDERTONE_CATEGORIES.warm,
    cool: UNDERTONE_CATEGORIES.cool,
    neutral: UNDERTONE_CATEGORIES.neutral,
  };
  for (const [keyword, labels] of Object.entries(undertoneKeywords)) {
    if (!text.startsWith(keyword + " ")) continue;
    const colorPart = text.slice(keyword.length + 1).trim().replace(/\bgrey\b/g, "gray");
    if (!colorPart) continue;
    const { data, error } = await supabase
      .from("colors")
      .select(COLOR_CARD_FIELDS_WITH_BRAND)
      .in("undertone", labels)
      .eq("color_family", colorPart)
      .limit(limit);
    if (!error && data && data.length > 0) return data as unknown as ColorWithBrand[];
    const { data: nameData, error: nameError } = await supabase
      .from("colors")
      .select(COLOR_CARD_FIELDS_WITH_BRAND)
      .in("undertone", labels)
      .ilike("name", `%${colorPart.replace(/\bgr[ae]y/g, "gr_y")}%`)
      .limit(limit);
    if (!nameError && nameData && nameData.length > 0) return nameData as unknown as ColorWithBrand[];
  }
  return null;
}

async function runSearch(n: NormalizedSearch, brandSlug: string | null, limit: number): Promise<ColorWithBrand[]> {
  const terms = n.nameTerms;
  const none = Promise.resolve([] as ColorWithBrand[]);
  const codeOr = [
    ...n.codes.map((k) => `color_number.imatch.${pgQuote(codeRegex(k, true))}`),
    ...(n.codeValues.length ? [`alternate_numbers.ov.{${n.codeValues.join(",")}}`] : []),
  ].join(",");
  const containsOr = [
    ...terms.map((t) => `name.ilike.${pgQuote(`%${t}%`)}`),
    // Partial codes typed without a digit yet ("pm-", "hc").
    ...(n.name && n.name.length <= 4 && !n.name.includes(" ")
      ? [`color_number.ilike.${pgQuote(`%${n.name}%`)}`]
      : []),
    // A lone number may be part of a name ("100 Mph").
    ...(!n.name && n.codes.length === 1 && /^[A-Z0-9]+$/.test(n.codes[0])
      ? [`name.ilike.${pgQuote(`%${n.codes[0].toLowerCase()}%`)}`]
      : []),
  ].join(",");

  const typingCode = !!n.name && isCodePrefix(n.name);
  const [codeExact, hexExact, nameExact, codePrefix, namePrefix, nameContains, codePartial] = await Promise.all([
    codeOr ? searchRows(brandSlug, limit, (q) => q.or(codeOr)) : none,
    n.hex ? searchRows(brandSlug, limit, (q) => q.ilike("hex", n.hex as string)) : none,
    terms.length ? searchRows(brandSlug, limit, (q) => q.or(terms.map((t) => `name.ilike.${pgQuote(t)}`).join(","))) : none,
    typingCode ? searchRows(brandSlug, limit, (q) => q.ilike("color_number", `${n.name}%`).order("color_number")) : none,
    terms.length ? searchRows(brandSlug, limit, (q) => q.or(terms.map((t) => `name.ilike.${pgQuote(`${t}%`)}`).join(",")).order("name")) : none,
    containsOr ? searchRows(brandSlug, limit, (q) => q.or(containsOr).order("name")) : none,
    n.codes.length
      ? searchRows(brandSlug, limit, (q) => q.or(n.codes.map((k) => `color_number.imatch.${pgQuote(codeRegex(k, false))}`).join(",")))
      : none,
  ]);

  // Name plus code ("october mist 1495"): both must match. When nothing
  // satisfies both, the number was likely misremembered, so an exact name
  // leads and the code hits follow it.
  let tiers = [codeExact, nameExact];
  if (terms.length && codeExact.length) {
    const res = terms.map(likeToRegExp);
    const both = codeExact.filter((c) => res.some((re) => re.test(c.name)));
    tiers = both.length ? [both, nameExact] : [nameExact, codeExact];
  }
  // A hex with no exact paint falls back to the nearest paints, unless the
  // same token was an exact color code (Dunn-Edwards DEFD39).
  let hexHits = hexExact;
  if (n.hex && hexHits.length === 0 && codeExact.length === 0) {
    hexHits = await nearestAsResults(n.hex, brandSlug, limit);
  }

  const seen = new Set<string>();
  const out: ColorWithBrand[] = [];
  for (const tier of [tiers[0], hexHits, tiers[1], codePrefix, namePrefix, nameContains, codePartial]) {
    for (const c of tier) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
  }
  return out.slice(0, limit);
}

// Name or number search inside one brand, for the match pickers. The general
// search caps at 50 rows across all brands, so filtering its results to one
// brand afterwards often left nothing for common words like "white".
export async function searchColorsInBrand(
  query: string,
  brandSlug: string,
  limit = 20
): Promise<ColorWithBrand[]> {
  const n = normalizeSearchQuery(query);
  if (!n.name && n.codes.length === 0 && !n.hex) return [];
  return runSearch(n, brandSlug, limit);
}

export async function searchColorsDetailed(query: string, limit = 50): Promise<SearchResponse> {
  const n = normalizeSearchQuery(query);
  const hasTerms = !!n.name || n.codes.length > 0 || !!n.hex;

  // A brand alone ("behr", "sherwin williams") returns that brand.
  if (!hasTerms) {
    if (!n.brandSlug) return { results: [], brand: null };
    const brand = await getBrandBySlug(n.brandSlug);
    if (!brand) return { results: [], brand: null };
    const results = await searchRows(n.brandSlug, limit, (q) => q.order("name"));
    return { results, brand: { slug: brand.slug, name: brand.name } };
  }

  if (!n.brandSlug && n.codes.length === 0 && !n.hex) {
    const undertone = await undertoneSearch(n.text, limit);
    if (undertone) return { results: undertone, brand: null };
  }

  let results = await runSearch(n, n.brandSlug, limit);
  let brand: SearchResponse["brand"] = null;
  if (n.brandSlug) {
    if (results.length === 0) {
      results = await runSearch(n, null, limit);
    } else {
      const b = results.find((c) => c.brand.slug === n.brandSlug)?.brand;
      if (b) brand = { slug: b.slug, name: b.name };
    }
  }
  return { results, brand };
}

export async function searchColors(query: string, limit = 50): Promise<ColorWithBrand[]> {
  return (await searchColorsDetailed(query, limit)).results;
}

// Match colors where the LAB-based classifier assigned this family OR the
// color name contains the family slug as a standalone word. Catches
// name-driven blues like "Sleepy Blue" or "Cornflower Blue" that the
// classifier puts into adjacent families (neutral, gray) based on hex values.
//
// The name match uses POSIX word-boundary regex (\m, \M) rather than a raw
// substring. Substring matching was producing false positives at scale:
// `name ILIKE '%red%'` was pulling "Tired Rose" and "Spread the Word" into
// /family/red; `%tan%` was matching "Tangerine". Word boundaries fix this
// while still catching multi-word names like "Light Tan" or "Powder Blue".
function familyMatchFilter(familySlug: string): string {
  return `color_family.eq.${familySlug},name.imatch.\\m${familySlug}\\M`;
}

export async function getColorsByFamily(
  familySlug: string,
  options?: { brandSlug?: string; undertone?: string; limit?: number; offset?: number }
): Promise<ColorWithBrand[]> {
  // Family grid renders ColorCard.
  let query = supabase
    .from("colors")
    .select(COLOR_CARD_FIELDS_WITH_BRAND)
    .or(familyMatchFilter(familySlug))
    .order("name").order("id");

  if (options?.brandSlug) {
    const brand = await getBrandBySlug(options.brandSlug);
    if (brand) {
      query = query.eq("brand_id", brand.id);
    }
  }
  if (options?.undertone) {
    const labels = expandUndertoneFilter(options.undertone);
    if (labels.length === 1) {
      query = query.eq("undertone", labels[0]);
    } else if (labels.length > 1) {
      query = query.in("undertone", labels);
    }
  }
  if (options?.offset && options?.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  } else if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ColorWithBrand[];
}

export async function getColorsByFamilyCount(
  familySlug: string,
  options?: { brandSlug?: string; undertone?: string }
): Promise<number> {
  let query = supabase
    .from("colors")
    .select("id", { count: "exact", head: true })
    .or(familyMatchFilter(familySlug));

  if (options?.brandSlug) {
    const brand = await getBrandBySlug(options.brandSlug);
    if (brand) {
      query = query.eq("brand_id", brand.id);
    }
  }
  if (options?.undertone) {
    const labels = expandUndertoneFilter(options.undertone);
    if (labels.length === 1) {
      query = query.eq("undertone", labels[0]);
    } else if (labels.length > 1) {
      query = query.in("undertone", labels);
    }
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getColorsByBrandCount(
  brandId: string,
  options?: { family?: string; undertone?: string }
): Promise<number> {
  let query = supabase
    .from("colors")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId);

  if (options?.family) {
    query = query.eq("color_family", options.family);
  }
  if (options?.undertone) {
    const labels = expandUndertoneFilter(options.undertone);
    if (labels.length === 1) {
      query = query.eq("undertone", labels[0]);
    } else if (labels.length > 1) {
      query = query.in("undertone", labels);
    }
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getAllColorFamilies(): Promise<ColorFamily[]> {
  const { data, error } = await supabase
    .from("color_families")
    .select("*")
    .order("display_order");

  if (error) throw error;
  return data ?? [];
}

export async function getColorById(id: string): Promise<ColorWithBrand | null> {
  const { data, error } = await supabase
    .from("colors")
    .select(COLOR_DETAIL_FIELDS_WITH_BRAND)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as ColorWithBrand;
}

// Module-level cache for unbrand-filtered findClosestColor results. The
// resolveHarmonies path on every color page kicks off up to ~10 sequential
// findClosestColor lookups per cold render — caching the no-brand-filter
// case collapses these to Map lookups on warm serverless instances.
// Color data is effectively immutable between deploys, so a stale entry
// can only mismatch if a new brand import lands between cache miss and
// the next deploy — acceptable for the cosmetic "closest color" use case.
// Bounded at 5k entries with simple FIFO eviction to cap memory.
const findClosestColorCache = new Map<string, ColorWithBrand | null>();
const FIND_CLOSEST_CACHE_MAX = 5000;

export async function findClosestColor(hex: string, brandId?: string): Promise<ColorWithBrand | null> {
  if (!brandId) {
    const cached = findClosestColorCache.get(hex);
    if (cached !== undefined) return cached;
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Narrow candidates by approximate RGB range, then pick closest
  const range = 30;
  let query = supabase
    .from("colors")
    .select(COLOR_DETAIL_FIELDS_WITH_BRAND)
    .gte("rgb_r", Math.max(0, r - range))
    .lte("rgb_r", Math.min(255, r + range))
    .gte("rgb_g", Math.max(0, g - range))
    .lte("rgb_g", Math.min(255, g + range))
    .gte("rgb_b", Math.max(0, b - range))
    .lte("rgb_b", Math.min(255, b + range));
  if (brandId) query = query.eq("brand_id", brandId);
  const { data, error } = await query.limit(200);

  if (error) throw error;

  let candidates = (data ?? []) as unknown as ColorWithBrand[];

  // If no candidates in tight range, widen
  if (candidates.length === 0) {
    const wide = 60;
    let wideQuery = supabase
      .from("colors")
      .select(COLOR_DETAIL_FIELDS_WITH_BRAND)
      .gte("rgb_r", Math.max(0, r - wide))
      .lte("rgb_r", Math.min(255, r + wide))
      .gte("rgb_g", Math.max(0, g - wide))
      .lte("rgb_g", Math.min(255, g + wide))
      .gte("rgb_b", Math.max(0, b - wide))
      .lte("rgb_b", Math.min(255, b + wide));
    if (brandId) wideQuery = wideQuery.eq("brand_id", brandId);
    const { data: wideData } = await wideQuery.limit(200);
    candidates = (wideData ?? []) as unknown as ColorWithBrand[];
  }

  if (candidates.length === 0) {
    if (!brandId) findClosestColorCache.set(hex, null);
    return null;
  }

  let best = candidates[0];
  let bestDist = Infinity;
  for (const c of candidates) {
    const dr = c.rgb_r - r;
    const dg = c.rgb_g - g;
    const db = c.rgb_b - b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }

  if (!brandId) {
    if (findClosestColorCache.size >= FIND_CLOSEST_CACHE_MAX) {
      const firstKey = findClosestColorCache.keys().next().value;
      if (firstKey !== undefined) findClosestColorCache.delete(firstKey);
    }
    findClosestColorCache.set(hex, best);
  }

  return best;
}

export async function getSimilarColorsFromSameBrand(
  color: { id: string; hex: string; brand_id: string },
  limit = 6
): Promise<Color[]> {
  const r = parseInt(color.hex.slice(1, 3), 16);
  const g = parseInt(color.hex.slice(3, 5), 16);
  const b = parseInt(color.hex.slice(5, 7), 16);

  const range = 25;
  // Similar-colors carousel needs id, name, slug, hex, color_number for the card,
  // plus rgb_* for the distance sort below.
  const { data, error } = await supabase
    .from("colors")
    .select("id, name, slug, hex, color_number, rgb_r, rgb_g, rgb_b")
    .eq("brand_id", color.brand_id)
    .neq("id", color.id)
    .gte("rgb_r", Math.max(0, r - range))
    .lte("rgb_r", Math.min(255, r + range))
    .gte("rgb_g", Math.max(0, g - range))
    .lte("rgb_g", Math.min(255, g + range))
    .gte("rgb_b", Math.max(0, b - range))
    .lte("rgb_b", Math.min(255, b + range))
    .limit(50);

  if (error) throw error;

  const candidates = data ?? [];
  // Sort by Euclidean distance and return top N. Cast at boundary —
  // the narrowed SELECT returns a subset of Color, sufficient for the
  // similar-colors carousel which only renders ColorCard fields.
  return candidates
    .map((c) => {
      const dr = c.rgb_r - r;
      const dg = c.rgb_g - g;
      const db = c.rgb_b - b;
      return { ...c, dist: dr * dr + dg * dg + db * db };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit) as unknown as Color[];
}

// Returns colors from the same color_family but a different brand, with a
// deterministic offset based on the source color id so every long-tail
// color page surfaces a different 6-color subset. This is the cross-color
// link distribution fix from the H2 internal-link audit: long-tail colors
// only get 3-6 incoming links today (RGB neighbors via similar-from-same-
// brand); this carousel adds ~6 cross-brand HTML anchors per page, pulling
// equity from the popular pre-rendered 47 into the rest of the 23k corpus.
export async function getMoreFromFamily(
  color: { id: string; color_family: string | null; brand_id: string },
  limit = 6,
  poolSize = 60
): Promise<ColorWithBrand[]> {
  if (!color.color_family) return [];

  const { data, error } = await supabase
    .from("colors")
    .select(COLOR_CARD_FIELDS_WITH_BRAND)
    .eq("color_family", color.color_family)
    .neq("brand_id", color.brand_id)
    .neq("id", color.id)
    .order("id")
    .limit(poolSize);

  if (error) throw error;
  const pool = (data ?? []) as unknown as ColorWithBrand[];
  if (pool.length <= limit) return pool;

  // Hash the source id to a stable offset. Same source color always returns
  // the same 6 candidates, but adjacent source colors return overlapping-but-
  // different subsets — spreads incoming links across the family pool.
  let hash = 0;
  for (let i = 0; i < color.id.length; i++) {
    hash = ((hash << 5) - hash + color.id.charCodeAt(i)) | 0;
  }
  const start = Math.abs(hash) % Math.max(1, pool.length - limit);
  return pool.slice(start, start + limit);
}

// Brand-to-brand charts (/match/[a]/to/[b]). compute-matches stores the five
// closest target-brand colors for each source color (ranks 1 to 5), retired
// colors included. A switching chart lists colors buyers can order, so each
// source color's pair is its closest current target among those five, and the
// chart and the FAQ count read that one population. Keeping only rank 1
// dropped every source whose closest target is retired: Behr has 2,547 retired
// colors that are still match targets, so BM to Behr counted 1,829 nearly
// identical colors where 2,590 qualify (2026-10-24).
//
// The version before that took the top 50 rank-1 rows across every target
// brand in each batch and filtered to the target afterward, and its color
// read stopped at 1,000 rows: SW to F&B came back empty and SW to BM showed
// 5 rows. Now the target brand is filtered in SQL (!inner embed).
//
// Why batches and not one query: PostgREST wraps every embed in a LATERAL
// subquery with LIMIT/OFFSET, which Postgres cannot flatten into a join. With
// both brands filtered only through embeds, it ran the embed lookups for every
// rank-1 row in the table and hit the 3 s anon statement timeout on the
// 2026-10-24 preview build (the same SQL as a plain join takes 45 ms). So the
// source brand goes on the base table: page its current colors, then query
// 150 ids at a time (.in() rides in the URL), about 40 ms per batch.
//
// Errors throw: a blip fails the render instead of caching an empty chart for
// 30 days.
const BRAND_PAIR_COLOR_FIELDS =
  "id, name, slug, hex, color_number, availability, brand_id, brand:brand_id (id, name, slug)";
// 150 ids x 5 stored rows = 750 rows, under PostgREST's 1,000-row response cap.
const BRAND_PAIR_BATCH = 150;
const POSTGREST_MAX_ROWS = 1000;

export interface BrandPairChart {
  matches: { source: ColorWithBrand; match: ColorWithBrand; deltaE: number }[];
  // Current source colors whose closest current target is nearly identical.
  closeCount: number;
  // False when some source's five stored targets are all retired and all
  // nearly identical. A current color past rank 5 could still qualify, so
  // closeCount is then a floor.
  closeCountExact: boolean;
}

function brandPairError(what: string, error: { message: string }, status: number): Error {
  // HEAD responses carry no body, so PostgREST errors arrive with an empty message.
  return new Error(`${what} failed (HTTP ${status}): ${error.message || "no response body"}`);
}

async function getCurrentColors(brandId: string): Promise<{ id: string; name: string }[]> {
  const colors: { id: string; name: string }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error, status } = await supabase
      .from("colors")
      .select("id, name")
      .eq("brand_id", brandId)
      .eq("availability", "current")
      .order("id") // unordered pagination drops/repeats rows
      .range(from, from + PAGE - 1);
    if (error) throw brandPairError(`Current colors for brand ${brandId}`, error, status);
    colors.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return colors;
}

export async function getBrandPairChart(
  sourceBrandId: string,
  targetBrandId: string,
  limit = 50
): Promise<BrandPairChart> {
  const sources = await getCurrentColors(sourceBrandId);
  const sourceName = new Map(sources.map((c) => [c.id, c.name]));
  const pairs: { sourceId: string; matchId: string; deltaE: number }[] = [];
  let closeCount = 0;
  let closeCountExact = true;

  for (let i = 0; i < sources.length; i += BRAND_PAIR_BATCH) {
    const batch = sources.slice(i, i + BRAND_PAIR_BATCH).map((c) => c.id);
    const { data, error, status } = await supabase
      .from("cross_brand_matches")
      .select("source_color_id, match_color_id, delta_e_score, match_color:match_color_id!inner (availability)")
      .in("source_color_id", batch)
      .eq("match_color.brand_id", targetBrandId)
      .order("source_color_id")
      .order("rank");
    if (error) throw brandPairError(`Brand pair rows ${sourceBrandId} to ${targetBrandId}`, error, status);
    if ((data ?? []).length >= POSTGREST_MAX_ROWS) {
      throw new Error(`Brand pair rows ${sourceBrandId} to ${targetBrandId} hit the ${POSTGREST_MAX_ROWS}-row cap; lower BRAND_PAIR_BATCH`);
    }

    // PostgREST returns nested embeds with looser types; cast at the boundary.
    const rows = (data ?? []) as unknown as {
      source_color_id: string;
      match_color_id: string;
      delta_e_score: number | string;
      match_color: { availability: string };
    }[];
    const bySource = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = bySource.get(row.source_color_id);
      if (list) list.push(row);
      else bySource.set(row.source_color_id, [row]);
    }
    for (const [sourceId, list] of bySource) {
      // Ordered by rank, so the first current row is the closest current color.
      const best = list.find((row) => row.match_color.availability === "current");
      if (best) {
        const deltaE = Number(best.delta_e_score);
        pairs.push({ sourceId, matchId: best.match_color_id, deltaE });
        if (deltaE < NEARLY_IDENTICAL_MAX) closeCount++;
      } else if (list.every((row) => Number(row.delta_e_score) < NEARLY_IDENTICAL_MAX)) {
        closeCountExact = false;
      }
    }
  }

  // Closest first, then source name, then id, so ties resolve the same way on
  // every build.
  pairs.sort((a, b) =>
    a.deltaE - b.deltaE ||
    (sourceName.get(a.sourceId) ?? "").localeCompare(sourceName.get(b.sourceId) ?? "") ||
    a.sourceId.localeCompare(b.sourceId)
  );
  const top = pairs.slice(0, limit);
  if (top.length === 0) return { matches: [], closeCount, closeCountExact };

  // Full color rows only for the pairs on the chart: at most 2 x limit ids.
  const ids = [...new Set(top.flatMap((p) => [p.sourceId, p.matchId]))];
  const { data, error, status } = await supabase
    .from("colors")
    .select(BRAND_PAIR_COLOR_FIELDS)
    .in("id", ids);
  if (error) throw brandPairError(`Brand pair colors ${sourceBrandId} to ${targetBrandId}`, error, status);
  const byId = new Map(((data ?? []) as unknown as ColorWithBrand[]).map((c) => [c.id, c]));
  const matches = top.map((p) => {
    const source = byId.get(p.sourceId);
    const match = byId.get(p.matchId);
    if (!source || !match) {
      throw new Error(`Brand pair colors ${sourceBrandId} to ${targetBrandId} missing ${source ? p.matchId : p.sourceId}`);
    }
    return { source, match, deltaE: p.deltaE };
  });
  return { matches, closeCount, closeCountExact };
}

// Keyset pagination avoids overlapping ranges; shared eligibility preserves
// the existing metadata policy. A build snapshot keeps all shards consistent.
export async function getAllColorSlugs(options?: { perBrand?: number; brandSlugs?: string[] }): Promise<{ brandSlug: string; colorSlug: string; createdAt: string; contentUpdatedAt: string }[]> {
  const results = new Map<string, { brandSlug: string; colorSlug: string; createdAt: string; contentUpdatedAt: string }>();
  const counts = new Map<string, number>();
  let after: string | undefined;
  while (true) {
    let query = supabase.from("colors")
      .select("id, slug, name, color_number, lrv, undertone, color_family, created_at, content_updated_at, brand:brand_id (slug)")
      .order("id", { ascending: true }).limit(1000);
    if (after) query = query.gt("id", after);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) break;
    for (const color of data) {
      const brand = color.brand as unknown as { slug: string } | null;
      if (!brand || !isColorIndexable(color)) continue;
      if (options?.brandSlugs && !options.brandSlugs.includes(brand.slug)) continue;
      if (options?.perBrand && (counts.get(brand.slug) ?? 0) >= options.perBrand) continue;
      const key = `${brand.slug}/${color.slug}`;
      if (results.has(key)) throw new Error(`Duplicate catalog URL: ${key}`);
      results.set(key, { brandSlug: brand.slug, colorSlug: color.slug, createdAt: color.created_at, contentUpdatedAt: color.content_updated_at });
      counts.set(brand.slug, (counts.get(brand.slug) ?? 0) + 1);
    }
    const next = data[data.length - 1].id as string;
    if (next === after) throw new Error("Color pagination did not advance");
    after = next;
  }
  return [...results.values()].sort((a, b) => `${a.brandSlug}/${a.colorSlug}`.localeCompare(`${b.brandSlug}/${b.colorSlug}`, "en"));
}

// Latest color insertion date per brand (slug → ISO date YYYY-MM-DD). Used
// for brand-page sitemap lastmod so each brand emits a real "latest activity"
// signal instead of all 13 brand URLs sharing the same build date.
// Paginates through the colors table because Supabase caps single-request
// returns at 1000 rows by default and the table has 23k+ rows.
export async function getLatestColorDateByBrand(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const batchSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("colors")
      .select("created_at, brand:brand_id (slug)")
      .range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) {
      const brandSlug = (row.brand as unknown as { slug: string }).slug;
      const date = row.created_at.split("T")[0];
      const existing = map.get(brandSlug);
      if (!existing || date > existing) map.set(brandSlug, date);
    }
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  return map;
}

// Latest color insertion date per color family (family slug → ISO date).
// Same purpose as getLatestColorDateByBrand but keyed on color_family.
export async function getLatestColorDateByFamily(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const batchSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("colors")
      .select("created_at, color_family")
      .not("color_family", "is", null)
      .range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (!row.color_family) continue;
      const date = row.created_at.split("T")[0];
      const existing = map.get(row.color_family);
      if (!existing || date > existing) map.set(row.color_family, date);
    }
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Hue-band collections (blue gray, blue green, rust). Membership is computed
// from stored LAB values; see src/lib/hue-bands.ts for the ranges. PostgREST
// cannot filter on hue/chroma, so the read is narrowed with an a/b rectangle
// and the exact test runs here. Callers should cache the result (the page
// wraps this in unstable_cache).
// ---------------------------------------------------------------------------
export interface HueBandColor {
  id: string;
  name: string;
  slug: string;
  hex: string;
  color_number: string | null;
  brand: { id: string; name: string; slug: string };
}

export async function getHueBandColors(bandSlug: string): Promise<HueBandColor[]> {
  const band = getHueBand(bandSlug);
  if (!band) return [];
  const f = labPrefilter(band);
  const rows: HueBandColor[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("colors")
      .select("id, name, slug, hex, color_number, lab_l, lab_a, lab_b_val, brand:brand_id (id, name, slug)")
      .or("is_archived.is.null,is_archived.eq.false")
      .gte("lab_l", f.lMin).lte("lab_l", f.lMax)
      .gte("lab_a", f.aMin).lte("lab_a", f.aMax)
      .gte("lab_b_val", f.bMin).lte("lab_b_val", f.bMax)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of (data ?? []) as unknown as Array<HueBandColor & { lab_l: number; lab_a: number; lab_b_val: number }>) {
      const lab = { l: Number(r.lab_l), a: Number(r.lab_a), b: Number(r.lab_b_val) };
      if (!inHueBand(band, lab)) continue;
      rows.push({ id: r.id, name: r.name, slug: r.slug, hex: r.hex, color_number: r.color_number, brand: r.brand });
    }
    if (!data || data.length < PAGE) break;
  }
  return rows.sort((x, y) => x.name.localeCompare(y.name) || x.id.localeCompare(y.id));
}

import { supabase } from "./supabase";
import type { Brand, Color, ColorWithBrand, CrossBrandMatchWithColor, ColorFamily } from "./types";
import { expandUndertoneFilter, UNDERTONE_CATEGORIES } from "./undertone-utils";

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

  if (error) return null;
  return data;
}

export async function getColorsByBrand(
  brandId: string,
  options?: { family?: string; undertone?: string; limit?: number; offset?: number }
): Promise<Color[]> {
  let query = supabase
    .from("colors")
    .select("*")
    .eq("brand_id", brandId)
    .order("name");

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
  return data ?? [];
}

export async function getColorBySlug(
  brandSlug: string,
  colorSlug: string
): Promise<ColorWithBrand | null> {
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return null;

  const { data, error } = await supabase
    .from("colors")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("slug", colorSlug)
    .single();

  if (error) return null;
  return { ...data, brand };
}

export async function getColorSlugByNumber(
  brandSlug: string,
  colorNumber: string
): Promise<string | null> {
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return null;

  const { data, error } = await supabase
    .from("colors")
    .select("slug")
    .eq("brand_id", brand.id)
    .eq("color_number", colorNumber)
    .single();

  if (error || !data) return null;
  return data.slug;
}

export async function getCrossBrandMatches(
  colorId: string
): Promise<CrossBrandMatchWithColor[]> {
  const { data, error } = await supabase
    .from("cross_brand_matches")
    .select(`
      *,
      match_color:match_color_id (
        *,
        brand:brand_id (*)
      )
    `)
    .eq("source_color_id", colorId)
    .order("delta_e_score", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((match) => ({
    ...match,
    match_color: {
      ...match.match_color,
      brand: match.match_color.brand,
    },
  })) as CrossBrandMatchWithColor[];
}

export async function searchColors(
  query: string,
  limit = 50
): Promise<ColorWithBrand[]> {
  // Try exact hex match first
  if (query.match(/^#?[0-9a-fA-F]{6}$/)) {
    const hex = query.startsWith("#") ? query : `#${query}`;
    const { data } = await supabase
      .from("colors")
      .select("*, brand:brand_id (*)")
      .ilike("hex", hex)
      .limit(limit);

    if (data && data.length > 0) {
      return data as unknown as ColorWithBrand[];
    }
  }

  // Check for undertone keywords: "warm gray", "cool white", "neutral beige"
  const lower = query.toLowerCase().trim();
  const undertoneKeywords: Record<string, string[]> = {
    warm: UNDERTONE_CATEGORIES.warm,
    cool: UNDERTONE_CATEGORIES.cool,
    neutral: UNDERTONE_CATEGORIES.neutral,
  };

  for (const [keyword, labels] of Object.entries(undertoneKeywords)) {
    if (lower.startsWith(keyword + " ")) {
      const colorPart = lower.slice(keyword.length + 1).trim();
      if (colorPart) {
        let q = supabase
          .from("colors")
          .select("*, brand:brand_id (*)")
          .in("undertone", labels);

        // Try matching as color_family first
        q = q.eq("color_family", colorPart);

        const { data, error } = await q.limit(limit);
        if (!error && data && data.length > 0) {
          return data as unknown as ColorWithBrand[];
        }

        // Fall back to name search with undertone filter
        const { data: nameData, error: nameError } = await supabase
          .from("colors")
          .select("*, brand:brand_id (*)")
          .in("undertone", labels)
          .ilike("name", `%${colorPart}%`)
          .limit(limit);

        if (!nameError && nameData && nameData.length > 0) {
          return nameData as unknown as ColorWithBrand[];
        }
      }
    }
  }

  // Full-text search on name
  const { data, error } = await supabase
    .from("colors")
    .select("*, brand:brand_id (*)")
    .or(`name.ilike.%${query}%,color_number.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as ColorWithBrand[];
}

export async function getColorsByFamily(
  familySlug: string,
  options?: { brandSlug?: string; undertone?: string; limit?: number; offset?: number }
): Promise<ColorWithBrand[]> {
  let query = supabase
    .from("colors")
    .select("*, brand:brand_id (*)")
    .eq("color_family", familySlug)
    .order("name");

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
    .eq("color_family", familySlug);

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
    .select("*, brand:brand_id (*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as ColorWithBrand;
}

export async function findClosestColor(hex: string, brandId?: string): Promise<ColorWithBrand | null> {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Narrow candidates by approximate RGB range, then pick closest
  const range = 30;
  let query = supabase
    .from("colors")
    .select("*, brand:brand_id (*)")
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
      .select("*, brand:brand_id (*)")
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

  if (candidates.length === 0) return null;

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
  const { data, error } = await supabase
    .from("colors")
    .select("*")
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
  // Sort by Euclidean distance and return top N
  return candidates
    .map((c) => {
      const dr = c.rgb_r - r;
      const dg = c.rgb_g - g;
      const db = c.rgb_b - b;
      return { ...c, dist: dr * dr + dg * dg + db * db };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit);
}

export async function getGuideColors(options: {
  lrvMin?: number;
  lrvMax?: number;
  undertones?: string[];
  colorFamilies?: string[];
  brandSlugs?: string[];
  limit?: number;
}): Promise<ColorWithBrand[]> {
  const { lrvMin, lrvMax, undertones, colorFamilies, brandSlugs, limit = 20 } = options;

  let query = supabase
    .from("colors")
    .select("*, brand:brand_id (*)")
    .eq("is_discontinued", false);

  if (lrvMin != null) query = query.gte("lrv", lrvMin);
  if (lrvMax != null) query = query.lte("lrv", lrvMax);
  if (undertones && undertones.length > 0) query = query.in("undertone", undertones);
  if (colorFamilies && colorFamilies.length > 0) query = query.in("color_family", colorFamilies);

  query = query.order("lrv", { ascending: false }).limit(limit * 5);

  const { data, error } = await query;
  if (error || !data) return [];

  let results = data as unknown as ColorWithBrand[];

  if (brandSlugs && brandSlugs.length > 0) {
    results = results.filter((c) => brandSlugs.includes(c.brand.slug));
  }

  // Deduplicate by picking one per brand per color family for variety
  const seen = new Map<string, number>();
  const diverse: ColorWithBrand[] = [];
  for (const color of results) {
    const key = `${color.brand.slug}-${color.color_family}`;
    const count = seen.get(key) ?? 0;
    if (count < 2) {
      diverse.push(color);
      seen.set(key, count + 1);
      if (diverse.length >= limit) break;
    }
  }

  return diverse;
}

export async function getTopCrossBrandMatches(
  sourceBrandSlug: string,
  targetBrandSlug: string,
  limit = 50
): Promise<{
  source: ColorWithBrand;
  match: ColorWithBrand;
  deltaE: number;
}[]> {
  const [sourceBrand, targetBrand] = await Promise.all([
    getBrandBySlug(sourceBrandSlug),
    getBrandBySlug(targetBrandSlug),
  ]);

  if (!sourceBrand || !targetBrand) return [];

  // Step 1: Get source brand color IDs
  const { data: sourceColors, error: srcErr } = await supabase
    .from("colors")
    .select("id")
    .eq("brand_id", sourceBrand.id);

  if (srcErr || !sourceColors || sourceColors.length === 0) return [];

  const sourceColorIds = sourceColors.map((c) => c.id);

  // Step 2: Query cross_brand_matches for these source colors, joining both colors
  // Supabase .in() has a URL length limit, so batch if needed
  const batchSize = 200;
  const allMatches: {
    source: ColorWithBrand;
    match: ColorWithBrand;
    deltaE: number;
  }[] = [];

  for (let i = 0; i < sourceColorIds.length; i += batchSize) {
    const batch = sourceColorIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from("cross_brand_matches")
      .select(`
        delta_e_score,
        rank,
        source_color:source_color_id (*, brand:brand_id (*)),
        match_color:match_color_id (*, brand:brand_id (*))
      `)
      .in("source_color_id", batch)
      .eq("rank", 1)
      .order("delta_e_score", { ascending: true })
      .limit(limit);

    if (error || !data) continue;

    for (const row of data) {
      const matchColor = row.match_color as unknown as ColorWithBrand;
      const sourceColor = row.source_color as unknown as ColorWithBrand;
      if (!matchColor?.brand || !sourceColor?.brand) continue;
      if (matchColor.brand.id !== targetBrand.id) continue;

      allMatches.push({
        source: sourceColor,
        match: matchColor,
        deltaE: Number(row.delta_e_score),
      });
    }
  }

  // Sort by deltaE and return top N
  allMatches.sort((a, b) => a.deltaE - b.deltaE);
  return allMatches.slice(0, limit);
}

// Paginated fetch for sitemaps - handles Supabase 1000-row limit
export async function getAllColorSlugs(options?: {
  perBrand?: number;
  brandSlugs?: string[];
}): Promise<{ brandSlug: string; colorSlug: string }[]> {
  const perBrand = options?.perBrand;
  const brandSlugs = options?.brandSlugs;

  if (perBrand || brandSlugs) {
    // Fetch limited/filtered colors per brand for sitemap prioritization
    const allBrands = await getAllBrands();
    const brands = brandSlugs
      ? allBrands.filter((b) => brandSlugs.includes(b.slug))
      : allBrands;
    const results: { brandSlug: string; colorSlug: string }[] = [];

    for (const brand of brands) {
      let query = supabase
        .from("colors")
        .select("slug, brand:brand_id (slug)")
        .eq("brand_id", brand.id)
        .order("name");

      if (perBrand) {
        query = query.limit(perBrand);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        for (const color of data) {
          const brandData = color.brand as unknown as { slug: string };
          results.push({
            brandSlug: brandData.slug,
            colorSlug: color.slug,
          });
        }
      }
    }

    return results;
  }

  // Fetch all colors (no limit)
  const results: { brandSlug: string; colorSlug: string }[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("colors")
      .select("slug, brand:brand_id (slug)")
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const color of data) {
      const brandData = color.brand as unknown as { slug: string };
      results.push({
        brandSlug: brandData.slug,
        colorSlug: color.slug,
      });
    }

    if (data.length < batchSize) {
      hasMore = false;
    }
    offset += batchSize;
  }

  return results;
}

import { supabase } from "./supabase";
import type { Brand, Color, ColorWithBrand, CrossBrandMatchWithColor, ColorFamily } from "./types";

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
  options?: { family?: string; limit?: number; offset?: number }
): Promise<Color[]> {
  let query = supabase
    .from("colors")
    .select("*")
    .eq("brand_id", brandId)
    .order("name");

  if (options?.family) {
    query = query.eq("color_family", options.family);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
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
  options?: { brandSlug?: string; limit?: number; offset?: number }
): Promise<ColorWithBrand[]> {
  let query = supabase
    .from("colors")
    .select("*, brand:brand_id (*)")
    .eq("color_family", familySlug)
    .order("lrv", { ascending: false });

  if (options?.brandSlug) {
    // Need to get brand ID first
    const brand = await getBrandBySlug(options.brandSlug);
    if (brand) {
      query = query.eq("brand_id", brand.id);
    }
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ColorWithBrand[];
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

// Paginated fetch for sitemaps - handles Supabase 1000-row limit
export async function getAllColorSlugs(): Promise<
  { brandSlug: string; colorSlug: string }[]
> {
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

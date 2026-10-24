import { supabase } from "@/lib/supabase";
import { getAllBrands } from "@/lib/queries";
import type { LrvSourceLabel } from "@/lib/color-input";

// Data for /tools/lrv-finder: current colors from the four brands whose LRVs
// we hold as manufacturer-published values (MP-50 chain), filtered by LRV
// range, brand and family.
//
// lrv_source comes from migration 017. Until it is applied the column does
// not exist (42703); the query is retried without it, sources are unknown,
// and `sourceKnown` is false so the page hides the published-only filter and
// prints no Published/Estimated label rather than guess.

export const LRV_FINDER_BRANDS = [
  { slug: "sherwin-williams", name: "Sherwin-Williams" },
  { slug: "benjamin-moore", name: "Benjamin Moore" },
  { slug: "behr", name: "Behr" },
  { slug: "dutch-boy", name: "Dutch Boy" },
] as const;

export const LRV_FINDER_LIMIT = 60;

export interface LrvFilters {
  brand: string | null; // one of LRV_FINDER_BRANDS, or null for all four
  family: string | null; // color_families.slug
  min: number; // inclusive, 0-100
  max: number; // inclusive, 0-100
  sort: "high" | "low";
  publishedOnly: boolean;
}

export interface LrvFinderColor {
  id: string;
  name: string;
  slug: string;
  hex: string;
  colorNumber: string | null;
  lrv: number;
  lrvSource: LrvSourceLabel;
  family: string | null;
  brandName: string;
  brandSlug: string;
}

export interface LrvFinderResult {
  colors: LrvFinderColor[];
  total: number;
  sourceKnown: boolean;
}

function clampLrv(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

/** Read filters from the query string. Unknown or bad values fall back to defaults. */
export function parseLrvFilters(
  params: Record<string, string | undefined>,
  familySlugs: readonly string[],
): LrvFilters {
  const brand = LRV_FINDER_BRANDS.some((b) => b.slug === params.brand) ? params.brand! : null;
  const family = params.family && familySlugs.includes(params.family) ? params.family : null;
  let min = clampLrv(params.min, 0);
  let max = clampLrv(params.max, 100);
  if (min > max) [min, max] = [max, min];
  return {
    brand,
    family,
    min,
    max,
    sort: params.sort === "low" ? "low" : "high",
    publishedOnly: params.published === "1",
  };
}

interface Row {
  id: string;
  name: string;
  slug: string;
  hex: string;
  color_number: string | null;
  lrv: number | string;
  lrv_source?: string | null;
  color_family: string | null;
  brand: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

let lrvSourceMissing = false;

export async function findColorsByLrv(filters: LrvFilters): Promise<LrvFinderResult> {
  const brands = await getAllBrands();
  const wanted = filters.brand ? [filters.brand] : LRV_FINDER_BRANDS.map((b) => b.slug as string);
  const brandIds = brands.filter((b) => wanted.includes(b.slug)).map((b) => b.id);
  if (brandIds.length === 0) return { colors: [], total: 0, sourceKnown: !lrvSourceMissing };

  const run = (withSource: boolean) => {
    const fields = `id, name, slug, hex, color_number, lrv, ${withSource ? "lrv_source, " : ""}color_family, brand:brand_id (name, slug)`;
    let q = supabase
      .from("colors")
      .select(fields, { count: "exact" })
      .in("brand_id", brandIds)
      .eq("availability", "current")
      .not("lrv", "is", null)
      .gte("lrv", filters.min)
      .lte("lrv", filters.max);
    if (filters.family) q = q.eq("color_family", filters.family);
    if (withSource && filters.publishedOnly) q = q.eq("lrv_source", "manufacturer");
    return q
      .order("lrv", { ascending: filters.sort === "low" })
      .order("name")
      .order("id")
      .limit(LRV_FINDER_LIMIT);
  };

  let sourceKnown = !lrvSourceMissing;
  let { data, error, count } = await run(sourceKnown);
  if (error && sourceKnown && (error as { code?: string }).code === "42703") {
    lrvSourceMissing = true;
    sourceKnown = false;
    ({ data, error, count } = await run(false));
  }
  if (error) throw error;

  const colors = ((data ?? []) as unknown as Row[]).map((r): LrvFinderColor => {
    const brand = Array.isArray(r.brand) ? r.brand[0] : r.brand;
    const src = r.lrv_source === "manufacturer" || r.lrv_source === "computed" ? r.lrv_source : null;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      hex: r.hex,
      colorNumber: r.color_number,
      lrv: Number(r.lrv),
      lrvSource: sourceKnown ? src : null,
      family: r.color_family,
      brandName: brand?.name ?? "",
      brandSlug: brand?.slug ?? "",
    };
  });

  return { colors, total: count ?? colors.length, sourceKnown };
}

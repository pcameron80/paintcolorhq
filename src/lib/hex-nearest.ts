import { supabase } from "@/lib/supabase";
import { getAllBrands } from "@/lib/queries";
import { hexToRgb, rgbToLab, deltaE2000 } from "@/lib/color-utils";
import type { Lab } from "@/lib/color-utils";
import type { LrvSourceLabel } from "@/lib/color-input";

// The closest CURRENT color in each brand for one hex. Backs the
// /tools/hex-to-paint-color page and /api/hex-nearest.
//
// Candidates come from nearest_colors_by_lab_v2 (migration 015) with
// in_brand set and in_current_only = true, so retired and discontinued colors
// never win. Each brand's pool is ranked by LAB distance (Delta E 76) in SQL
// and refined here with CIEDE2000, the same two-step as src/lib/color-match.ts.
//
// Until migration 015 is applied the v2 RPC 404s (PGRST202). Then this falls
// back to v1, refines a larger pool, and reads availability for the top few
// per brand in one extra query so the result is still current colors only.
//
// LRV source (migration 017 colors.lrv_source) is read in one batched query
// for the 13 winners. Before 017 is applied the column does not exist (42703);
// the source is then left unknown and the UI shows the LRV with no label.

export interface HexNearestMatch {
  brandName: string;
  brandSlug: string;
  id: string;
  name: string;
  colorSlug: string;
  colorNumber: string | null;
  hex: string;
  deltaE: number;
  lrv: number | null;
  lrvSource: LrvSourceLabel;
}

export interface HexNearestBrandResult {
  brandName: string;
  brandSlug: string;
  match: HexNearestMatch | null;
}

// Display order: the brands people search for most first. Any brand not
// listed (a future import) sorts after these, by catalog size.
const BRAND_ORDER = [
  "sherwin-williams",
  "benjamin-moore",
  "behr",
  "valspar",
  "ppg",
  "dutch-boy",
  "dunn-edwards",
  "farrow-ball",
  "kilz",
  "vista-paint",
  "hirshfields",
  "colorhouse",
  "ral",
];

// Per-brand candidate pools. Delta E 76 and CIEDE2000 agree on the nearest
// few colors almost always; 30 leaves ample room for the reorder.
const V2_POOL = 30;
// v1 cannot filter on availability, so it over-fetches; the top
// FALLBACK_CHECK by CIEDE2000 are then checked for availability.
const V1_POOL = 40;
const FALLBACK_CHECK = 6;

interface CandidateRow {
  id: string;
  name: string;
  hex: string;
  slug: string;
  color_number: string | null;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  lab_l: number | string | null;
  lab_a: number | string | null;
  lab_b_val: number | string | null;
  lrv: number | string | null;
  brand_name: string;
  brand_slug: string;
  availability?: string | null;
}

interface Scored {
  row: CandidateRow;
  deltaE: number;
}

// Module-scoped capability flags: once a call proves the v2 RPC or the
// lrv_source column is missing, stop asking for it in this instance.
let v2Missing = false;
let lrvSourceMissing = false;

function num(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function score(input: Lab, rows: CandidateRow[]): Scored[] {
  return rows
    .map((row) => {
      const L = num(row.lab_l);
      const a = num(row.lab_a);
      const b = num(row.lab_b_val);
      const lab: Lab = L != null && a != null && b != null ? { L, a, b } : rgbToLab(row.rgb_r, row.rgb_g, row.rgb_b);
      return { row, deltaE: deltaE2000(input, lab) };
    })
    // Ties (duplicate hexes inside a brand) break on id, like the v2 RPC.
    .sort((x, y) => x.deltaE - y.deltaE || (x.row.id < y.row.id ? -1 : x.row.id > y.row.id ? 1 : 0));
}

async function poolFor(input: Lab, brandSlug: string, version: "v1" | "v2"): Promise<CandidateRow[]> {
  const args: Record<string, unknown> = {
    in_l: input.L,
    in_a: input.a,
    in_b: input.b,
    in_brand: brandSlug,
    in_limit: version === "v2" ? V2_POOL : V1_POOL,
  };
  if (version === "v2") args.in_current_only = true;
  const fn = version === "v2" ? "nearest_colors_by_lab_v2" : "nearest_colors_by_lab";
  const { data, error } = await supabase.rpc(fn, args, { get: true });
  if (error) throw error;
  return (data ?? []) as CandidateRow[];
}

function isMissingFunction(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "PGRST202" || code === "42883";
}

function isMissingColumn(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "42703";
}

interface ColorMeta {
  availability: string | null;
  lrvSource: LrvSourceLabel;
}

async function readMeta(ids: string[]): Promise<Map<string, ColorMeta>> {
  const out = new Map<string, ColorMeta>();
  if (ids.length === 0) return out;
  const unique = [...new Set(ids)];

  if (!lrvSourceMissing) {
    const { data, error } = await supabase.from("colors").select("id, availability, lrv_source").in("id", unique);
    if (!error) {
      for (const r of (data ?? []) as { id: string; availability: string | null; lrv_source: string | null }[]) {
        const src = r.lrv_source === "manufacturer" || r.lrv_source === "computed" ? r.lrv_source : null;
        out.set(r.id, { availability: r.availability, lrvSource: src });
      }
      return out;
    }
    if (!isMissingColumn(error)) throw error;
    lrvSourceMissing = true;
  }

  const { data, error } = await supabase.from("colors").select("id, availability").in("id", unique);
  if (error) throw error;
  for (const r of (data ?? []) as { id: string; availability: string | null }[]) {
    out.set(r.id, { availability: r.availability, lrvSource: null });
  }
  return out;
}

function toMatch(s: Scored, meta: ColorMeta | undefined): HexNearestMatch {
  return {
    brandName: s.row.brand_name,
    brandSlug: s.row.brand_slug,
    id: s.row.id,
    name: s.row.name,
    colorSlug: s.row.slug,
    colorNumber: s.row.color_number,
    hex: s.row.hex,
    deltaE: Number(s.deltaE.toFixed(2)),
    lrv: num(s.row.lrv),
    lrvSource: meta?.lrvSource ?? null,
  };
}

async function brandsInOrder(): Promise<{ name: string; slug: string }[]> {
  const brands = await getAllBrands();
  const rank = (slug: string) => {
    const i = BRAND_ORDER.indexOf(slug);
    return i === -1 ? BRAND_ORDER.length : i;
  };
  // getAllBrands is ordered by catalog size, and sort is stable, so unlisted
  // brands keep that order behind the listed ones.
  return [...brands].sort((a, b) => rank(a.slug) - rank(b.slug)).map((b) => ({ name: b.name, slug: b.slug }));
}

/**
 * Nearest current color per brand for `hex` ("#rrggbb" or "rrggbb").
 * A brand with no current color in range returns match: null.
 */
export async function findNearestPerBrand(hex: string): Promise<HexNearestBrandResult[]> {
  const normalized = hex.startsWith("#") ? hex : `#${hex}`;
  const { r, g, b } = hexToRgb(normalized);
  const input = rgbToLab(r, g, b);
  const brands = await brandsInOrder();

  let pools: CandidateRow[][] | null = null;
  if (!v2Missing) {
    try {
      pools = await Promise.all(brands.map((br) => poolFor(input, br.slug, "v2")));
    } catch (err) {
      if (!isMissingFunction(err)) throw err;
      v2Missing = true;
    }
  }

  if (pools) {
    // v2 path: every row is already current, the winner is the top CIEDE2000.
    const winners = pools.map((rows) => score(input, rows)[0] ?? null);
    const meta = await readMeta(winners.filter((w): w is Scored => w != null).map((w) => w.row.id));
    return brands.map((br, i) => ({
      brandName: br.name,
      brandSlug: br.slug,
      match: winners[i] ? toMatch(winners[i]!, meta.get(winners[i]!.row.id)) : null,
    }));
  }

  // v1 fallback: refine, then check availability for the top few per brand.
  const v1 = await Promise.all(brands.map((br) => poolFor(input, br.slug, "v1")));
  const shortlists = v1.map((rows) => score(input, rows).slice(0, FALLBACK_CHECK));
  const meta = await readMeta(shortlists.flat().map((s) => s.row.id));
  return brands.map((br, i) => {
    // A color with no availability value predates migration 012 and is current.
    const best = shortlists[i].find((s) => (meta.get(s.row.id)?.availability ?? "current") === "current");
    return {
      brandName: br.name,
      brandSlug: br.slug,
      match: best ? toMatch(best, meta.get(best.row.id)) : null,
    };
  });
}

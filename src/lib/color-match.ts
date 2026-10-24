import { supabase } from "@/lib/supabase";
import { hexToRgb, rgbToLab, deltaE2000 } from "@/lib/color-utils";
import type { Lab } from "@/lib/color-utils";
import type { ColorAvailability } from "@/lib/types";
import { pickBestPerBrand, missingBigThree } from "@/lib/best-per-brand";

// Core cross-brand color matcher. Extracted so BOTH the public REST route
// (src/app/api/color-match/route.ts) and the MCP agent tool (src/app/api/mcp)
// call it directly — no self-HTTP proxy.
//
// Candidate selection is deterministic: the nearest_colors_by_lab_v2 RPC
// (migration 015; v1 from migration 010 answers until 015 is applied) orders ALL
// colors by squared CIE LAB distance (ΔE76) and returns the k nearest; we then
// refine those k with the exact CIEDE2000 (ΔE2000) formula and take the final
// top-N. This replaced an unordered RGB bounding box + .limit(500), which
// silently dropped the true closest color in dense color regions (a ±40 RGB box
// around a common greige holds 6,000+ of our ~26.6k colors), so the "closest"
// match could vary run to run. The RPC is called over GET so it stays cacheable
// by Next's Data Cache.
//
// FREE tier (paid = false): base fields only — the shape the widget/tools depend
// on; do NOT change it. The one additive field is `availability`, present only on
// retired or discontinued colors. PAID tier adds the color-science fields and is
// otherwise unchanged (no availability).

export interface PaintMatch {
  id: string;
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber: string | null;
  deltaE: number;
  // Free tier only, and only when the brand has retired or discontinued the
  // color. Missing means current (also the case while the v1 RPC answers).
  availability?: Exclude<ColorAvailability, "current">;
  // Paid-tier color-science fields — present only when paid = true.
  lab?: { L: number; a: number; b: number };
  rgb?: { r: number; g: number; b: number };
  undertone?: string | null;
  lrv?: number | null;
  colorFamily?: string | null;
}

// One row from nearest_colors_by_lab(_v2) (flat brand columns; numeric fields may
// arrive as strings from PostgREST, so everything numeric is coerced below).
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
  undertone: string | null;
  lrv: number | string | null;
  color_family: string | null;
  brand_name: string;
  brand_slug: string;
  // v2 only. Absent when the v1 fallback answered.
  availability?: string | null;
}

// v2 (migration 015) adds `availability`. Until Philip applies it, PostgREST
// answers PGRST202 ("function not found") and we fall back to v1, where every
// color counts as current. Next's fetch cache stores only 200 responses, so the
// first call after the migration lands picks v2 up.
const RPC_V2 = "nearest_colors_by_lab_v2";
const RPC_V1 = "nearest_colors_by_lab";
const FUNCTION_MISSING = new Set(["PGRST202", "42883"]);
// A 404 is not cached, so while v2 is missing each instance skips it for 10
// minutes after a miss instead of paying a failed round trip on every call.
const V2_RECHECK_MS = 10 * 60 * 1000;
let v2MissingUntil = 0;

async function nearestCandidates(
  inputLab: Lab,
  brand: string | null,
  poolSize: number,
): Promise<CandidateRow[]> {
  // Omit in_brand entirely when unfiltered so the SQL DEFAULT (NULL) applies. Over
  // a GET RPC, passing null serializes to the string "null", which would match no
  // brand slug and return zero rows.
  const args: Record<string, unknown> = {
    in_l: inputLab.L,
    in_a: inputLab.a,
    in_b: inputLab.b,
    in_limit: poolSize,
  };
  if (brand) args.in_brand = brand;

  if (Date.now() >= v2MissingUntil) {
    const v2 = await supabase.rpc(RPC_V2, args, { get: true });
    if (!v2.error) return (v2.data ?? []) as CandidateRow[];
    if (!FUNCTION_MISSING.has(v2.error.code ?? "")) throw v2.error;
    v2MissingUntil = Date.now() + V2_RECHECK_MS;
  }

  const v1 = await supabase.rpc(RPC_V1, args, { get: true });
  if (v1.error) throw v1.error;
  return (v1.data ?? []) as CandidateRow[];
}

function scoreCandidates(inputLab: Lab, candidates: CandidateRow[], paid: boolean): PaintMatch[] {
  const scored = candidates.map((c): PaintMatch => {
    const labL = num(c.lab_l);
    const labA = num(c.lab_a);
    const labBVal = num(c.lab_b_val);
    const candidateLab: Lab =
      labL != null && labA != null && labBVal != null
        ? { L: labL, a: labA, b: labBVal }
        : rgbToLab(c.rgb_r, c.rgb_g, c.rgb_b);

    const base: PaintMatch = {
      id: c.id,
      name: c.name,
      hex: c.hex,
      brandName: c.brand_name,
      brandSlug: c.brand_slug,
      colorSlug: c.slug,
      colorNumber: c.color_number,
      deltaE: Number(deltaE2000(inputLab, candidateLab).toFixed(2)),
    };

    if (!paid) {
      // Additive and free tier only. A current color's object is unchanged.
      if (c.availability === "retired" || c.availability === "discontinued") {
        return { ...base, availability: c.availability };
      }
      return base;
    }
    // Paid-only color-science fields.
    return {
      ...base,
      lab: {
        L: Number(candidateLab.L.toFixed(2)),
        a: Number(candidateLab.a.toFixed(2)),
        b: Number(candidateLab.b.toFixed(2)),
      },
      rgb: { r: c.rgb_r, g: c.rgb_g, b: c.rgb_b },
      undertone: c.undertone ?? null,
      lrv: num(c.lrv),
      colorFamily: c.color_family ?? null,
    };
  });

  scored.sort((a, b) => a.deltaE - b.deltaE);
  return scored;
}

function labOf(hex: string): Lab {
  const normalizedHex = hex.startsWith("#") ? hex : `#${hex}`;
  const { r, g, b } = hexToRgb(normalizedHex);
  return rgbToLab(r, g, b);
}

export async function findColorMatches(
  hex: string,
  brand: string | null,
  limit: number,
  paid: boolean,
): Promise<PaintMatch[]> {
  const inputLab = labOf(hex);

  // Over-fetch a candidate pool so the exact ΔE2000 top-N is guaranteed within the
  // ΔE76-ranked pool, then refine. 6× the requested count (min 200, cap 500) is
  // ample — ΔE76 and ΔE2000 rank near-identical colors the same way.
  const poolSize = Math.min(Math.max(limit * 6, 200), 500);

  const candidates = await nearestCandidates(inputLab, brand, poolSize);
  return scoreCandidates(inputLab, candidates, paid).slice(0, limit);
}

// Pool for the per-brand view: the matcher's existing cap, wide enough that
// most brands have their closest color in it.
const PER_BRAND_POOL = 500;
// A big-three brand with no color in the wide pool (saturated or very dark
// inputs, where the nearest 500 cluster in a few catalogs) gets its own
// brand-filtered call; ΔE2000 refines that brand's 30 nearest by ΔE76.
const BRAND_FALLBACK_POOL = 30;

/**
 * Free-tier matches plus the closest color in each brand. `matches` is the
 * overall top-N the tools always showed. `bestPerBrand` holds one entry per
 * brand found, sorted by Delta E, and always includes Sherwin-Williams,
 * Benjamin Moore and Behr when they have any color at all.
 */
export async function findColorMatchesWithBestPerBrand(
  hex: string,
  limit: number,
): Promise<{ matches: PaintMatch[]; bestPerBrand: PaintMatch[] }> {
  const inputLab = labOf(hex);
  const scored = scoreCandidates(
    inputLab,
    await nearestCandidates(inputLab, null, PER_BRAND_POOL),
    false,
  );
  const best = pickBestPerBrand(scored);

  const missing = missingBigThree(best);
  if (missing.length > 0) {
    const extra = await Promise.all(
      missing.map(async (slug) => {
        const rows = await nearestCandidates(inputLab, slug, BRAND_FALLBACK_POOL);
        return scoreCandidates(inputLab, rows, false)[0] ?? null;
      }),
    );
    for (const m of extra) if (m) best.push(m);
    best.sort((a, b) => a.deltaE - b.deltaE);
  }

  return { matches: scored.slice(0, limit), bestPerBrand: best };
}

// PostgREST may serialize numeric columns as strings; coerce to number | null.
function num(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

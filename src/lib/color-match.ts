import { supabase } from "@/lib/supabase";
import { hexToRgb, rgbToLab, deltaE2000 } from "@/lib/color-utils";
import type { Lab } from "@/lib/color-utils";

// Core cross-brand color matcher. Extracted so BOTH the public REST route
// (src/app/api/color-match/route.ts) and the MCP agent tool (src/app/api/mcp)
// call it directly — no self-HTTP proxy.
//
// Candidate selection is deterministic: the nearest_colors_by_lab RPC (migration
// 010) orders ALL colors by squared CIE LAB distance (ΔE76) and returns the k
// nearest; we then refine those k with the exact CIEDE2000 (ΔE2000) formula and
// take the final top-N. This replaced an unordered RGB bounding box + .limit(500),
// which silently dropped the true closest color in dense color regions (a ±40 RGB
// box around a common greige holds 6,000+ of our ~26.6k colors), so the "closest"
// match could vary run to run. The RPC is called over GET so it stays cacheable by
// Next's Data Cache.
//
// FREE tier (paid = false): base fields only — the shape the widget/tools depend
// on; do NOT change it. PAID tier adds the color-science fields.

export interface PaintMatch {
  id: string;
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber: string | null;
  deltaE: number;
  // Paid-tier color-science fields — present only when paid = true.
  lab?: { L: number; a: number; b: number };
  rgb?: { r: number; g: number; b: number };
  undertone?: string | null;
  lrv?: number | null;
  colorFamily?: string | null;
}

// One row from nearest_colors_by_lab (flat brand columns; numeric fields may
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
}

export async function findColorMatches(
  hex: string,
  brand: string | null,
  limit: number,
  paid: boolean,
): Promise<PaintMatch[]> {
  const normalizedHex = hex.startsWith("#") ? hex : `#${hex}`;
  const { r, g, b } = hexToRgb(normalizedHex);
  const inputLab = rgbToLab(r, g, b);

  // Over-fetch a candidate pool so the exact ΔE2000 top-N is guaranteed within the
  // ΔE76-ranked pool, then refine. 6× the requested count (min 200, cap 500) is
  // ample — ΔE76 and ΔE2000 rank near-identical colors the same way.
  const poolSize = Math.min(Math.max(limit * 6, 200), 500);

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

  const { data, error } = await supabase.rpc("nearest_colors_by_lab", args, { get: true });
  if (error) throw error;
  const candidates = (data ?? []) as CandidateRow[];

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

    if (!paid) return base;
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
  return scored.slice(0, limit);
}

// PostgREST may serialize numeric columns as strings; coerce to number | null.
function num(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

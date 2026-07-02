import { supabase } from "@/lib/supabase";
import { hexToRgb, rgbToLab, deltaE2000 } from "@/lib/color-utils";
import type { Lab } from "@/lib/color-utils";

// Core cross-brand color matcher. Extracted so BOTH the public REST route
// (src/app/api/color-match/route.ts) and the MCP agent tool (src/app/api/mcp)
// call it directly. The MCP tool previously proxied the REST endpoint over HTTP,
// which self-logged a duplicate usage row and made an internal call impossible to
// tell apart from an external one without a spoofable trust header. One function,
// no self-HTTP. DB reads still hit Next's Data Cache via the shared `supabase`
// client's `revalidate` wrapper, so calling it directly costs nothing extra.
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

export async function findColorMatches(
  hex: string,
  brand: string | null,
  limit: number,
  paid: boolean,
): Promise<PaintMatch[]> {
  const normalizedHex = hex.startsWith("#") ? hex : `#${hex}`;
  const { r, g, b } = hexToRgb(normalizedHex);
  const inputLab = rgbToLab(r, g, b);

  let candidates = await fetchCandidates(r, g, b, 40, brand);
  if (candidates.length < limit) {
    candidates = await fetchCandidates(r, g, b, 80, brand);
  }

  const scored = candidates.map((c): PaintMatch => {
    const candidateLab: Lab =
      c.lab_l != null && c.lab_a != null && c.lab_b_val != null
        ? { L: Number(c.lab_l), a: Number(c.lab_a), b: Number(c.lab_b_val) }
        : rgbToLab(c.rgb_r, c.rgb_g, c.rgb_b);

    const base: PaintMatch = {
      id: c.id,
      name: c.name,
      hex: c.hex,
      brandName: c.brand.name,
      brandSlug: c.brand.slug,
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
      lrv: c.lrv != null ? Number(c.lrv) : null,
      colorFamily: c.color_family ?? null,
    };
  });

  scored.sort((a, b) => a.deltaE - b.deltaE);
  return scored.slice(0, limit);
}

async function fetchCandidates(r: number, g: number, b: number, range: number, brand?: string | null) {
  const brandJoin = brand ? "brand:brand_id!inner (name, slug)" : "brand:brand_id (name, slug)";

  let query = supabase
    .from("colors")
    .select(
      `id, name, hex, slug, color_number, rgb_r, rgb_g, rgb_b, lab_l, lab_a, lab_b_val, undertone, lrv, color_family, ${brandJoin}`,
    )
    .gte("rgb_r", Math.max(0, r - range))
    .lte("rgb_r", Math.min(255, r + range))
    .gte("rgb_g", Math.max(0, g - range))
    .lte("rgb_g", Math.min(255, g + range))
    .gte("rgb_b", Math.max(0, b - range))
    .lte("rgb_b", Math.min(255, b + range));

  if (brand) {
    query = query.eq("brand.slug", brand);
  }

  const { data, error } = await query.limit(500);
  if (error) throw error;

  return (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    hex: string;
    slug: string;
    color_number: string | null;
    rgb_r: number;
    rgb_g: number;
    rgb_b: number;
    lab_l: number | null;
    lab_a: number | null;
    lab_b_val: number | null;
    undertone: string | null;
    lrv: number | null;
    color_family: string | null;
    brand: { name: string; slug: string };
  }>;
}

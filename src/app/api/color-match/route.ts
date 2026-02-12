import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hexToRgb, rgbToLab, deltaE2000 } from "@/lib/color-utils";
import type { Lab } from "@/lib/color-utils";

export async function GET(request: NextRequest) {
  const hex = request.nextUrl.searchParams.get("hex");
  const brand = request.nextUrl.searchParams.get("brand");

  if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(hex)) {
    return NextResponse.json(
      { error: "Invalid hex parameter. Use format: AABBCC or #AABBCC" },
      { status: 400 },
    );
  }

  const normalizedHex = hex.startsWith("#") ? hex : `#${hex}`;
  const { r, g, b } = hexToRgb(normalizedHex);
  const inputLab = rgbToLab(r, g, b);

  // Fetch candidates within RGB range
  let range = 40;
  let candidates = await fetchCandidates(r, g, b, range, brand);

  // Widen search if too few results
  if (candidates.length < 10) {
    range = 80;
    candidates = await fetchCandidates(r, g, b, range, brand);
  }

  // Score each candidate using Delta E 2000
  const scored = candidates.map((c) => {
    let candidateLab: Lab;
    if (c.lab_l != null && c.lab_a != null && c.lab_b_val != null) {
      candidateLab = {
        L: Number(c.lab_l),
        a: Number(c.lab_a),
        b: Number(c.lab_b_val),
      };
    } else {
      candidateLab = rgbToLab(c.rgb_r, c.rgb_g, c.rgb_b);
    }

    return {
      id: c.id,
      name: c.name,
      hex: c.hex,
      brandName: c.brand.name,
      brandSlug: c.brand.slug,
      colorSlug: c.slug,
      colorNumber: c.color_number,
      deltaE: Number(deltaE2000(inputLab, candidateLab).toFixed(2)),
    };
  });

  // Sort by Delta E and return top 10
  scored.sort((a, b) => a.deltaE - b.deltaE);

  return NextResponse.json({ matches: scored.slice(0, 10) });
}

async function fetchCandidates(r: number, g: number, b: number, range: number, brand?: string | null) {
  const brandJoin = brand
    ? "brand:brand_id!inner (name, slug)"
    : "brand:brand_id (name, slug)";

  let query = supabase
    .from("colors")
    .select(`id, name, hex, slug, color_number, rgb_r, rgb_g, rgb_b, lab_l, lab_a, lab_b_val, ${brandJoin}`)
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
    brand: { name: string; slug: string };
  }>;
}

import { NextRequest, NextResponse, after } from "next/server";
import { supabase } from "@/lib/supabase";
import { hexToRgb, rgbToLab, deltaE2000 } from "@/lib/color-utils";
import type { Lab } from "@/lib/color-utils";
import { logUsageEvent, usageMetaFromRequest } from "@/lib/usage-log";

// Public read-only cross-brand match API. CORS-open so it can be called from any
// origin — the embeddable widget, the on-site tools, third-party integrations,
// and the RapidAPI listing (the cross-brand equivalence API).
//
// FREE tier (no/invalid proxy secret): top-10 matches with numeric Delta E. This
// is the response the free widget + on-site tools depend on — do NOT change its
// shape. The data is already public on the color pages, so it's open + CDN-cached.
//
// PAID tier (valid X-RapidAPI-Proxy-Secret, set via RAPIDAPI_PROXY_SECRET): the
// enhanced response — up to 50 matches, optional batch (comma-separated hex), and
// extra color-science fields (LAB, RGB, undertone, LRV, family). Gated so the paid
// response only flows through RapidAPI (where calls are metered/billed). Not
// CDN-cached, and free responses Vary on the secret header so the two never mix.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-RapidAPI-Proxy-Secret",
  Vary: "X-RapidAPI-Proxy-Secret",
};

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
const MAX_BATCH = 10;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const hexParam = params.get("hex");
  const brand = params.get("brand");

  const secret = process.env.RAPIDAPI_PROXY_SECRET;
  const paid = Boolean(secret) && request.headers.get("x-rapidapi-proxy-secret") === secret;

  // Result count: free is fixed at 10; paid may request 1–50.
  const requested = parseInt(params.get("limit") ?? "", 10);
  const limit = paid ? Math.min(Math.max(Number.isFinite(requested) ? requested : 10, 1), 50) : 10;

  if (!hexParam) {
    return NextResponse.json(
      { error: "Missing hex parameter. Use format: AABBCC or #AABBCC" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Batch (paid only): comma-separated hex values → one result set per input.
  const isBatch = paid && hexParam.includes(",");
  const hexes = isBatch
    ? hexParam.split(",").map((h) => h.trim()).filter(Boolean).slice(0, MAX_BATCH)
    : [hexParam];

  const invalid = hexes.find((h) => !HEX_RE.test(h));
  if (invalid) {
    return NextResponse.json(
      { error: `Invalid hex value: ${invalid}. Use format: AABBCC or #AABBCC` },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Adoption telemetry (docs/api-adoption-plan-2026-06-27.md §1) — runs after the
  // response flushes, swallows its own errors, and only fires on a cache MISS
  // (the free body is edge-cached, so repeat lookups aren't re-logged). `tier`
  // separates RapidAPI/paid usage (Stream C) from free distribution (Stream A).
  // Skip when the MCP server calls us internally (it sets x-pchq-internal and
  // already logs source=mcp) so one agent call isn't double-counted here too.
  if (!request.headers.get("x-pchq-internal")) {
    after(() =>
      logUsageEvent({
        source: "color-match",
        tier: paid ? "paid" : "free",
        hex: hexes[0] ?? null,
        ...usageMetaFromRequest(request),
      }),
    );
  }

  // Paid responses must not be shared-cached (would leak paid fields to free, or
  // serve a stale free body to a paid caller). Free stays CDN-cached for 24h.
  const cacheHeader = paid
    ? "private, no-store"
    : "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";
  const headers = { ...CORS_HEADERS, "Cache-Control": cacheHeader };

  if (isBatch) {
    const results = await Promise.all(
      hexes.map(async (h) => ({ hex: h, matches: await matchesForHex(h, brand, limit, paid) })),
    );
    return NextResponse.json({ results }, { headers });
  }

  const matches = await matchesForHex(hexes[0], brand, limit, paid);
  return NextResponse.json({ matches }, { headers });
}

async function matchesForHex(hex: string, brand: string | null, limit: number, paid: boolean) {
  const normalizedHex = hex.startsWith("#") ? hex : `#${hex}`;
  const { r, g, b } = hexToRgb(normalizedHex);
  const inputLab = rgbToLab(r, g, b);

  let candidates = await fetchCandidates(r, g, b, 40, brand);
  if (candidates.length < limit) {
    candidates = await fetchCandidates(r, g, b, 80, brand);
  }

  const scored = candidates.map((c) => {
    const candidateLab: Lab =
      c.lab_l != null && c.lab_a != null && c.lab_b_val != null
        ? { L: Number(c.lab_l), a: Number(c.lab_a), b: Number(c.lab_b_val) }
        : rgbToLab(c.rgb_r, c.rgb_g, c.rgb_b);

    const base = {
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
      lab: { L: Number(candidateLab.L.toFixed(2)), a: Number(candidateLab.a.toFixed(2)), b: Number(candidateLab.b.toFixed(2)) },
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

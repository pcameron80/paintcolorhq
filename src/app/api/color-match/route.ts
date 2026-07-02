import { NextRequest, NextResponse, after } from "next/server";
import { findColorMatches } from "@/lib/color-match";
import { logUsageEvent, usageMetaFromRequest, isOnSiteReferer } from "@/lib/usage-log";

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
//
// The matching itself lives in src/lib/color-match.ts so the MCP agent tool can
// call it directly (no self-HTTP proxy).
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
  // The MCP tool calls the matcher directly, not this route, so no self-traffic.
  // Skip on-site/widget picker traffic (same-origin) — that's engagement, not API
  // adoption, and at picker-drag rates it would swamp the log. See isOnSiteReferer.
  if (!isOnSiteReferer(request.headers.get("referer"))) {
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
      hexes.map(async (h) => ({ hex: h, matches: await findColorMatches(h, brand, limit, paid) })),
    );
    return NextResponse.json({ results }, { headers });
  }

  const matches = await findColorMatches(hexes[0], brand, limit, paid);
  return NextResponse.json({ matches }, { headers });
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSamplizeProductLink, SAMPLIZE_BRAND_SLUGS } from "@/lib/affiliate";

// Internal availability check for tool surfaces (color-identifier match results).
// Given up to 10 color ids, returns a ready-to-render Samplize sample link for
// each color that (a) belongs to a brand Samplize stocks and (b) has a crawl/feed-
// confirmed live product page (colors.samplize_available — see migrations 007/008).
// The gate exists because Samplize's catalog is not a superset of ours (~30% of
// our SW colors 404 there); rendering ungated deep links = monetized dead ends.
//
// Internal-only: not in the OpenAPI spec, no CORS (same-origin fetch from our own
// client components). URLs are built server-side via the shared affiliate helper
// so the CJ prefix/sid logic stays in one place.
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SID_RE = /^[a-z0-9-]{1,40}$/;
const MAX_IDS = 10;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ids = (params.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s))
    .slice(0, MAX_IDS);
  const sidParam = params.get("sid") ?? "";
  const sid = SID_RE.test(sidParam) ? sidParam : "tool";

  if (ids.length === 0) {
    return NextResponse.json({ links: {} }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("colors")
    .select("id, slug, samplize_available, samplize_handle, brand:brand_id (slug)")
    .in("id", ids);

  if (error) {
    // Availability is an enhancement, not a dependency — fail soft with no links.
    return NextResponse.json({ links: {} }, { status: 200 });
  }

  const links: Record<string, { url: string; affiliate: boolean }> = {};
  for (const row of (data ?? []) as unknown as Array<{
    id: string;
    slug: string;
    samplize_available: boolean | null;
    samplize_handle: string | null;
    brand: { slug: string } | null;
  }>) {
    if (row.samplize_available !== true) continue;
    if (!row.brand || !SAMPLIZE_BRAND_SLUGS.has(row.brand.slug)) continue;
    links[row.id] = getSamplizeProductLink(row.slug, row.samplize_handle, sid);
  }

  // Availability changes only when the crawl/feed re-runs — cache a day at the edge.
  return NextResponse.json(
    { links },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}

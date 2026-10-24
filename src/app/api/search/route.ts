import { NextRequest, NextResponse } from "next/server";
import { searchColorsDetailed, searchColorsInBrand } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  // Optional brand scope (brand slug), used by the match pickers.
  const brand = request.nextUrl.searchParams.get("brand");

  if (q.length < 2) {
    return NextResponse.json({ results: [], brand: null });
  }

  try {
    const body = brand && /^[a-z0-9-]{2,60}$/.test(brand)
      ? { results: await searchColorsInBrand(q, brand), brand: null }
      : await searchColorsDetailed(q, 50);
    // Cache popular queries at the edge for 1h. Vercel keys cache by
    // full URL including ?q= so each unique query gets its own cache
    // entry. Stale-while-revalidate keeps results snappy even if a
    // cache entry expires while a request is in-flight.
    return NextResponse.json(body, {
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[api/search] failed", { q, brand, err });
    return NextResponse.json({ results: [], brand: null, error: "Search failed" }, { status: 500 });
  }
}

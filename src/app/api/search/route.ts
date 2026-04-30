import { NextRequest, NextResponse } from "next/server";
import { searchColors } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchColors(q, 50);
    // Cache popular queries at the edge for 1h. Vercel keys cache by
    // full URL including ?q= so each unique query gets its own cache
    // entry. Stale-while-revalidate keeps results snappy even if a
    // cache entry expires while a request is in-flight.
    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}

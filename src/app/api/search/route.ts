import { NextRequest, NextResponse } from "next/server";
import { searchColorsDetailed, searchColorsInBrand } from "@/lib/queries";
import { normalizeSearchQuery } from "@/lib/search-query";
import { correctName, isWeakResult, type WordCounts } from "@/lib/search-spelling";
import searchWords from "@/generated/search-words.json";

const WORDS = searchWords as WordCounts;

/**
 * The query with its misspelled name words fixed ("agean" -> "aegean"), or
 * null. Brand words and codes are left as typed.
 */
function correctedQuery(q: string): string | null {
  const { name } = normalizeSearchQuery(q);
  if (!name) return null;
  const fixed = correctName(name, WORDS);
  if (!fixed) return null;
  const from = name.split(" ");
  const to = fixed.split(" ");
  const swap = new Map(from.map((w, i): [string, string] => [w, to[i]]).filter(([a, b]) => a !== b));
  return q.split(/\s+/).map((t) => swap.get(t.toLowerCase()) ?? t).join(" ");
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  // Optional brand scope (brand slug), used by the match pickers.
  const brand = request.nextUrl.searchParams.get("brand");

  if (q.length < 2) {
    return NextResponse.json({ results: [], brand: null, correctedQuery: null });
  }

  try {
    let body: { results: Awaited<ReturnType<typeof searchColorsInBrand>>; brand: { slug: string; name: string } | null; correctedQuery: string | null };
    if (brand && /^[a-z0-9-]{2,60}$/.test(brand)) {
      body = { results: await searchColorsInBrand(q, brand), brand: null, correctedQuery: null };
    } else {
      body = { ...(await searchColorsDetailed(q, 50)), correctedQuery: null };
      // Nothing, or only mid-word hits ("agean" finding Pageant colors):
      // try the spelling-corrected query and put its results first.
      const name = normalizeSearchQuery(q).name;
      const fixed = name && isWeakResult(name, body.results.map((c) => c.name)) ? correctedQuery(q) : null;
      if (fixed) {
        const better = await searchColorsDetailed(fixed, 50);
        if (better.results.length) {
          const seen = new Set(better.results.map((c) => c.id));
          body = {
            results: [...better.results, ...body.results.filter((c) => !seen.has(c.id))].slice(0, 50),
            brand: better.brand ?? body.brand,
            correctedQuery: fixed,
          };
        }
      }
    }
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
    return NextResponse.json({ results: [], brand: null, correctedQuery: null, error: "Search failed" }, { status: 500 });
  }
}

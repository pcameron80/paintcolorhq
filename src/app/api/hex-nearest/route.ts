import { NextRequest, NextResponse } from "next/server";
import { findNearestPerBrand } from "@/lib/hex-nearest";
import { parseColorInput } from "@/lib/color-input";
import { closenessLabel } from "@/lib/closeness";
import { ATTRIBUTION } from "@/lib/attribution";

// The closest current color in every brand for one hex or RGB value. Backs the
// /tools/hex-to-paint-color tool. Read-only, CORS-open and CDN-cached for 24h
// like the free /api/color-match tier: the data is the same public catalog
// the color pages show.
//
//   GET /api/hex-nearest?hex=a8a29a
//   GET /api/hex-nearest?hex=rgb(168,162,154)
//
// Each result carries the numeric deltaE (CIEDE2000) for API consumers and
// the site's plain-language `closeness` label, which is what any page should
// print instead of the number.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SITE = "https://www.paintcolorhq.com";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("hex");
  const hex = parseColorInput(raw);
  if (!hex) {
    return NextResponse.json(
      { error: "Missing or invalid hex parameter. Use a hex code (A8A29A, #A8A29A, #ABC) or RGB (168,162,154)." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const brands = await findNearestPerBrand(hex);
  const results = brands.map(({ brandName, brandSlug, match }) => ({
    brandName,
    brandSlug,
    match: match
      ? {
          name: match.name,
          colorNumber: match.colorNumber,
          hex: match.hex,
          colorSlug: match.colorSlug,
          url: `${SITE}/colors/${match.brandSlug}/${match.colorSlug}`,
          deltaE: match.deltaE,
          closeness: closenessLabel(match.deltaE),
          lrv: match.lrv,
          lrvSource: match.lrvSource,
        }
      : null,
  }));

  return NextResponse.json(
    { hex, results, attribution: ATTRIBUTION },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}

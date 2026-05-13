import { NextRequest, NextResponse } from "next/server";
import { getColorsByFamily, getColorsByFamilyCount } from "@/lib/queries";

interface RouteContext {
  params: Promise<{ familySlug: string }>;
}

const PER_PAGE = 60;

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { familySlug } = await params;
  const sp = request.nextUrl.searchParams;
  const brand = sp.get("brand") || undefined;
  const undertone = sp.get("undertone") || undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);

  try {
    const [colors, totalCount] = await Promise.all([
      getColorsByFamily(familySlug, {
        brandSlug: brand,
        undertone,
        limit: PER_PAGE,
        offset: (page - 1) * PER_PAGE,
      }),
      getColorsByFamilyCount(familySlug, { brandSlug: brand, undertone }),
    ]);

    return NextResponse.json(
      {
        colors,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / PER_PAGE)),
        page,
        perPage: PER_PAGE,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Query failed" },
      { status: 500 },
    );
  }
}

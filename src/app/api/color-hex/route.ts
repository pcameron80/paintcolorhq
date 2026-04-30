import { NextRequest, NextResponse } from "next/server";
import { getColorBySlug } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get("brand");
  const slug = req.nextUrl.searchParams.get("slug");

  if (!brand || !slug) {
    return NextResponse.json({ hex: null }, { status: 400 });
  }

  // Try exact match first
  let color = await getColorBySlug(brand, slug);

  // If not found, try without common brand prefixes in the slug
  // e.g. "agreeable-gray-sw-7029" -> try "agreeable-gray-7029"
  if (!color) {
    const prefixes = ["sw-", "bm-", "hc-", "oc-", "cc-", "af-", "csp-", "de", "ppu", "n", "s"];
    for (const prefix of prefixes) {
      const cleaned: string = slug.replace(new RegExp(`-${prefix}`, "i"), "-");
      if (cleaned !== slug) {
        color = await getColorBySlug(brand, cleaned);
        if (color) break;
      }
    }
  }

  // If still not found, try a LIKE search on the slug
  if (!color) {
    const { data } = await supabase
      .from("colors")
      .select("hex, brands!inner(slug)")
      .eq("brands.slug", brand)
      .ilike("slug", `%${slug.split("-").slice(0, -1).join("-")}%`)
      .limit(1)
      .single();
    if (data?.hex) {
      return NextResponse.json(
        { hex: data.hex },
        { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" } }
      );
    }
  }

  if (!color) {
    return NextResponse.json({ hex: null }, { status: 404 });
  }

  return NextResponse.json(
    { hex: color.hex },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" } }
  );
}

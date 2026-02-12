import { NextRequest, NextResponse } from "next/server";
import { getAllColorSlugs, getAllBrands, getAllColorFamilies } from "@/lib/queries";
import { getAllBlogSlugs, getPostBySlug } from "@/lib/blog-posts";
import { inspirationPalettes } from "@/lib/palettes";

const BASE_URL = "https://www.paintcolorhq.com";
const URLS_PER_SITEMAP = 5000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  try {
    const [colorSlugs, brands, families] = await Promise.all([
      getAllColorSlugs(),
      getAllBrands(),
      getAllColorFamilies(),
    ]);

    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "weekly", lastmod: "" },
      { url: "/brands", priority: "0.8", changefreq: "weekly", lastmod: "" },
      { url: "/colors", priority: "0.8", changefreq: "weekly", lastmod: "" },
      { url: "/search", priority: "0.7", changefreq: "monthly", lastmod: "" },
      { url: "/compare", priority: "0.6", changefreq: "monthly", lastmod: "" },
      { url: "/blog", priority: "0.7", changefreq: "weekly", lastmod: "" },
      { url: "/inspiration", priority: "0.7", changefreq: "weekly", lastmod: "" },
      { url: "/tools", priority: "0.7", changefreq: "monthly", lastmod: "" },
      { url: "/tools/paint-calculator", priority: "0.7", changefreq: "monthly", lastmod: "" },
      { url: "/tools/color-identifier", priority: "0.7", changefreq: "monthly", lastmod: "" },
      { url: "/tools/room-visualizer", priority: "0.7", changefreq: "monthly", lastmod: "" },
      { url: "/tools/palette-generator", priority: "0.7", changefreq: "monthly", lastmod: "" },
    ];

    const brandPages = brands.map((b) => ({
      url: `/brands/${b.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: "",
    }));

    const familyPages = families.map((f) => ({
      url: `/colors/family/${f.slug}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: "",
    }));

    const colorPages = colorSlugs.map((c) => ({
      url: `/colors/${c.brandSlug}/${c.colorSlug}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: "",
    }));

    const blogPages = getAllBlogSlugs().map((s) => ({
      url: `/blog/${s}`,
      priority: "0.7",
      changefreq: "monthly",
      lastmod: getPostBySlug(s)?.date ?? "",
    }));

    const inspirationPages = inspirationPalettes.map((p) => ({
      url: `/inspiration/${p.slug}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: "",
    }));

    const allUrls = [...staticPages, ...brandPages, ...familyPages, ...colorPages, ...blogPages, ...inspirationPages];
    const start = id * URLS_PER_SITEMAP;
    const pageUrls = allUrls.slice(start, start + URLS_PER_SITEMAP);

    if (pageUrls.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pageUrls
  .map(
    (entry) => `  <url>
    <loc>${BASE_URL}${entry.url}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

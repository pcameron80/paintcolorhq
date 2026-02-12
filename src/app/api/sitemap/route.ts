import { NextResponse } from "next/server";
import { getAllColorSlugs, getAllBrands, getAllColorFamilies } from "@/lib/queries";
import { getAllBlogSlugs } from "@/lib/blog-posts";
import { inspirationPalettes } from "@/lib/palettes";

const BASE_URL = "https://www.paintcolorhq.com";
const URLS_PER_SITEMAP = 5000;

export async function GET() {
  try {
    const [colorSlugs, brands, families] = await Promise.all([
      getAllColorSlugs(),
      getAllBrands(),
      getAllColorFamilies(),
    ]);

    // Count total URLs
    const staticPages = [
      "/",
      "/brands",
      "/colors",
      "/search",
      "/compare",
      "/blog",
      "/inspiration",
      "/privacy",
      "/terms",
    ];

    const brandPages = brands.map((b) => `/brands/${b.slug}`);
    const familyPages = families.map((f) => `/colors/family/${f.slug}`);
    const colorPages = colorSlugs.map(
      (c) => `/colors/${c.brandSlug}/${c.colorSlug}`
    );
    const blogPages = getAllBlogSlugs().map((s) => `/blog/${s}`);
    const inspirationPages = inspirationPalettes.map((p) => `/inspiration/${p.slug}`);

    const allUrls = [...staticPages, ...brandPages, ...familyPages, ...colorPages, ...blogPages, ...inspirationPages];
    const totalSitemaps = Math.ceil(allUrls.length / URLS_PER_SITEMAP);

    // Generate sitemap index
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: totalSitemaps }, (_, i) =>
  `  <sitemap>
    <loc>${BASE_URL}/sitemap/${i}.xml</loc>
  </sitemap>`
).join("\n")}
</sitemapindex>`;

    return new NextResponse(sitemapIndex, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    // Return minimal sitemap if DB not available
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap/0.xml</loc>
  </sitemap>
</sitemapindex>`;

    return new NextResponse(fallback, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}

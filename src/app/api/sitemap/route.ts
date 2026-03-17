import { NextResponse } from "next/server";
import { getAllColorSlugs } from "@/lib/queries";
import { getAllBlogSlugs } from "@/lib/blog-posts";

const BASE_URL = "https://www.paintcolorhq.com";
const COLORS_PER_SITEMAP = 5000;
// All 14 brands now included — Google is indexing 13.5k pages (2.6x the old
// 5-brand sitemap). Domain authority supports full coverage as of March 2026.

export async function GET() {
  try {
    const colorSlugs = await getAllColorSlugs();
    const totalColorSitemaps = Math.ceil(colorSlugs.length / COLORS_PER_SITEMAP);

    // Build list of named sub-sitemaps
    const sitemapNames: string[] = [
      "pages",
      "brands",
      "matches",
      ...Array.from({ length: totalColorSitemaps }, (_, i) => `colors-${i}`),
      "blog",
      "families",
      "inspiration",
    ];

    // Only include blog sitemap if there are blog posts
    const blogSlugs = getAllBlogSlugs();
    if (blogSlugs.length === 0) {
      const idx = sitemapNames.indexOf("blog");
      if (idx !== -1) sitemapNames.splice(idx, 1);
    }

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapNames
  .map(
    (name) => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${name}.xml</loc>
  </sitemap>`
  )
  .join("\n")}
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
    <loc>${BASE_URL}/sitemap/pages.xml</loc>
  </sitemap>
</sitemapindex>`;

    return new NextResponse(fallback, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}

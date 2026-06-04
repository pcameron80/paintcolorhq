import { NextResponse } from "next/server";
import { getAllColorSlugs } from "@/lib/queries";
import { getAllBlogSlugs, getAllPosts } from "@/lib/blog-posts";

// ISR: refresh hourly so a scheduled post enters the sitemap index on its date.
export const revalidate = 3600;

const BASE_URL = "https://www.paintcolorhq.com";
const COLORS_PER_SITEMAP = 5000;

// Build-time deploy date (frozen via next.config.ts `env`) — index lastmod for
// static shards, so it doesn't reset to "today" each ISR cycle (false freshness).
const SITE_BUILD_DATE =
  process.env.SITE_BUILD_DATE ?? new Date().toISOString().split("T")[0];

export async function GET() {
  try {
    const colorSlugs = await getAllColorSlugs();
    const totalColorSitemaps = Math.ceil(colorSlugs.length / COLORS_PER_SITEMAP);

    const sitemapNames: string[] = [
      "pages",
      "brands",
      "matches",
      "match-individual",
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

    // The blog shard's lastmod is the most-recent live post date (real
    // freshness); every other shard uses the frozen deploy date.
    const livePosts = getAllPosts();
    const blogLastmod =
      livePosts.length > 0
        ? livePosts.map((p) => p.date).sort().at(-1)!
        : SITE_BUILD_DATE;
    const lastmodFor = (name: string) => (name === "blog" ? blogLastmod : SITE_BUILD_DATE);

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapNames
  .map(
    (name) => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${name}.xml</loc>
    <lastmod>${lastmodFor(name)}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

    return new NextResponse(sitemapIndex, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
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

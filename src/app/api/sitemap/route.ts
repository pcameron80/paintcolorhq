import { NextResponse } from "next/server";
import sitemapSnapshot from "@/generated/sitemap.json";
import { getAllBlogSlugs, getPostBySlug } from "@/lib/blog-posts";
import { MATCH_TEMPLATE_DATE, colorLastmod, latestDate, matchLastmod } from "@/lib/content-dates";

// ISR: refresh hourly so a scheduled post enters the sitemap index on its date.
export const revalidate = 3600;

const BASE_URL = "https://www.paintcolorhq.com";
const COLORS_PER_SITEMAP = 5000;

export async function GET() {
  try {
    const colorSlugs = sitemapSnapshot.colors;
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

    // Index lastmod is the newest lastmod inside the shard, computed from the
    // same content dates the shard itself emits. Shards without real content
    // dates (pages, brands, families, inspiration) omit it: a build date would
    // move on every deploy without the content moving.
    const lastmods = new Map<string, string>();
    for (let i = 0; i < totalColorSitemaps; i++) {
      const slice = colorSlugs.slice(i * COLORS_PER_SITEMAP, (i + 1) * COLORS_PER_SITEMAP);
      lastmods.set(`colors-${i}`, latestDate(...slice.map(colorLastmod)));
    }
    const matchUpdatedAt: Record<string, string> = sitemapSnapshot.matchUpdatedAt ?? {};
    if (sitemapSnapshot.matches.length > 0) {
      lastmods.set("match-individual", latestDate(...sitemapSnapshot.matches.map((url) => matchLastmod(url, matchUpdatedAt))));
    }
    lastmods.set("matches", MATCH_TEMPLATE_DATE);
    // Same posts and dates as the blog shard: indexable live posts, modifiedDate over date.
    const blogLastmod = latestDate(...blogSlugs.map((s) => {
      const post = getPostBySlug(s);
      return post?.modifiedDate ?? post?.date;
    }));
    if (blogLastmod) lastmods.set("blog", blogLastmod);

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapNames
  .map(
    (name) => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${name}.xml</loc>${lastmods.get(name) ? `\n    <lastmod>${lastmods.get(name)}</lastmod>` : ""}
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

    return new NextResponse(sitemapIndex, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control":
          "public, max-age=0, s-maxage=3600",
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

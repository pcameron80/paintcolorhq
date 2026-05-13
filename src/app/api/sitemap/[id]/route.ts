import { NextRequest, NextResponse } from "next/server";
import { getAllColorSlugs, getAllBrands, getAllColorFamilies } from "@/lib/queries";
import { getAllBlogSlugs, getPostBySlug } from "@/lib/blog-posts";
import { inspirationPalettes } from "@/lib/palettes";

const BASE_URL = "https://www.paintcolorhq.com";
const COLORS_PER_SITEMAP = 5000;

// Build-time date used as the default lastmod for sitemap entries whose
// content doesn't have a per-row timestamp (brands, colors, families,
// matches, inspiration). Evaluated at module load — for serverless cold
// starts this is effectively "deploy time," which is what we want
// Googlebot to see as the recency signal. Blog posts use their own
// post.date and override this.
const SITE_BUILD_DATE = new Date().toISOString().split("T")[0];

interface SitemapEntry {
  url: string;
  lastmod: string;
}

// Google ignores <changefreq> and <priority>, so they're omitted. Only
// <loc> and <lastmod> are emitted per URL.
function buildSitemapXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${BASE_URL}${entry.url}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let entries: SitemapEntry[];

    if (id === "pages") {
      entries = [
        { url: "/", lastmod: SITE_BUILD_DATE },
        { url: "/brands", lastmod: SITE_BUILD_DATE },
        { url: "/colors", lastmod: SITE_BUILD_DATE },
        { url: "/search", lastmod: SITE_BUILD_DATE },
        { url: "/compare", lastmod: SITE_BUILD_DATE },
        { url: "/blog", lastmod: SITE_BUILD_DATE },
        { url: "/inspiration", lastmod: SITE_BUILD_DATE },
        { url: "/tools", lastmod: SITE_BUILD_DATE },
        { url: "/tools/paint-calculator", lastmod: SITE_BUILD_DATE },
        { url: "/tools/color-identifier", lastmod: SITE_BUILD_DATE },
        { url: "/tools/room-visualizer", lastmod: SITE_BUILD_DATE },
        { url: "/tools/palette-generator", lastmod: SITE_BUILD_DATE },
        { url: "/about", lastmod: SITE_BUILD_DATE },
        { url: "/contact", lastmod: SITE_BUILD_DATE },
        { url: "/faq", lastmod: SITE_BUILD_DATE },
        { url: "/privacy", lastmod: SITE_BUILD_DATE },
        { url: "/terms", lastmod: SITE_BUILD_DATE },
        { url: "/authors/paint-color-hq-staff", lastmod: SITE_BUILD_DATE },
      ];
    } else if (id === "brands") {
      const brands = await getAllBrands();
      entries = brands.map((b) => ({
        url: `/brands/${b.slug}`,
        lastmod: SITE_BUILD_DATE,
      }));
    } else if (id.startsWith("colors-")) {
      const pageNum = Number(id.slice("colors-".length));
      if (isNaN(pageNum) || pageNum < 0) {
        return new NextResponse("Not found", { status: 404 });
      }
      const colorSlugs = await getAllColorSlugs();
      const start = pageNum * COLORS_PER_SITEMAP;
      const pageColors = colorSlugs.slice(start, start + COLORS_PER_SITEMAP);
      if (pageColors.length === 0) {
        return new NextResponse("Not found", { status: 404 });
      }
      entries = pageColors.map((c) => ({
        url: `/colors/${c.brandSlug}/${c.colorSlug}`,
        lastmod: SITE_BUILD_DATE,
      }));
    } else if (id === "matches") {
      // Brand-to-brand match landing pages — only major brand combinations
      const MAJOR_MATCH_BRANDS = ["sherwin-williams", "benjamin-moore", "behr", "ppg", "valspar"];
      entries = [];
      for (const source of MAJOR_MATCH_BRANDS) {
        for (const target of MAJOR_MATCH_BRANDS) {
          if (source !== target) {
            entries.push({
              url: `/match/${source}/to/${target}`,
              lastmod: SITE_BUILD_DATE,
            });
          }
        }
      }
    } else if (id === "blog") {
      entries = getAllBlogSlugs().map((s) => {
        const post = getPostBySlug(s);
        return {
          url: `/blog/${s}`,
          // Prefer modifiedDate, fall back to date, fall back to build date
          lastmod: post?.modifiedDate ?? post?.date ?? SITE_BUILD_DATE,
        };
      });
    } else if (id === "families") {
      const families = await getAllColorFamilies();
      entries = families.map((f) => ({
        url: `/colors/family/${f.slug}`,
        lastmod: SITE_BUILD_DATE,
      }));
    } else if (id === "inspiration") {
      entries = inspirationPalettes.map((p) => ({
        url: `/inspiration/${p.slug}`,
        lastmod: SITE_BUILD_DATE,
      }));
    } else {
      return new NextResponse("Not found", { status: 404 });
    }

    if (entries.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(buildSitemapXml(entries), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

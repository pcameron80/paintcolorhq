import { NextRequest, NextResponse } from "next/server";
import { getAllColorSlugs, getAllBrands, getAllColorFamilies } from "@/lib/queries";
import { getAllBlogSlugs, getPostBySlug } from "@/lib/blog-posts";
import { inspirationPalettes } from "@/lib/palettes";

const BASE_URL = "https://www.paintcolorhq.com";
const COLORS_PER_SITEMAP = 5000;

interface SitemapEntry {
  url: string;
  priority: string;
  changefreq: string;
  lastmod: string;
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${BASE_URL}${entry.url}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
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
        { url: "/about", priority: "0.5", changefreq: "monthly", lastmod: "" },
        { url: "/contact", priority: "0.5", changefreq: "monthly", lastmod: "" },
        { url: "/faq", priority: "0.7", changefreq: "monthly", lastmod: "" },
        { url: "/privacy", priority: "0.3", changefreq: "monthly", lastmod: "" },
        { url: "/terms", priority: "0.3", changefreq: "monthly", lastmod: "" },
      ];
    } else if (id === "brands") {
      const brands = await getAllBrands();
      entries = brands.map((b) => ({
        url: `/brands/${b.slug}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: "",
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
        priority: "0.6",
        changefreq: "monthly",
        lastmod: "",
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
              priority: "0.8",
              changefreq: "weekly",
              lastmod: "",
            });
          }
        }
      }
    } else if (id === "blog") {
      entries = getAllBlogSlugs().map((s) => ({
        url: `/blog/${s}`,
        priority: "0.7",
        changefreq: "monthly",
        lastmod: getPostBySlug(s)?.date ?? "",
      }));
    } else if (id === "families") {
      const families = await getAllColorFamilies();
      entries = families.map((f) => ({
        url: `/colors/family/${f.slug}`,
        priority: "0.7",
        changefreq: "weekly",
        lastmod: "",
      }));
    } else if (id === "inspiration") {
      entries = inspirationPalettes.map((p) => ({
        url: `/inspiration/${p.slug}`,
        priority: "0.6",
        changefreq: "weekly",
        lastmod: "",
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
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

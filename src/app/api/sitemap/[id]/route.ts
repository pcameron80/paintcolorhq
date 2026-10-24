import { HUE_BAND_SLUGS } from "@/lib/hue-bands";
import { getBrandContent } from "@/lib/brand-content";
import sitemapSnapshot from "@/generated/sitemap.json";
import { NextRequest, NextResponse } from "next/server";
import { getAllBrands, getAllColorFamilies, getLatestColorDateByBrand, getLatestColorDateByFamily } from "@/lib/queries";
import { getAllBlogSlugs, getPostBySlug } from "@/lib/blog-posts";
import { inspirationPalettes } from "@/lib/palettes";
import { MAJOR_MATCH_BRANDS } from "@/lib/popular-colors";
import { COTY_HUB_DATES } from "@/lib/color-of-the-year";
import { API_DOCS_DATE, MATCH_TEMPLATE_DATE, colorLastmod, matchLastmod } from "@/lib/content-dates";

// ISR: refresh hourly so a scheduled post enters its sitemap shard on its date.
export const revalidate = 3600;

const BASE_URL = "https://www.paintcolorhq.com";
const COLORS_PER_SITEMAP = 5000;

// Omit lastmod when the actual content modification date is unknown.
const NO_LASTMOD = "";

interface SitemapEntry {
  url: string;
  lastmod: string;
}

// Google ignores <changefreq> and <priority>, so they're omitted. Only
// <loc> and <lastmod> are emitted per URL.
function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${BASE_URL}${escapeXml(entry.url)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}
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
        { url: "/", lastmod: NO_LASTMOD },
        { url: "/brands", lastmod: NO_LASTMOD },
        { url: "/colors", lastmod: NO_LASTMOD },
        { url: "/search", lastmod: NO_LASTMOD },
        { url: "/match", lastmod: NO_LASTMOD },
        { url: "/compare", lastmod: NO_LASTMOD },
        { url: "/api", lastmod: API_DOCS_DATE },
        { url: "/blog", lastmod: NO_LASTMOD },
        { url: "/inspiration", lastmod: NO_LASTMOD },
        { url: "/discontinued", lastmod: NO_LASTMOD },
        { url: "/color-of-the-year", lastmod: COTY_HUB_DATES.updated },
        { url: "/paint-color-statistics", lastmod: NO_LASTMOD },
        { url: "/tools", lastmod: NO_LASTMOD },
        { url: "/tools/paint-calculator", lastmod: NO_LASTMOD },
        { url: "/tools/color-identifier", lastmod: NO_LASTMOD },
        { url: "/tools/room-visualizer", lastmod: NO_LASTMOD },
        { url: "/tools/palette-generator", lastmod: NO_LASTMOD },
        { url: "/tools/hex-to-paint-color", lastmod: NO_LASTMOD },
        { url: "/tools/lrv-finder", lastmod: NO_LASTMOD },
        { url: "/about", lastmod: NO_LASTMOD },
        { url: "/methodology", lastmod: NO_LASTMOD },
        { url: "/embed", lastmod: NO_LASTMOD },
        { url: "/contact", lastmod: NO_LASTMOD },
        { url: "/faq", lastmod: NO_LASTMOD },
        { url: "/privacy", lastmod: NO_LASTMOD },
        { url: "/terms", lastmod: NO_LASTMOD },
        { url: "/authors/paint-color-hq-staff", lastmod: NO_LASTMOD },
      ];
    } else if (id === "brands") {
      const [brands, latestByBrand] = await Promise.all([getAllBrands(), getLatestColorDateByBrand()]);
      entries = brands.filter((b) => getBrandContent(b.slug)).map((b) => ({
        url: `/brands/${b.slug}`,
        // Brand lastmod = newest color insertion date for this brand.
        // Real "latest activity" signal per brand instead of a uniform build date.
        lastmod: latestByBrand.get(b.slug) ?? NO_LASTMOD,
      }));
    } else if (id.startsWith("colors-")) {
      const pageNum = Number(id.slice("colors-".length));
      if (!/^colors-\d+$/.test(id) || !Number.isSafeInteger(pageNum) || pageNum < 0) {
        return new NextResponse("Not found", { status: 404 });
      }
      const colorSlugs = sitemapSnapshot.colors;
      const start = pageNum * COLORS_PER_SITEMAP;
      const pageColors = colorSlugs.slice(start, start + COLORS_PER_SITEMAP);
      if (pageColors.length === 0) {
        return new NextResponse("Not found", { status: 404 });
      }
      entries = pageColors.map((c) => ({
        url: `/colors/${c.brandSlug}/${c.colorSlug}`,
        lastmod: colorLastmod(c),
      }));
    } else if (id === "matches") {
      // Brand-to-brand match landing pages — only major brand combinations
      entries = [];
      for (const source of MAJOR_MATCH_BRANDS) {
        for (const target of MAJOR_MATCH_BRANDS) {
          if (source !== target) {
            entries.push({
              url: `/match/${source}/to/${target}`,
              lastmod: MATCH_TEMPLATE_DATE,
            });
          }
        }
      }
    } else if (id === "match-individual") {
      const matchUpdatedAt: Record<string, string> = sitemapSnapshot.matchUpdatedAt ?? {};
      entries = sitemapSnapshot.matches.map((url) => ({ url, lastmod: matchLastmod(url, matchUpdatedAt) }));
    } else if (id === "blog") {
      entries = getAllBlogSlugs().map((s) => {
        const post = getPostBySlug(s);
        return {
          url: `/blog/${s}`,
          // Prefer modifiedDate, fall back to date, else omit lastmod
          lastmod: post?.modifiedDate ?? post?.date ?? NO_LASTMOD,
        };
      });
    } else if (id === "families") {
      const [families, latestByFamily] = await Promise.all([getAllColorFamilies(), getLatestColorDateByFamily()]);
      entries = families.map((f) => ({
        url: `/colors/family/${f.slug}`,
        lastmod: latestByFamily.get(f.slug) ?? NO_LASTMOD,
      }));
      // Blended-hue collections (blue gray, blue green, rust).
      entries.push(...HUE_BAND_SLUGS.map((slug) => ({ url: `/colors/hue/${slug}`, lastmod: NO_LASTMOD })));
    } else if (id === "inspiration") {
      entries = inspirationPalettes.map((p) => ({
        url: `/inspiration/${p.slug}`,
        lastmod: NO_LASTMOD,
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
          "public, max-age=0, s-maxage=3600",
      },
    });
  } catch {
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

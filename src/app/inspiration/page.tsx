import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { inspirationPalettes } from "@/lib/palettes";
import { findClosestColor } from "@/lib/queries";
import type { ColorWithBrand } from "@/lib/types";
import { ogDefaults } from "@/lib/og";
import { urbanist } from "@/lib/redesign-font";
import "../redesign.css";

export const revalidate = 604800; // 7d — static index page

export const metadata: Metadata = {
  title: "Color Inspiration",
  description: `Browse ${inspirationPalettes.length} curated color palettes for every style: modern farmhouse, coastal retreat, moody library, and more. Each palette maps to real paint colors.`,
  alternates: { canonical: "https://www.paintcolorhq.com/inspiration" },
  openGraph: { ...ogDefaults, title: "Color Inspiration | Paint Color HQ", description: "Browse curated color palettes for every style.", url: "https://www.paintcolorhq.com/inspiration" },
};

interface ResolvedPalette {
  name: string; slug: string; description: string;
  swatches: { paletteHex: string; match: ColorWithBrand | null }[];
}

async function resolveAll(): Promise<ResolvedPalette[]> {
  const allHexes = new Set<string>();
  for (const p of inspirationPalettes) for (const hex of p.colors) allHexes.add(hex);
  const hexList = [...allHexes];
  const results = await Promise.all(hexList.map((hex) => findClosestColor(hex)));
  const resolved = new Map<string, ColorWithBrand | null>();
  hexList.forEach((hex, i) => resolved.set(hex, results[i]));
  return inspirationPalettes.map((p) => ({
    name: p.name, slug: p.slug, description: p.description,
    swatches: p.colors.map((hex) => ({ paletteHex: hex, match: resolved.get(hex) ?? null })),
  }));
}

// JSON-LD helper — content is server-generated from trusted static data only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function InspirationPage() {
  const palettes = await resolveAll();

  return (
    <div className={`min-h-screen bg-surface ${urbanist.variable}`}>
      <Header />
      <main id="main-content" className="pch-page">

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage",
        name: "Paint Color Palettes & Inspiration",
        description: "Curated paint color palettes for every style.",
        url: "https://www.paintcolorhq.com/inspiration",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: palettes.length,
          itemListElement: palettes.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, description: p.description, url: `https://www.paintcolorhq.com/inspiration/${p.slug}` })),
        },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Inspiration", item: "https://www.paintcolorhq.com/inspiration" },
        ],
      }} />

      <section className="pch-pagehead">
        <div className="wrap pch-wrap pch-grid pch-pagehead__grid">
          <div className="pch-pagehead__text">
            <nav className="pch-crumbs" aria-label="Breadcrumb" style={{ marginBottom: 0 }}>
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Inspiration</span>
            </nav>
            <span className="pch-eyebrow">The Studio Lookbook</span>
            <h1 style={{ maxWidth: "none" }}>
              Color Palettes &amp;<br />Inspiration
            </h1>
            <p className="pch-pagehead__lead">
              {palettes.length} curated palettes to spark your next project: each mapped to real paint colors you can buy.
            </p>
          </div>
          <div className="pch-pagehead__art" aria-hidden="true" style={{ display: "grid", gap: 8 }}>
            {palettes.slice(0, 3).map((palette) => (
              <div key={palette.slug} style={{ display: "grid", gridTemplateColumns: `repeat(${palette.swatches.length}, 1fr)`, height: 56, borderRadius: 12, overflow: "hidden" }}>
                {palette.swatches.map((swatch, i) => (
                  <div key={i} style={{ backgroundColor: swatch.match?.hex ?? swatch.paletteHex }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pch-block pch-block--surface">
        <div className="wrap pch-wrap">
          <div className="pch-cards">
            {palettes.map((palette) => (
              <Link key={palette.slug} href={`/inspiration/${palette.slug}`} className="pch-card pch-cardlink" style={{ padding: "var(--s-3)", gap: "var(--s-3)" }}>
                <div className="pch-art" style={{ display: "grid", gridTemplateColumns: `repeat(${palette.swatches.length}, 1fr)`, height: 144 }}>
                  {palette.swatches.map((swatch, i) => (
                    <div key={i} style={{ backgroundColor: swatch.match?.hex ?? swatch.paletteHex }} />
                  ))}
                </div>
                <div style={{ display: "grid", gap: "var(--s-1)", padding: "0 var(--s-2) var(--s-2)" }}>
                  <h2>{palette.name}</h2>
                  <p className="pch-note">{palette.swatches.length} Swatches</p>
                  <p>{palette.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { inspirationPalettes } from "@/lib/palettes";
import { findClosestColor } from "@/lib/queries";
import type { ColorWithBrand } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Color Inspiration",
  description: "Browse 18 curated color palettes for every style — modern farmhouse, coastal retreat, moody library, and more. Each palette maps to real paint colors.",
  alternates: { canonical: "https://www.paintcolorhq.com/inspiration" },
  openGraph: { title: "Color Inspiration | Paint Color HQ", description: "Browse curated color palettes for every style.", url: "https://www.paintcolorhq.com/inspiration" },
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
    <div className="min-h-screen bg-surface">
      <Header />

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

      {/* Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">Inspiration</span>
          </nav>
          <span className="text-primary font-bold text-xs uppercase tracking-widest">The Studio Lookbook</span>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-6">
            Color Palettes &amp;<br />Inspiration
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            {palettes.length} curated palettes to spark your next project — each mapped to real paint colors you can buy.
          </p>
        </div>
      </section>

      {/* Palette Grid */}
      <section className="px-6 md:px-12 py-24 bg-tertiary-fixed">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {palettes.map((palette) => (
              <Link
                key={palette.slug}
                href={`/inspiration/${palette.slug}`}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden hover:shadow-lg transition-all duration-500 group"
              >
                <div className="h-48" style={{ display: "grid", gridTemplateColumns: `repeat(${palette.swatches.length}, 1fr)` }}>
                  {palette.swatches.map((swatch, i) => (
                    <div key={i} style={{ backgroundColor: swatch.match?.hex ?? swatch.paletteHex }} />
                  ))}
                </div>
                <div className="p-6">
                  <h2 className="font-headline font-bold text-lg text-on-surface mb-1 group-hover:text-primary transition-colors">
                    {palette.name}
                  </h2>
                  <p className="text-xs text-outline tracking-wider uppercase mb-3">
                    {palette.swatches.length} Swatches
                  </p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {palette.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

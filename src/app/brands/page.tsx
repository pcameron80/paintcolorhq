import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { getAllBrands, getColorsByBrand } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Paint Brand Directory — 14 Brands, 25,000+ Colors",
  description:
    "Browse all 14 paint brands on Paint Color HQ, including Sherwin-Williams, Benjamin Moore, Behr, PPG, Valspar, and Farrow & Ball. Explore 25,000+ colors with cross-brand matches.",
  alternates: { canonical: "https://www.paintcolorhq.com/brands" },
  openGraph: {
    title: "Paint Brands",
    description: "Browse paint colors from top brands including Sherwin-Williams, Benjamin Moore, Behr, PPG, and more.",
    url: "https://www.paintcolorhq.com/brands",
  },
};

const brandMeta: Record<string, { tagline: string }> = {
  "sherwin-williams": { tagline: "America's largest paint company with 4,000+ stores" },
  "benjamin-moore": { tagline: "Premium paints with Gennex color technology" },
  behr: { tagline: "Available exclusively at The Home Depot" },
  ppg: { tagline: "Professional-grade paints for every surface" },
  valspar: { tagline: "Available at Lowe's with 1,000+ colors" },
  "dunn-edwards": { tagline: "West Coast favorite with low-VOC formulas" },
  "farrow-ball": { tagline: "Richly pigmented paints crafted in England since 1946" },
  kilz: { tagline: "Known for primers and specialty coatings" },
  "vista-paint": { tagline: "California-based with contractor-grade quality" },
  hirshfields: { tagline: "Upper Midwest's premium paint retailer" },
  colorhouse: { tagline: "Portland-based, sustainable paint company" },
  "dutch-boy": { tagline: "Accessible quality since 1907" },
  ral: { tagline: "European industrial color standard since 1927" },
  mpc: { tagline: "Master Paint Collection colors" },
};

export default async function BrandsPage() {
  const brands = await getAllBrands();

  // Split into major (top 7 by color count) and others
  const sorted = [...brands].sort((a, b) => b.color_count - a.color_count);
  const major = sorted.slice(0, 7);
  const others = sorted.slice(7);

  // Fetch sample colors for major brands (6 diverse colors each)
  const brandSamples = await Promise.all(
    major.map(async (brand) => {
      // Get a spread of colors across families for variety
      const colors = await getColorsByBrand(brand.id, { limit: 6 });
      return { brandId: brand.id, colors };
    })
  );
  const sampleMap = new Map(brandSamples.map((s) => [s.brandId, s.colors]));

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">Brands</span>
          </nav>
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Directory</span>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-6">
            Paint Brands
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Browse {brands.reduce((sum, b) => sum + b.color_count, 0).toLocaleString()} colors across {brands.length} trusted paint manufacturers.
          </p>
        </div>
      </section>

      {/* Major Brands */}
      <section className="px-6 md:px-12 py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Major Brands</h2>
            <div className="bg-primary h-1 w-12 mt-4" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {major.map((brand) => {
              const meta = brandMeta[brand.slug];
              return (
                <div
                  key={brand.id}
                  className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500"
                >
                  <Link href={`/brands/${brand.slug}`}>
                    <h3 className="font-headline text-2xl font-extrabold text-on-surface group-hover:text-primary transition-colors">
                      {brand.name}
                    </h3>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-outline">
                      {brand.color_count.toLocaleString()} colors
                    </p>
                    {meta && (
                      <p className="mt-4 text-sm text-on-surface-variant leading-relaxed">
                        {meta.tagline}
                      </p>
                    )}
                  </Link>
                  {/* Color swatch strip */}
                  {(() => {
                    const samples = sampleMap.get(brand.id) ?? [];
                    if (samples.length === 0) return null;
                    return (
                      <div className="flex gap-1.5 mt-5">
                        {samples.map((c) => (
                          <Link
                            key={c.id}
                            href={`/colors/${brand.slug}/${c.slug}`}
                            className="block w-8 h-8 rounded-md shadow-sm hover:scale-110 hover:shadow-md transition-transform relative group/swatch"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/swatch:opacity-100 transition-opacity text-[9px] font-mono bg-surface-container-lowest text-on-surface-variant px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
                              {c.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    );
                  })()}
                  <Link href={`/brands/${brand.slug}`} className="mt-6 text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Explore colors <span>&rarr;</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Other Brands */}
      {others.length > 0 && (
        <section className="px-6 md:px-12 py-20 bg-surface">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-8">More Brands</h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {others.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.slug}`}
                  className="group flex flex-col items-center justify-center p-8 bg-surface-container-lowest rounded-xl hover:shadow-lg transition-all duration-500"
                >
                  <span className="font-headline font-extrabold text-lg text-outline group-hover:text-primary transition-colors text-center">
                    {brand.name}
                  </span>
                  <span className="mt-2 text-[10px] uppercase tracking-widest text-outline">
                    {brand.color_count.toLocaleString()} colors
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Color CTA */}
      <section className="py-20 px-6 md:px-12 bg-tertiary-fixed">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-4">Prefer to browse by color?</h2>
          <p className="text-on-surface-variant mb-8 max-w-lg mx-auto">
            Explore colors organized by family — whites, grays, blues, greens, and more across all brands.
          </p>
          <Link
            href="/colors"
            className="inline-block bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-base shadow-lg shadow-primary/20"
          >
            Browse Color Families
          </Link>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { BrandColorLibrary } from "@/components/brand-color-library";
import { BrandColorLibraryFallback } from "@/components/brand-color-library-fallback";
import { getBrandBySlug, getColorsBySlugList, getColorsByBrand, getColorsByBrandCount, getAllBrands } from "@/lib/queries";
import { getBrandContent } from "@/lib/brand-content";
import { POPULAR_COLOR_SLUGS } from "@/lib/popular-colors";
import { AdSenseScript } from "@/components/adsense-script";
import { TrackPage } from "@/components/track-page";
import { ColorLinkEnhancer } from "@/components/color-link-enhancer";
import { getPostsByBrand } from "@/lib/blog-posts";
import Image from "next/image";

export const revalidate = 3600;

export async function generateStaticParams() {
  const brands = await getAllBrands();
  return brands.map((b) => ({ brandSlug: b.slug }));
}

interface PageProps {
  params: Promise<{ brandSlug: string }>;
}

// generateMetadata intentionally does NOT read searchParams — doing so
// opts the route into fully dynamic rendering. Filter/pagination URLs
// (?family=blue, ?page=2) share the same canonical URL and indexable
// metadata as the base; the canonical consolidates them server-side
// and the client component handles the filtered UI on hydration.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return { title: "Brand Not Found" };
  const count = brand.color_count.toLocaleString();
  const url = `https://www.paintcolorhq.com/brands/${brandSlug}`;
  // Lead with the head-query phrase ("[Brand] Paint Colors"). The unique
  // color count carries SERP differentiation against Behr.com / Home Depot.
  // Avoid "Vista Paint Paint Colors" doubling when the brand name already
  // contains "Paint".
  const brandHasPaintWord = /\bpaint(s)?\b/i.test(brand.name);
  const headerPhrase = brandHasPaintWord
    ? `${brand.name} Colors`
    : `${brand.name} Paint Colors`;
  const title = `${headerPhrase}: All ${count} Shades with Cross-Brand Matches`;
  // Pick 3 well-known compare brands different from the source.
  const compareTo = ["Sherwin-Williams", "Benjamin Moore", "Behr", "PPG"]
    .filter((b) => b !== brand.name)
    .slice(0, 3);
  const colorsWord = brandHasPaintWord ? "colors" : "paint colors";
  const description = `All ${count} ${brand.name} ${colorsWord} with hex codes, LRV values, and undertone tags. Side-by-side matches to ${compareTo.join(", ")}, and 10 more brands.`;
  const brandContent = getBrandContent(brandSlug);
  const shouldNoindex = !brandContent;
  return {
    title, description,
    alternates: { canonical: url },
    ...(shouldNoindex && { robots: { index: false, follow: true } }),
    openGraph: { title, description, url, images: [{ url: "/og-image.webp", width: 1200, height: 630 }] },
  };
}

const brandOrgData: Record<string, { foundingDate?: string; headquarters?: string; url?: string; sameAs?: string[] }> = {
  "sherwin-williams": { foundingDate: "1866", headquarters: "Cleveland, Ohio, USA", url: "https://www.sherwin-williams.com", sameAs: ["https://en.wikipedia.org/wiki/Sherwin-Williams"] },
  "benjamin-moore": { foundingDate: "1883", headquarters: "Montvale, New Jersey, USA", url: "https://www.benjaminmoore.com", sameAs: ["https://en.wikipedia.org/wiki/Benjamin_Moore_%26_Co."] },
  behr: { headquarters: "Santa Ana, California, USA", url: "https://www.behr.com", sameAs: ["https://en.wikipedia.org/wiki/Behr_Paint"] },
  ppg: { foundingDate: "1883", headquarters: "Pittsburgh, Pennsylvania, USA", url: "https://www.ppgpaints.com", sameAs: ["https://en.wikipedia.org/wiki/PPG_Industries"] },
  valspar: { headquarters: "Minneapolis, Minnesota, USA", url: "https://www.valspar.com", sameAs: ["https://en.wikipedia.org/wiki/Valspar"] },
  "dunn-edwards": { foundingDate: "1925", headquarters: "Los Angeles, California, USA", url: "https://www.dunnedwards.com" },
  "farrow-ball": { foundingDate: "1946", headquarters: "Dorset, England, UK", url: "https://www.farrow-ball.com", sameAs: ["https://en.wikipedia.org/wiki/Farrow_%26_Ball"] },
  kilz: { foundingDate: "1954", url: "https://www.kilz.com" },
  "vista-paint": { foundingDate: "1956", headquarters: "Fullerton, California, USA", url: "https://www.vistapaint.com" },
  hirshfields: { headquarters: "Minneapolis, Minnesota, USA", url: "https://www.hirshfields.com" },
  colorhouse: { foundingDate: "2005", headquarters: "Portland, Oregon, USA", url: "https://www.colorhousepaint.com" },
  "dutch-boy": { foundingDate: "1907", url: "https://www.dutchboy.com" },
  ral: { foundingDate: "1927", headquarters: "Bonn, Germany", url: "https://www.ral-farben.de" },
};

// JSON-LD helper — content is server-generated from trusted database values only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function BrandPage({ params }: PageProps) {
  const { brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const perPage = 60;

  // Server-rendered canonical: page 1, no filters. Filter and pagination
  // state lives in the client component (BrandColorLibrary) and refetches
  // via /api/brand/[brandSlug]/colors when URL params change.
  // Reading searchParams here would force the route into dynamic
  // rendering — see reference_searchparams-forces-dynamic.md memory note.
  const popularSlugsForBrand = POPULAR_COLOR_SLUGS
    .filter((p) => p.brandSlug === brandSlug)
    .map((p) => p.colorSlug);

  const [colors, totalCount, popularColors] = await Promise.all([
    getColorsByBrand(brand.id, { limit: perPage, offset: 0 }),
    getColorsByBrandCount(brand.id),
    // Single batched query replaces N parallel getColorBySlug round-trips
    // (audit perf finding from H2.2 PR #54). Up to 11 fewer DB hits per
    // brand-page render.
    getColorsBySlugList(brandSlug, popularSlugsForBrand),
  ]);

  const families: { name: string; hex: string; border?: boolean }[] = [
    { name: "white", hex: "#FFFFFF", border: true },
    { name: "off-white", hex: "#F5F0E8", border: true },
    { name: "gray", hex: "#9CA3AF" },
    { name: "beige", hex: "#D4C5A9" },
    { name: "neutral", hex: "#C7C1B7" },
    { name: "brown", hex: "#8B6914" },
    { name: "tan", hex: "#D2B48C" },
    { name: "red", hex: "#DC2626" },
    { name: "orange", hex: "#EA580C" },
    { name: "yellow", hex: "#EAB308" },
    { name: "green", hex: "#16A34A" },
    { name: "blue", hex: "#2563EB" },
    { name: "purple", hex: "#9333EA" },
    { name: "pink", hex: "#EC4899" },
    { name: "black", hex: "#1F2937" },
  ];

  const brandContent = getBrandContent(brand.slug);
  const subtitle = brandContent?.subtitle ?? `Browse every ${brand.name} color with undertone tags, LRV values, and cross-brand matches`;
  const orgData = brandOrgData[brand.slug];

  return (
    <div className="min-h-screen bg-surface">
      <TrackPage eventName="page_view_enriched" params={{ page_type: "brand", color_brand: brandSlug }} />
      <Header />

      {/* Brand Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <Link href="/brands" className="hover:text-primary transition-colors">Brands</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">{brand.name}</span>
          </nav>

          <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-4 block">
            {brand.color_count.toLocaleString()} Colors
            {orgData?.foundingDate && ` \u00B7 Est. ${orgData.foundingDate}`}
            {orgData?.headquarters && ` \u00B7 ${orgData.headquarters}`}
          </span>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mb-8">
            {brand.name}
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl mb-10 leading-relaxed">{subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="#colors" className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-base shadow-lg shadow-primary/20">
              Explore Colors
            </Link>
            {orgData?.url && (
              <a href={orgData.url} target="_blank" rel="noopener noreferrer" className="text-primary font-headline font-bold text-base flex items-center gap-2 px-8 py-4 hover:underline underline-offset-4">
                Visit {brand.name} <span>&rarr;</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Editorial Content */}
      {brandContent?.intro && (
        <section className="bg-tertiary-fixed py-20 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">About {brand.name}</h2>
              <div className="bg-primary h-1 w-12 mt-4" />
            </div>
            <div id="brand-intro" className="max-w-4xl text-on-surface-variant leading-relaxed">
              {brandContent.intro}
            </div>
            <ColorLinkEnhancer containerRef="brand-intro" />
          </div>
        </section>
      )}

      {/* Related Blog Posts */}
      {(() => {
        const brandPosts = getPostsByBrand(brand.name, 3);
        if (brandPosts.length === 0) return null;
        return (
          <section className="py-20 px-6 md:px-12 bg-surface">
            <div className="max-w-7xl mx-auto">
              <div className="mb-12 flex justify-between items-end">
                <div>
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">Insights</span>
                  <h2 className="font-headline text-3xl font-bold mt-2 text-on-surface">{brand.name} in The Color Journal</h2>
                </div>
                <Link href="/blog" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  All articles <span>&rarr;</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {brandPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group cursor-pointer">
                    <div className="aspect-[16/10] overflow-hidden rounded-lg mb-6">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          width={600}
                          height={375}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: post.coverColor }} />
                      )}
                    </div>
                    <h3 className="font-headline font-bold text-lg mb-3 leading-tight group-hover:text-primary transition-colors text-on-surface">
                      {post.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {post.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Popular Colors — featured above the paginated grid on page 1.
          Promotes the curated POPULAR_COLOR_SLUGS subset with explicit
          brand-page link signal, not just generateStaticParams pre-render. */}
      {popularColors.length > 0 && (
        <section className="py-16 px-6 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">
              Most Popular {brand.name} Colors
            </h2>
            <p className="text-on-surface-variant mb-8">
              The {popularColors.length} {brand.name} colors most-searched on Paint Color HQ — verified bestsellers based on cross-brand match volume.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {popularColors.map((c) => (
                <ColorCard key={c.id} name={c.name} hex={c.hex} brandName={brand.name} brandSlug={brandSlug} colorSlug={c.slug} colorNumber={c.color_number} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Color Library \u2014 Suspense-wrapped client component handles filter +
          pagination via URL params. Server renders the canonical page-1
          unfiltered state via BrandColorLibraryFallback so the route stays
          ISR-cacheable. Same pattern as the family-page refactor. */}
      <section id="colors" className="py-24 px-6 md:px-12 bg-surface-container-low scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <BrandColorLibraryFallback
                brandSlug={brandSlug}
                brandName={brand.name}
                families={families}
                initialColors={colors}
                initialTotalCount={totalCount}
              />
            }
          >
            <BrandColorLibrary
              brandSlug={brandSlug}
              brandName={brand.name}
              families={families}
              initialColors={colors}
              initialTotalCount={totalCount}
            />
          </Suspense>
        </div>
      </section>

      {/* Popular Colors / Brand Details */}
      {brandContent?.details && (
        <section className="py-16 px-6 md:px-12 bg-tertiary-fixed">
          <div className="max-w-7xl mx-auto">
            <div id="brand-details" className="max-w-4xl text-on-surface-variant">
              {brandContent.details}
            </div>
            <ColorLinkEnhancer containerRef="brand-details" />
          </div>
        </section>
      )}

      {/* Cross-Brand Matching */}
      {(() => {
        const majorBrands = [
          { slug: "sherwin-williams", name: "Sherwin-Williams" },
          { slug: "benjamin-moore", name: "Benjamin Moore" },
          { slug: "behr", name: "Behr" },
          { slug: "ppg", name: "PPG" },
          { slug: "valspar", name: "Valspar" },
        ];
        const targets = majorBrands.filter((b) => b.slug !== brandSlug).slice(0, 5);
        if (targets.length === 0) return null;
        return (
          <section className="py-20 px-6 md:px-12 bg-surface">
            <div className="max-w-7xl mx-auto">
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">Cross-Brand Matching</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Find equivalent colors from {brand.name} in other major paint brands.</p>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {targets.map((target) => (
                  <Link key={target.slug} href={`/match/${brandSlug}/to/${target.slug}`}
                    className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
                    <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{brand.name} to {target.name}</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">View equivalent colors</p>
                    <span className="mt-4 text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Explore <span>&rarr;</span></span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* JSON-LD */}
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage",
        name: `${brand.name} Paint Colors`,
        description: `Browse all ${brand.color_count.toLocaleString()} ${brand.name} paint colors with hex codes, RGB values, and cross-brand matches.`,
        url: `https://www.paintcolorhq.com/brands/${brand.slug}`,
        breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Brands", item: "https://www.paintcolorhq.com/brands" },
          { "@type": "ListItem", position: 3, name: brand.name, item: `https://www.paintcolorhq.com/brands/${brand.slug}` },
        ]},
        mainEntity: { "@type": "ItemList", numberOfItems: totalCount,
          itemListElement: colors.map((color, i) => ({ "@type": "ListItem", position: i + 1, url: `https://www.paintcolorhq.com/colors/${brand.slug}/${color.slug}`, name: color.name })),
        },
      }} />
      {orgData && <JsonLd data={{
        "@context": "https://schema.org", "@type": "Organization", name: brand.name,
        ...(orgData.url && { url: orgData.url }),
        ...(orgData.foundingDate && { foundingDate: orgData.foundingDate }),
        ...(orgData.headquarters && { address: { "@type": "PostalAddress", addressLocality: orgData.headquarters } }),
        ...(orgData.sameAs && orgData.sameAs.length > 0 && { sameAs: orgData.sameAs }),
      }} />}

      <AdSenseScript />
      <Footer />
    </div>
  );
}

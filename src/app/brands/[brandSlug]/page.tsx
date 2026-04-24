import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getBrandBySlug, getColorsByBrand, getColorsByBrandCount, getAllBrands } from "@/lib/queries";
import { getBrandContent } from "@/lib/brand-content";
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
  searchParams: Promise<{ family?: string; undertone?: string; page?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const { family, undertone, page: pageParam } = await searchParams;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return { title: "Brand Not Found" };
  const count = brand.color_count.toLocaleString();
  const url = `https://www.paintcolorhq.com/brands/${brandSlug}`;
  const title = `All ${count} ${brand.name} Paint Colors`;
  const description = `Browse all ${count} ${brand.name} paint colors with cross-brand matching, undertone filters, and LRV values. Find your perfect color.`;
  const currentPage = parseInt(pageParam ?? "1", 10) || 1;
  const brandContent = getBrandContent(brandSlug);
  const shouldNoindex = currentPage > 1 || !brandContent || !!family || !!undertone;
  return {
    title, description,
    alternates: { canonical: url },
    ...(shouldNoindex && { robots: { index: false, follow: true } }),
    openGraph: { title, description, url, images: [{ url: "/og-image.webp", width: 1200, height: 630 }] },
  };
}

const brandOrgData: Record<string, { foundingDate?: string; headquarters?: string; url?: string }> = {
  "sherwin-williams": { foundingDate: "1866", headquarters: "Cleveland, Ohio, USA", url: "https://www.sherwin-williams.com" },
  "benjamin-moore": { foundingDate: "1883", headquarters: "Montvale, New Jersey, USA", url: "https://www.benjaminmoore.com" },
  behr: { headquarters: "Santa Ana, California, USA", url: "https://www.behr.com" },
  ppg: { foundingDate: "1883", headquarters: "Pittsburgh, Pennsylvania, USA", url: "https://www.ppgpaints.com" },
  valspar: { headquarters: "Minneapolis, Minnesota, USA", url: "https://www.valspar.com" },
  "dunn-edwards": { foundingDate: "1925", headquarters: "Los Angeles, California, USA", url: "https://www.dunnedwards.com" },
  "farrow-ball": { foundingDate: "1946", headquarters: "Dorset, England, UK", url: "https://www.farrow-ball.com" },
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

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { brandSlug } = await params;
  const { family, undertone: undertoneFilter, page: pageParam } = await searchParams;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const perPage = 60;

  const [colors, totalCount] = await Promise.all([
    getColorsByBrand(brand.id, { family: family ?? undefined, undertone: undertoneFilter ?? undefined, limit: perPage, offset: (currentPage - 1) * perPage }),
    getColorsByBrandCount(brand.id, { family: family ?? undefined, undertone: undertoneFilter ?? undefined }),
  ]);
  const totalPages = Math.ceil(totalCount / perPage);

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

  const undertoneColors: Record<string, string> = {
    warm: "#E8B87D",
    cool: "#7DA8CC",
    neutral: "#B8B4AC",
  };

  const brandContent = getBrandContent(brand.slug);
  const subtitle = brandContent?.subtitle ?? `Browse every ${brand.name} color with undertone tags, LRV values, and cross-brand matches`;
  const orgData = brandOrgData[brand.slug];

  return (
    <div className="min-h-screen bg-surface">
      <TrackPage eventName="page_view_enriched" params={{ page_type: "brand", color_brand: brandSlug, color_family: family, undertone_filter: undertoneFilter, page_number: currentPage }} />
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

      {/* Color Library */}
      <section id="colors" className="py-24 px-6 md:px-12 bg-surface-container-low scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div>
              <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">{brand.name} Color Library</h2>
              <p className="text-outline mt-2">{totalCount.toLocaleString()} colors{family ? ` in ${family}` : ""}{undertoneFilter ? ` \u00B7 ${undertoneFilter} undertone` : ""}.</p>
            </div>
          </div>

          {/* Family filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href={`/brands/${brandSlug}${undertoneFilter ? `?undertone=${undertoneFilter}` : ""}`}
              className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${!family ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
            >
              All
            </Link>
            {families.map((f) => {
              const p = new URLSearchParams();
              p.set("family", f.name);
              if (undertoneFilter) p.set("undertone", undertoneFilter);
              return (
                <Link key={f.name} href={`/brands/${brandSlug}?${p.toString()}`}
                  className={`rounded-full px-4 py-2 text-sm font-headline font-bold capitalize transition-all flex items-center gap-2 ${family === f.name ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full shrink-0 ${f.border ? "border border-outline-variant/30" : ""}`} style={{ backgroundColor: f.hex }} />
                  {f.name}
                </Link>
              );
            })}
          </div>

          {/* Undertone filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            <Link
              href={`/brands/${brandSlug}${family ? `?family=${family}` : ""}`}
              className={`rounded-full px-4 py-2 text-sm transition-all ${!undertoneFilter ? "bg-secondary text-on-secondary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-secondary"}`}
            >
              All Undertones
            </Link>
            {(["warm", "cool", "neutral"] as const).map((tone) => {
              const p = new URLSearchParams();
              if (family) p.set("family", family);
              p.set("undertone", tone);
              return (
                <Link key={tone} href={`/brands/${brandSlug}?${p.toString()}`}
                  className={`rounded-full px-4 py-2 text-sm capitalize transition-all flex items-center gap-2 ${undertoneFilter === tone ? "bg-secondary text-on-secondary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-secondary"}`}
                >
                  <span className="inline-block h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: undertoneColors[tone] }} />
                  {tone}
                </Link>
              );
            })}
          </div>

          {/* Color grid */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {colors.map((color) => (
              <ColorCard key={color.id} name={color.name} hex={color.hex} brandName={brand.name} brandSlug={brand.slug} colorSlug={color.slug} colorNumber={color.color_number} />
            ))}
          </div>

          {colors.length === 0 && (
            <p className="mt-12 text-center text-on-surface-variant">No colors found{family ? ` in the ${family} family` : ""}.</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (() => {
            function pageUrl(page: number) {
              const p = new URLSearchParams();
              if (family) p.set("family", family);
              if (undertoneFilter) p.set("undertone", undertoneFilter);
              if (page > 1) p.set("page", String(page));
              const qs = p.toString();
              return `/brands/${brandSlug}${qs ? `?${qs}` : ""}`;
            }

            // Build truncated page list: 1 ... (current-1) current (current+1) ... last
            const pages: (number | "ellipsis")[] = [];
            const addPage = (n: number) => { if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n); };
            addPage(1);
            if (currentPage > 3) pages.push("ellipsis");
            addPage(currentPage - 1);
            addPage(currentPage);
            addPage(currentPage + 1);
            if (currentPage < totalPages - 2) pages.push("ellipsis");
            addPage(totalPages);

            return (
              <nav className="mt-12 flex items-center justify-center gap-2">
                {currentPage > 1 && (
                  <Link href={pageUrl(currentPage - 1)} className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors">
                    Previous
                  </Link>
                )}
                {pages.map((page, i) =>
                  page === "ellipsis" ? (
                    <span key={`e${i}`} className="px-2 text-outline">...</span>
                  ) : (
                    <Link key={page} href={pageUrl(page)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-headline font-bold transition-all ${page === currentPage ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15 hover:text-primary"}`}
                    >{page}</Link>
                  )
                )}
                {currentPage < totalPages && (
                  <Link href={pageUrl(currentPage + 1)} className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors">
                    Next
                  </Link>
                )}
              </nav>
            );
          })()}
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
          { "@type": "ListItem", position: 3, name: brand.name },
        ]},
        mainEntity: { "@type": "ItemList", numberOfItems: totalCount,
          itemListElement: colors.map((color, i) => ({ "@type": "ListItem", position: (currentPage - 1) * perPage + i + 1, url: `https://www.paintcolorhq.com/colors/${brand.slug}/${color.slug}`, name: color.name })),
        },
      }} />
      {orgData && <JsonLd data={{
        "@context": "https://schema.org", "@type": "Organization", name: brand.name,
        ...(orgData.url && { url: orgData.url }),
        ...(orgData.foundingDate && { foundingDate: orgData.foundingDate }),
        ...(orgData.headquarters && { address: { "@type": "PostalAddress", addressLocality: orgData.headquarters } }),
      }} />}

      <AdSenseScript />
      <Footer />
    </div>
  );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getColorsByFamily, getColorsByFamilyCount, getAllBrands } from "@/lib/queries";
import { getFamilyContent } from "@/lib/family-content";
import { TrackPage } from "@/components/track-page";
import { ColorLinkEnhancer } from "@/components/color-link-enhancer";

export const revalidate = 3600;

const validFamilies = [
  "red", "orange", "yellow", "green", "blue", "purple", "pink",
  "white", "off-white", "black", "gray", "brown", "beige", "tan", "neutral",
];

const familyColors: Record<string, { hex: string; border?: boolean }> = {
  red: { hex: "#DC2626" }, orange: { hex: "#EA580C" }, yellow: { hex: "#EAB308" },
  green: { hex: "#16A34A" }, blue: { hex: "#2563EB" }, purple: { hex: "#9333EA" },
  pink: { hex: "#EC4899" }, white: { hex: "#FFFFFF", border: true },
  "off-white": { hex: "#F5F0E8", border: true }, black: { hex: "#1F2937" },
  gray: { hex: "#9CA3AF" }, brown: { hex: "#8B6914" }, beige: { hex: "#D4C5A9" },
  tan: { hex: "#D2B48C" }, neutral: { hex: "#C7C1B7" },
};

const undertoneColors: Record<string, string> = {
  warm: "#E8B87D", cool: "#7DA8CC", neutral: "#B8B4AC",
};

interface PageProps {
  params: Promise<{ familySlug: string }>;
  searchParams: Promise<{ brand?: string; undertone?: string; page?: string }>;
}

export async function generateStaticParams() {
  return validFamilies.map((f) => ({ familySlug: f }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { familySlug } = await params;
  const name = familySlug.replace(/-/g, " ");
  const url = `https://www.paintcolorhq.com/colors/family/${familySlug}`;
  return {
    title: `${capitalize(name)} Paint Colors - All Brands`,
    description: `Browse ${name} paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more. Compare colors with hex codes and LRV values.`,
    alternates: { canonical: url },
    openGraph: { title: `${capitalize(name)} Paint Colors`, description: `Browse ${name} paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more.`, url },
  };
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// JSON-LD helper — content is server-generated from trusted database values only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function ColorFamilyPage({ params, searchParams }: PageProps) {
  const { familySlug } = await params;
  const { brand: brandFilter, undertone: undertoneFilter, page: pageParam } = await searchParams;

  if (!validFamilies.includes(familySlug)) notFound();

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const perPage = 60;

  const [colors, brands, totalCount] = await Promise.all([
    getColorsByFamily(familySlug, { brandSlug: brandFilter ?? undefined, undertone: undertoneFilter ?? undefined, limit: perPage, offset: (currentPage - 1) * perPage }),
    getAllBrands(),
    getColorsByFamilyCount(familySlug, { brandSlug: brandFilter ?? undefined, undertone: undertoneFilter ?? undefined }),
  ]);
  const totalPages = Math.ceil(totalCount / perPage);

  const familyName = capitalize(familySlug.replace(/-/g, " "));
  const familyContent = getFamilyContent(familySlug);
  const brandCount = brands.length;
  const baseUrl = `https://www.paintcolorhq.com/colors/family/${familySlug}`;
  const fc = familyColors[familySlug] ?? { hex: "#9CA3AF" };

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@graph": [
          { "@type": "CollectionPage", name: `${familyName} Paint Colors`, description: `Browse ${totalCount} ${familyName.toLowerCase()} paint colors from ${brandCount} brands.`, url: baseUrl, numberOfItems: totalCount,
            mainEntity: { "@type": "ItemList", numberOfItems: totalCount, itemListElement: colors.slice(0, 20).map((color, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "Product", name: color.name, brand: { "@type": "Brand", name: color.brand.name }, color: color.hex, url: `https://www.paintcolorhq.com/colors/${color.brand.slug}/${color.slug}` } })) },
          },
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
            { "@type": "ListItem", position: 2, name: "Colors", item: "https://www.paintcolorhq.com/colors" },
            { "@type": "ListItem", position: 3, name: `${familyName} Paint Colors`, item: baseUrl },
          ]},
        ],
      }} />
      <TrackPage eventName="page_view_enriched" params={{ page_type: "family", color_family: familySlug, brand_filter: brandFilter ?? "all", undertone_filter: undertoneFilter ?? "all", page_number: currentPage, result_count: totalCount }} />
      <Header />

      {/* Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-8">
          <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl shrink-0 shadow-lg ${fc.border ? "border border-outline-variant/30" : ""}`} style={{ backgroundColor: fc.hex }} />
          <div>
            <nav className="mb-4 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2 text-outline">/</span>
              <Link href="/colors" className="hover:text-primary transition-colors">Colors</Link>
              <span className="mx-2 text-outline">/</span>
              <span className="text-on-surface">{familyName}</span>
            </nav>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mb-4">
              {familyName} Paint Colors
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
              {totalCount.toLocaleString()} {familyName.toLowerCase()} paint colors across {brandCount} brands including Sherwin-Williams, Benjamin Moore, and Behr.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Intro */}
      {familyContent?.intro && (
        <section className="bg-tertiary-fixed py-16 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="bg-primary h-1 w-12 mb-8" />
            <div id="family-intro" className="max-w-4xl text-on-surface-variant leading-relaxed">
              {familyContent.intro}
            </div>
            <ColorLinkEnhancer containerRef="family-intro" />
          </div>
        </section>
      )}

      {/* Color Library */}
      <section className="py-24 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div>
              <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">The Color Library</h2>
              <p className="text-outline mt-2">{totalCount.toLocaleString()} colors{brandFilter ? ` from ${brandFilter}` : ""}{undertoneFilter ? ` \u00B7 ${undertoneFilter} undertone` : ""}.</p>
            </div>
          </div>

          {/* Brand filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href={`/colors/family/${familySlug}${undertoneFilter ? `?undertone=${undertoneFilter}` : ""}`}
              className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${!brandFilter ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
            >
              All Brands
            </Link>
            {brands.map((b) => {
              const p = new URLSearchParams();
              p.set("brand", b.slug);
              if (undertoneFilter) p.set("undertone", undertoneFilter);
              return (
                <Link key={b.slug} href={`/colors/family/${familySlug}?${p.toString()}`}
                  className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${brandFilter === b.slug ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
                >{b.name}</Link>
              );
            })}
          </div>

          {/* Undertone filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            <Link
              href={`/colors/family/${familySlug}${brandFilter ? `?brand=${brandFilter}` : ""}`}
              className={`rounded-full px-4 py-2 text-sm transition-all flex items-center gap-2 ${!undertoneFilter ? "bg-secondary text-on-secondary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-secondary"}`}
            >
              All Undertones
            </Link>
            {(["warm", "cool", "neutral"] as const).map((tone) => {
              const p = new URLSearchParams();
              if (brandFilter) p.set("brand", brandFilter);
              p.set("undertone", tone);
              return (
                <Link key={tone} href={`/colors/family/${familySlug}?${p.toString()}`}
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
              <ColorCard key={color.id} name={color.name} hex={color.hex} brandName={color.brand.name} brandSlug={color.brand.slug} colorSlug={color.slug} colorNumber={color.color_number} />
            ))}
          </div>

          {colors.length === 0 && (
            <p className="mt-12 text-center text-on-surface-variant">No {familyName.toLowerCase()} colors found{brandFilter ? ` from this brand` : ""}.</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (() => {
            function pageUrl(page: number) {
              const p = new URLSearchParams();
              if (brandFilter) p.set("brand", brandFilter);
              if (undertoneFilter) p.set("undertone", undertoneFilter);
              if (page > 1) p.set("page", String(page));
              const qs = p.toString();
              return `/colors/family/${familySlug}${qs ? `?${qs}` : ""}`;
            }
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
                  <Link href={pageUrl(currentPage - 1)} className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors">Previous</Link>
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
                  <Link href={pageUrl(currentPage + 1)} className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors">Next</Link>
                )}
              </nav>
            );
          })()}
        </div>
      </section>

      {/* Guide content */}
      {familyContent?.guide && (
        <section className="py-16 px-6 md:px-12 bg-tertiary-fixed">
          <div className="max-w-7xl mx-auto">
            <div id="family-guide" className="max-w-4xl text-on-surface-variant">
              {familyContent.guide}
            </div>
            <ColorLinkEnhancer containerRef="family-guide" />
          </div>
        </section>
      )}

      {/* Browse Other Families */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">Browse Other Color Families</h2>
          <div className="flex flex-wrap gap-3">
            {validFamilies
              .filter((f) => f !== familySlug)
              .map((f) => {
                const fData = familyColors[f] ?? { hex: "#9CA3AF" };
                return (
                  <Link key={f} href={`/colors/family/${f}`}
                    className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:shadow-md hover:text-primary"
                  >
                    <span className={`inline-block h-5 w-5 rounded-full ${fData.border ? "border border-outline-variant/30" : ""}`} style={{ backgroundColor: fData.hex }} />
                    {capitalize(f.replace(/-/g, " "))}
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

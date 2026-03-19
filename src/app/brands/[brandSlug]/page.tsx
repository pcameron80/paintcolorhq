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

export const revalidate = 3600;

export async function generateStaticParams() {
  const brands = await getAllBrands();
  return brands.map((b) => ({ brandSlug: b.slug }));
}

interface PageProps {
  params: Promise<{ brandSlug: string }>;
  searchParams: Promise<{ family?: string; undertone?: string; page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return { title: "Brand Not Found" };

  const count = brand.color_count.toLocaleString();
  const url = `https://www.paintcolorhq.com/brands/${brandSlug}`;
  const title = `All ${count} ${brand.name} Paint Colors | Paint Color HQ`;
  const description = `Browse all ${count} ${brand.name} paint colors with cross-brand matching, undertone filters, and LRV values. Find your perfect color.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
    },
  };
}

/* Organization metadata for known brands */
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

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { brandSlug } = await params;
  const { family, undertone: undertoneFilter, page: pageParam } = await searchParams;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const perPage = 60;

  const [colors, totalCount] = await Promise.all([
    getColorsByBrand(brand.id, {
      family: family ?? undefined,
      undertone: undertoneFilter ?? undefined,
      limit: perPage,
      offset: (currentPage - 1) * perPage,
    }),
    getColorsByBrandCount(brand.id, {
      family: family ?? undefined,
      undertone: undertoneFilter ?? undefined,
    }),
  ]);
  const totalPages = Math.ceil(totalCount / perPage);

  const families = [
    "white", "off-white", "gray", "beige", "neutral", "brown", "tan",
    "red", "orange", "yellow", "green", "blue", "purple", "pink", "black",
  ];

  const brandContent = getBrandContent(brand.slug);
  const subtitle = brandContent?.subtitle
    ?? `Browse every ${brand.name} color with undertone tags, LRV values, and cross-brand matches`;

  const orgData = brandOrgData[brand.slug];

  return (
    <div className="min-h-screen bg-white">
      <TrackPage
        eventName="page_view_enriched"
        params={{
          page_type: "brand",
          color_brand: brandSlug,
          color_family: family,
          undertone_filter: undertoneFilter,
          page_number: currentPage,
        }}
      />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/brands" className="hover:text-gray-900">Brands</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{brand.name}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">
          All {brand.color_count.toLocaleString()} {brand.name} Paint Colors
        </h1>
        <p className="mt-1 text-gray-600">
          {subtitle}
        </p>

        {/* Color family filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/brands/${brandSlug}${undertoneFilter ? `?undertone=${undertoneFilter}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm ${
              !family
                ? "bg-blue-100 text-brand-blue-dark font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </Link>
          {families.map((f) => {
            const params = new URLSearchParams();
            params.set("family", f);
            if (undertoneFilter) params.set("undertone", undertoneFilter);
            return (
              <Link
                key={f}
                href={`/brands/${brandSlug}?${params.toString()}`}
                className={`rounded-full px-3 py-1 text-sm capitalize ${
                  family === f
                    ? "bg-blue-100 text-brand-blue-dark font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
              </Link>
            );
          })}
        </div>

        {/* Undertone filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/brands/${brandSlug}${family ? `?family=${family}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm ${
              !undertoneFilter
                ? "bg-purple-100 text-purple-700 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Undertones
          </Link>
          {(["warm", "cool", "neutral"] as const).map((tone) => {
            const params = new URLSearchParams();
            if (family) params.set("family", family);
            params.set("undertone", tone);
            return (
              <Link
                key={tone}
                href={`/brands/${brandSlug}?${params.toString()}`}
                className={`rounded-full px-3 py-1 text-sm capitalize ${
                  undertoneFilter === tone
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tone}
              </Link>
            );
          })}
        </div>

        {brandContent?.details}

        {/* Color grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {colors.map((color) => (
            <ColorCard
              key={color.id}
              name={color.name}
              hex={color.hex}
              brandName={brand.name}
              brandSlug={brand.slug}
              colorSlug={color.slug}
              colorNumber={color.color_number}
            />
          ))}
        </div>

        {colors.length === 0 && (
          <p className="mt-12 text-center text-gray-500">
            No colors found{family ? ` in the ${family} family` : ""}.
          </p>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={(() => {
                  const p = new URLSearchParams();
                  if (family) p.set("family", family);
                  if (undertoneFilter) p.set("undertone", undertoneFilter);
                  if (currentPage > 2) p.set("page", String(currentPage - 1));
                  const qs = p.toString();
                  return `/brands/${brandSlug}${qs ? `?${qs}` : ""}`;
                })()}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const p = new URLSearchParams();
              if (family) p.set("family", family);
              if (undertoneFilter) p.set("undertone", undertoneFilter);
              if (page > 1) p.set("page", String(page));
              const qs = p.toString();
              return (
                <Link
                  key={page}
                  href={`/brands/${brandSlug}${qs ? `?${qs}` : ""}`}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    page === currentPage
                      ? "bg-brand-blue text-white"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </Link>
              );
            })}
            {currentPage < totalPages && (
              <Link
                href={(() => {
                  const p = new URLSearchParams();
                  if (family) p.set("family", family);
                  if (undertoneFilter) p.set("undertone", undertoneFilter);
                  p.set("page", String(currentPage + 1));
                  const qs = p.toString();
                  return `/brands/${brandSlug}${qs ? `?${qs}` : ""}`;
                })()}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </nav>
        )}

        {/* Cross-Brand Matching links */}
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
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-gray-900">
                Cross-Brand Matching
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Find equivalent colors from {brand.name} in other major paint brands.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {targets.map((target) => (
                  <Link
                    key={target.slug}
                    href={`/match/${brandSlug}/to/${target.slug}`}
                    className="rounded-lg border border-gray-200 p-4 text-center transition hover:shadow-md"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {brand.name} to {target.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      View equivalent colors
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* About brand - collapsible intro content below the grid */}
        {brandContent?.intro && (
          <details className="mt-10">
            <summary className="cursor-pointer text-lg font-semibold text-gray-900 hover:text-gray-700">
              About {brand.name}
            </summary>
            {brandContent.intro}
          </details>
        )}

        {/* JSON-LD: CollectionPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `${brand.name} Paint Colors`,
              description: `Browse all ${brand.color_count.toLocaleString()} ${brand.name} paint colors with hex codes, RGB values, and cross-brand matches.`,
              url: `https://www.paintcolorhq.com/brands/${brand.slug}`,
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
                  { "@type": "ListItem", position: 2, name: "Brands", item: "https://www.paintcolorhq.com/brands" },
                  { "@type": "ListItem", position: 3, name: brand.name },
                ],
              },
              mainEntity: {
                "@type": "ItemList",
                numberOfItems: totalCount,
                itemListElement: colors.map((color, i) => ({
                  "@type": "ListItem",
                  position: (currentPage - 1) * perPage + i + 1,
                  url: `https://www.paintcolorhq.com/colors/${brand.slug}/${color.slug}`,
                  name: color.name,
                })),
              },
            }),
          }}
        />

        {/* JSON-LD: Organization */}
        {orgData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: brand.name,
                ...(orgData.url && { url: orgData.url }),
                ...(orgData.foundingDate && { foundingDate: orgData.foundingDate }),
                ...(orgData.headquarters && {
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: orgData.headquarters,
                  },
                }),
              }),
            }}
          />
        )}
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

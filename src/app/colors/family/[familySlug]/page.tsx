import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getColorsByFamily, getColorsByFamilyCount, getAllBrands } from "@/lib/queries";
import { getFamilyContent } from "@/lib/family-content";
import { TrackPage } from "@/components/track-page";

export const revalidate = 3600;

const validFamilies = [
  "red", "orange", "yellow", "green", "blue", "purple", "pink",
  "white", "off-white", "black", "gray", "brown", "beige", "tan", "neutral",
];

const colorFamilies = [
  { slug: "red", label: "Red" },
  { slug: "orange", label: "Orange" },
  { slug: "yellow", label: "Yellow" },
  { slug: "green", label: "Green" },
  { slug: "blue", label: "Blue" },
  { slug: "purple", label: "Purple" },
  { slug: "pink", label: "Pink" },
  { slug: "white", label: "White" },
  { slug: "off-white", label: "Off-White" },
  { slug: "black", label: "Black" },
  { slug: "gray", label: "Gray" },
  { slug: "brown", label: "Brown" },
  { slug: "beige", label: "Beige" },
  { slug: "tan", label: "Tan" },
  { slug: "neutral", label: "Neutral" },
];

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
    openGraph: {
      title: `${capitalize(name)} Paint Colors`,
      description: `Browse ${name} paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more.`,
      url,
    },
  };
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ColorFamilyPage({ params, searchParams }: PageProps) {
  const { familySlug } = await params;
  const { brand: brandFilter, undertone: undertoneFilter, page: pageParam } = await searchParams;

  if (!validFamilies.includes(familySlug)) notFound();

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const perPage = 60;

  const [colors, brands, totalCount] = await Promise.all([
    getColorsByFamily(familySlug, {
      brandSlug: brandFilter ?? undefined,
      undertone: undertoneFilter ?? undefined,
      limit: perPage,
      offset: (currentPage - 1) * perPage,
    }),
    getAllBrands(),
    getColorsByFamilyCount(familySlug, {
      brandSlug: brandFilter ?? undefined,
      undertone: undertoneFilter ?? undefined,
    }),
  ]);
  const totalPages = Math.ceil(totalCount / perPage);

  const familyName = capitalize(familySlug.replace(/-/g, " "));
  const familyContent = getFamilyContent(familySlug);
  const brandCount = brands.length;
  const baseUrl = `https://www.paintcolorhq.com/colors/family/${familySlug}`;

  // JSON-LD structured data - built from trusted server-side data only
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${familyName} Paint Colors`,
        description: `Browse ${totalCount} ${familyName.toLowerCase()} paint colors from ${brandCount} brands including Sherwin-Williams, Benjamin Moore, and Behr.`,
        url: baseUrl,
        numberOfItems: totalCount,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: totalCount,
          itemListElement: colors.slice(0, 20).map((color, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: color.name,
              brand: { "@type": "Brand", name: color.brand.name },
              color: color.hex,
              url: `https://www.paintcolorhq.com/colors/${color.brand.slug}/${color.slug}`,
            },
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Colors", item: "https://www.paintcolorhq.com/colors" },
          { "@type": "ListItem", position: 3, name: `${familyName} Paint Colors`, item: baseUrl },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackPage
        eventName="page_view_enriched"
        params={{
          page_type: "family",
          color_family: familySlug,
          brand_filter: brandFilter ?? "all",
          undertone_filter: undertoneFilter ?? "all",
          page_number: currentPage,
          result_count: totalCount,
        }}
      />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/colors" className="hover:text-gray-900">Colors</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{familyName}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">
          {familyName} Paint Colors
        </h1>
        <p className="mt-2 text-gray-600">
          There are {totalCount} {familyName.toLowerCase()} paint colors across {brandCount} brands
          on PaintColorHQ, including Sherwin-Williams, Benjamin Moore, and Behr. Use the brand and
          undertone filters below to narrow your search.
        </p>

        {familyContent && familyContent.intro}

        {/* Brand filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/colors/family/${familySlug}${undertoneFilter ? `?undertone=${undertoneFilter}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm ${
              !brandFilter
                ? "bg-blue-100 text-brand-blue-dark font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Brands
          </Link>
          {brands.map((b) => {
            const params = new URLSearchParams();
            params.set("brand", b.slug);
            if (undertoneFilter) params.set("undertone", undertoneFilter);
            return (
              <Link
                key={b.slug}
                href={`/colors/family/${familySlug}?${params.toString()}`}
                className={`rounded-full px-3 py-1 text-sm ${
                  brandFilter === b.slug
                    ? "bg-blue-100 text-brand-blue-dark font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {b.name}
              </Link>
            );
          })}
        </div>

        {/* Undertone filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/colors/family/${familySlug}${brandFilter ? `?brand=${brandFilter}` : ""}`}
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
            if (brandFilter) params.set("brand", brandFilter);
            params.set("undertone", tone);
            return (
              <Link
                key={tone}
                href={`/colors/family/${familySlug}?${params.toString()}`}
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

        {familyContent && familyContent.guide}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {colors.map((color) => (
            <ColorCard
              key={color.id}
              name={color.name}
              hex={color.hex}
              brandName={color.brand.name}
              brandSlug={color.brand.slug}
              colorSlug={color.slug}
              colorNumber={color.color_number}
            />
          ))}
        </div>

        {colors.length === 0 && (
          <p className="mt-12 text-center text-gray-500">
            No {familyName.toLowerCase()} colors found
            {brandFilter ? ` from this brand` : ""}.
          </p>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={(() => {
                  const p = new URLSearchParams();
                  if (brandFilter) p.set("brand", brandFilter);
                  if (undertoneFilter) p.set("undertone", undertoneFilter);
                  if (currentPage > 2) p.set("page", String(currentPage - 1));
                  const qs = p.toString();
                  return `/colors/family/${familySlug}${qs ? `?${qs}` : ""}`;
                })()}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const p = new URLSearchParams();
              if (brandFilter) p.set("brand", brandFilter);
              if (undertoneFilter) p.set("undertone", undertoneFilter);
              if (page > 1) p.set("page", String(page));
              const qs = p.toString();
              return (
                <Link
                  key={page}
                  href={`/colors/family/${familySlug}${qs ? `?${qs}` : ""}`}
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
                  if (brandFilter) p.set("brand", brandFilter);
                  if (undertoneFilter) p.set("undertone", undertoneFilter);
                  p.set("page", String(currentPage + 1));
                  const qs = p.toString();
                  return `/colors/family/${familySlug}${qs ? `?${qs}` : ""}`;
                })()}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </nav>
        )}
        {/* Cross-family navigation */}
        <section className="mt-16 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-semibold text-gray-900">Browse Other Color Families</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {colorFamilies
              .filter((f) => f.slug !== familySlug)
              .map((f) => (
                <Link
                  key={f.slug}
                  href={`/colors/family/${f.slug}`}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  {f.label}
                </Link>
              ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

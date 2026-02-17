import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getBrandBySlug, getColorsByBrand, getColorsByBrandCount, getAllBrands } from "@/lib/queries";
import { getBrandContent } from "@/lib/brand-content";

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

  const url = `https://www.paintcolorhq.com/brands/${brandSlug}`;
  return {
    title: `${brand.name} Paint Colors - Browse All ${brand.color_count.toLocaleString()} Colors`,
    description: `Browse all ${brand.color_count.toLocaleString()} ${brand.name} paint colors with hex codes, RGB values, and cross-brand matches.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${brand.name} Paint Colors`,
      description: `Browse all ${brand.color_count.toLocaleString()} ${brand.name} paint colors with hex codes, RGB values, and cross-brand matches.`,
      url,
      images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
    },
  };
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { brandSlug } = await params;
  const { family, undertone: undertoneFilter, page: pageParam } = await searchParams;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const perPage = 200;

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

  return (
    <div className="min-h-screen bg-white">
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
          {brand.name} Paint Colors
        </h1>
        <p className="mt-1 text-gray-600">
          {brand.color_count.toLocaleString()} colors
        </p>

        {getBrandContent(brand.slug)?.intro}

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

        {getBrandContent(brand.slug)?.details}

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

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: brand.name,
              url: brand.website_url,
            }),
          }}
        />
      </main>

      <Footer />
    </div>
  );
}

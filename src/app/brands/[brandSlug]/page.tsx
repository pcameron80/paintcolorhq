import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getBrandBySlug, getColorsByBrand, getAllBrands } from "@/lib/queries";

export const revalidate = 3600;

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
    },
  };
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { brandSlug } = await params;
  const { family, undertone: undertoneFilter } = await searchParams;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const colors = await getColorsByBrand(brand.id, {
    family: family ?? undefined,
    undertone: undertoneFilter ?? undefined,
    limit: 200,
  });

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

        {/* Color family filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/brands/${brandSlug}${undertoneFilter ? `?undertone=${undertoneFilter}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm ${
              !family
                ? "bg-blue-100 text-blue-700 font-medium"
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
                    ? "bg-blue-100 text-blue-700 font-medium"
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

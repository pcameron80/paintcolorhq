import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getColorsByFamily, getAllColorFamilies, getAllBrands } from "@/lib/queries";

export const revalidate = 3600;

const validFamilies = [
  "red", "orange", "yellow", "green", "blue", "purple", "pink",
  "white", "off-white", "black", "gray", "brown", "beige", "tan", "neutral",
];

interface PageProps {
  params: Promise<{ familySlug: string }>;
  searchParams: Promise<{ brand?: string }>;
}

export async function generateStaticParams() {
  return validFamilies.map((f) => ({ familySlug: f }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { familySlug } = await params;
  const name = familySlug.replace(/-/g, " ");

  const url = `https://paintcolorhq.com/colors/family/${familySlug}`;
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
  const { brand: brandFilter } = await searchParams;

  if (!validFamilies.includes(familySlug)) notFound();

  const [colors, brands] = await Promise.all([
    getColorsByFamily(familySlug, {
      brandSlug: brandFilter ?? undefined,
      limit: 200,
    }),
    getAllBrands(),
  ]);

  const familyName = capitalize(familySlug.replace(/-/g, " "));

  return (
    <div className="min-h-screen bg-white">
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
          {colors.length} {familyName.toLowerCase()} colors from all brands,
          sorted by lightness.
        </p>

        {/* Brand filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/colors/family/${familySlug}`}
            className={`rounded-full px-3 py-1 text-sm ${
              !brandFilter
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Brands
          </Link>
          {brands.map((b) => (
            <Link
              key={b.slug}
              href={`/colors/family/${familySlug}?brand=${b.slug}`}
              className={`rounded-full px-3 py-1 text-sm ${
                brandFilter === b.slug
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>

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
      </main>

      <Footer />
    </div>
  );
}

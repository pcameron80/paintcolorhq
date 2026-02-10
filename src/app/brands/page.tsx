import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllBrands } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Paint Brands",
  description:
    "Browse paint colors from top brands including Sherwin-Williams, Benjamin Moore, Behr, PPG, and more.",
  alternates: { canonical: "https://paintcolorhq.com/brands" },
  openGraph: {
    title: "Paint Brands",
    description:
      "Browse paint colors from top brands including Sherwin-Williams, Benjamin Moore, Behr, PPG, and more.",
    url: "https://paintcolorhq.com/brands",
  },
};

export default async function BrandsPage() {
  const brands = await getAllBrands();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Paint Brands</h1>
        <p className="mt-2 text-gray-600">
          Browse paint colors from the top brands.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                {brand.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {brand.color_count.toLocaleString()} colors
              </p>
              {brand.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {brand.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

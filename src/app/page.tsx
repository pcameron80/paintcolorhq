import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const brands = [
  { name: "Sherwin-Williams", slug: "sherwin-williams" },
  { name: "Benjamin Moore", slug: "benjamin-moore" },
  { name: "Behr", slug: "behr" },
  { name: "PPG", slug: "ppg" },
  { name: "Dunn-Edwards", slug: "dunn-edwards" },
  { name: "Valspar", slug: "valspar" },
  { name: "Pratt & Lambert", slug: "pratt-lambert" },
  { name: "California Paints", slug: "california-paints" },
  { name: "Farrow & Ball", slug: "farrow-ball" },
  { name: "Dulux", slug: "dulux" },
];

const colorFamilies = [
  { name: "White", slug: "white", color: "#FFFFFF", border: true },
  { name: "Off-White", slug: "off-white", color: "#F5F0E8", border: true },
  { name: "Gray", slug: "gray", color: "#9CA3AF" },
  { name: "Beige", slug: "beige", color: "#D4C5A9" },
  { name: "Brown", slug: "brown", color: "#8B6914" },
  { name: "Red", slug: "red", color: "#DC2626" },
  { name: "Orange", slug: "orange", color: "#EA580C" },
  { name: "Yellow", slug: "yellow", color: "#EAB308" },
  { name: "Green", slug: "green", color: "#16A34A" },
  { name: "Blue", slug: "blue", color: "#2563EB" },
  { name: "Purple", slug: "purple", color: "#9333EA" },
  { name: "Pink", slug: "pink", color: "#EC4899" },
  { name: "Black", slug: "black", color: "#1F2937" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Find Your Perfect Paint Color Match
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Browse 25,000+ paint colors across top brands. Find the closest
            equivalent in Sherwin-Williams, Benjamin Moore, Behr, and more.
          </p>

          <div className="mx-auto mt-10 max-w-xl">
            <Link
              href="/search"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-left text-lg text-gray-400 shadow-sm hover:border-blue-400"
            >
              Search by color name, number, or hex code...
            </Link>
          </div>

          <section className="mt-16">
            <h2 className="text-lg font-semibold text-gray-900">
              Browse by Brand
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-lg font-semibold text-gray-900">
              Browse by Color Family
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {colorFamilies.map((family) => (
                <Link
                  key={family.slug}
                  href={`/colors/${family.slug}`}
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300"
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full ${family.border ? "border border-gray-300" : ""}`}
                    style={{ backgroundColor: family.color }}
                  />
                  {family.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

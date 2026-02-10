import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSearch } from "@/components/hero-search";
import { InspirationSection } from "@/components/inspiration-section";

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

export const revalidate = 3600;

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <HeroSearch />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="sr-only">Paint Color HQ - Cross-Brand Paint Color Matching</h1>

        {/* What is Paint Color HQ */}
        <section className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Cross-Brand Paint Color Matching
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            Love a Sherwin-Williams color but need it in Benjamin Moore? Paint Color HQ
            makes it easy. We use the{" "}
            <span className="font-medium text-gray-800">CIEDE2000 color science algorithm</span>{" "}
            to find the closest perceptual match across 14 major paint brands, so you
            can compare colors with confidence.
          </p>
        </section>

        {/* How it works */}
        <section className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              1
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">Search Any Color</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Find a color by name, number, or hex code from over 25,000 paint colors
              across Sherwin-Williams, Benjamin Moore, Behr, PPG, and more.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              2
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">See Matches Across Brands</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Every color page shows the closest equivalents from each other brand,
              ranked by Delta E score so you know exactly how close the match is.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              3
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">Build Your Palette</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Explore curated inspiration palettes, compare colors side by side, and
              save your favorites to a project for easy reference when you&apos;re ready to buy.
            </p>
          </div>
        </section>

        <div className="text-center">
          <InspirationSection />

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
                  href={`/colors/family/${family.slug}`}
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

        {/* About section */}
        <section className="mt-20 border-t border-gray-100 pt-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Why Use Paint Color HQ?
            </h2>

            <div className="mt-8 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Find Equivalent Colors Across Any Brand
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  Paint brands don&apos;t make it easy to cross-reference their colors.
                  If your designer specifies a Sherwin-Williams color but your local store
                  only carries Benjamin Moore, you&apos;re stuck guessing. Paint Color HQ
                  solves this by computing the closest perceptual match from every other brand
                  in our database. Each match includes a Delta E score that tells you exactly
                  how close the match is, from imperceptible to noticeably different.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  25,000+ Colors from 14 Brands
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  Our database covers colors from Sherwin-Williams, Benjamin Moore, Behr,
                  PPG, Dunn-Edwards, Valspar, Farrow &amp; Ball, Kilz, Vista Paint,
                  Hirshfield&apos;s, Colorhouse, Dutch Boy, RAL, and MPC. Every color
                  page shows the hex code, RGB values, LRV (Light Reflectance Value),
                  color family, complementary color harmonies, and the top matches from
                  every other brand.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Powered by Real Color Science
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  We don&apos;t just compare hex codes. Paint Color HQ converts every
                  color to the CIELAB color space and uses the{" "}
                  <strong>CIEDE2000 (Delta E 2000)</strong> formula, the same industry-standard
                  algorithm used by paint manufacturers, textile companies, and printing
                  professionals. This means our matches reflect how humans actually perceive
                  color differences, not just mathematical RGB distance.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Curated Inspiration &amp; Project Planning
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  Not sure where to start? Browse our curated inspiration palettes for
                  styles like Modern Farmhouse, Coastal Retreat, and Scandinavian Minimal.
                  Each palette maps to real paint colors you can actually buy. Create an
                  account to save colors to projects, organize them by room role (walls,
                  trim, accent, pop), and keep your selections in one place for when
                  you&apos;re ready to visit the store.
                </p>
              </div>
            </div>

            <p className="mt-8 text-sm text-gray-400">
              Color data is approximate and based on digital values. Pigments, finishes,
              and lighting conditions vary between brands. Always verify with physical
              paint samples before purchasing.
            </p>
          </div>
        </section>
      </main>

      {/* JSON-LD WebSite + SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Paint Color HQ",
            url: "https://paintcolorhq.com",
            description:
              "Explore 25,000+ paint colors, discover curated palettes, and find the perfect color scheme for your next project.",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  "https://paintcolorhq.com/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
}

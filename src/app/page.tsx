import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSearch } from "@/components/hero-search";
import { InspirationSection } from "@/components/inspiration-section";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  alternates: { canonical: "https://www.paintcolorhq.com" },
};

const brands = [
  { name: "Sherwin-Williams", slug: "sherwin-williams" },
  { name: "Benjamin Moore", slug: "benjamin-moore" },
  { name: "Behr", slug: "behr" },
  { name: "PPG", slug: "ppg" },
  { name: "Dunn-Edwards", slug: "dunn-edwards" },
  { name: "Valspar", slug: "valspar" },
  { name: "Farrow & Ball", slug: "farrow-ball" },
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
        {/* BLUF Section — GEO: citeable site definition for AI engines */}
        <section className="mx-auto max-w-4xl pb-12">
          <p className="text-lg leading-relaxed text-gray-700">
            <strong>Paint Color HQ</strong> is a free paint color reference database containing{" "}
            <strong>25,000+ colors from 14 major brands</strong> — including Sherwin-Williams,
            Benjamin Moore, Behr, PPG, Valspar, Farrow &amp; Ball, and Dunn-Edwards. Every color
            includes hex codes, RGB values, LRV (Light Reflectance Value), and undertone
            classification. Cross-brand matching uses the{" "}
            <strong>CIEDE2000 color difference formula</strong> — the perceptual accuracy standard
            defined by the International Commission on Illumination (CIE) — to compute Delta E
            scores that quantify exactly how close two colors are to the human eye.
          </p>
        </section>

        {/* Feature Grid */}
        <section>
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Everything You Need to Choose the Perfect Color
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            <Link
              href="/search"
              className="group rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
            >
              <svg className="h-8 w-8 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <h3 className="mt-4 font-semibold text-gray-900">Cross-Brand Color Matching</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Find equivalent colors across 14 brands using CIEDE2000 Delta E scoring. Each match shows a perceptual distance score so you know if the difference is imperceptible (Delta E &lt; 1) or noticeable (Delta E &gt; 3).
              </p>
            </Link>

            <Link
              href="/tools/room-visualizer"
              className="group rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
            >
              <svg className="h-8 w-8 text-brand-terra" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <h3 className="mt-4 font-semibold text-gray-900">Room Color Visualizer</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Preview any of 25,000+ paint colors on walls, accent wall, trim, and floor in a realistic room scene. Swap colors in real time across all 14 brands.
              </p>
            </Link>

            <Link
              href="/tools/color-identifier"
              className="group rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
            >
              <svg className="h-8 w-8 text-brand-sage" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              <h3 className="mt-4 font-semibold text-gray-900">Photo Color Identifier</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Upload any photo, click a pixel, and instantly identify the closest matching paint colors from all 14 brands ranked by Delta E accuracy.
              </p>
            </Link>

            <Link
              href="/tools/paint-calculator"
              className="group rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
            >
              <svg className="h-8 w-8 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
              </svg>
              <h3 className="mt-4 font-semibold text-gray-900">Paint Calculator</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Enter your room dimensions to find out exactly how many gallons you need.
              </p>
            </Link>

            <Link
              href="/colors"
              className="group rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
            >
              <svg className="h-8 w-8 text-brand-terra" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
              <h3 className="mt-4 font-semibold text-gray-900">Undertone Analysis</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                All 25,000+ colors are classified as warm, cool, or neutral undertone — filter and search by undertone to avoid clashing with existing trim, flooring, or cabinetry.
              </p>
            </Link>

            <Link
              href="/tools/palette-generator"
              className="group rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
            >
              <svg className="h-8 w-8 text-brand-sage" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
              </svg>
              <h3 className="mt-4 font-semibold text-gray-900">Palette Generator</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Select any color and generate a coordinated palette using complementary, analogous, and triadic color harmonies — mapped to real purchasable paint colors from all 14 brands.
              </p>
            </Link>
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
                  className="rounded-lg border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:border-brand-blue hover:bg-blue-50"
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
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand-blue"
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
                  How Does Cross-Brand Color Matching Work?
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  Paint Color HQ computes cross-brand matches using the <strong>CIEDE2000</strong> color
                  difference formula, the perceptual accuracy standard published by the International
                  Commission on Illumination (CIE). Each match includes a <strong>Delta E score</strong>:
                  a Delta E below 1.0 means the difference is imperceptible to the human eye, 1.0–2.0 is
                  only perceptible upon close inspection, and above 3.0 is noticeable at a glance. When
                  your designer specifies Sherwin-Williams Agreeable Gray (SW 7029) but your store
                  carries only Benjamin Moore, Paint Color HQ shows the closest Benjamin Moore match
                  with an exact Delta E score — no guessing required.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Can I Preview Paint Colors in My Room?
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  The Room Visualizer renders any of 25,000+ colors from Sherwin-Williams, Benjamin Moore,
                  Behr, PPG, Valspar, Dunn-Edwards, and Farrow &amp; Ball on walls, accent wall, trim,
                  and floor in a realistic room scene. Swap colors in real time and compare combinations
                  before purchasing — eliminating the need for sample pots.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  How Do I Identify a Paint Color from a Photo?
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  Upload any photo to the Photo Color Identifier, click a pixel, and Paint Color HQ
                  extracts the hex value and returns the closest matching paint colors from all 14 brands,
                  ranked by Delta E accuracy. This works with interior photos, exterior shots, Pinterest
                  screenshots, or any image containing a color you want to match.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What Are Paint Color Undertones?
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  Every color in the Paint Color HQ database is classified as <strong>warm</strong>,{" "}
                  <strong>cool</strong>, or <strong>neutral</strong> undertone based on its RGB values.
                  Undertone is the hidden hue that emerges under different lighting — a white paint with
                  a warm undertone reads slightly yellow or pink in north-facing rooms, while a cool
                  undertone reads blue or gray. Filtering by undertone prevents clashing with existing
                  trim, flooring, and cabinetry.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  How Much Paint Do I Need?
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  The Paint Calculator computes the exact number of gallons needed based on your room
                  dimensions, number of coats, and door/window cutouts. One gallon of paint covers
                  approximately 350–400 square feet. Save your selections to a project, organize colors
                  by room role (walls, trim, accent, pop), and take your complete paint list to the store.
                </p>
              </div>
            </div>

            <p className="mt-8 text-sm text-gray-400">
              Color data is based on manufacturer-published digital values (hex, RGB). Actual
              pigments, finishes, and lighting conditions vary. Always verify with a physical
              paint sample before purchasing.
            </p>
          </div>
        </section>

        <section className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Powered by the CIEDE2000 color difference formula (CIE standard for perceptual accuracy).
            25,000+ colors across 14 brands including Sherwin-Williams, Benjamin Moore, Behr, PPG,
            Valspar, Farrow &amp; Ball, and Dunn-Edwards.{" "}
            <Link href="/about" className="text-brand-blue hover:underline">
              Learn about our methodology
            </Link>.
          </p>
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
            url: "https://www.paintcolorhq.com",
            description:
              "Free paint color database with 25,000+ colors from 14 brands. Cross-brand matching uses CIEDE2000 Delta E scoring. Includes room visualizer, photo color identifier, palette generator, and paint calculator.",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  "https://www.paintcolorhq.com/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      {/* JSON-LD Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Paint Color HQ",
            url: "https://www.paintcolorhq.com",
            logo: "https://www.paintcolorhq.com/logo.webp",
            description:
              "Paint Color HQ is a free paint color reference database with 25,000+ colors from 14 brands. Uses the CIEDE2000 Delta E formula to compute perceptual cross-brand matches. Tools include a room visualizer, photo color identifier, palette generator, and paint calculator.",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              url: "https://www.paintcolorhq.com/contact",
            },
          }),
        }}
      />

      <AdSenseScript />
      <Footer />
    </div>
  );
}

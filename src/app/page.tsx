import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSearch } from "@/components/hero-search";
import { InspirationSection } from "@/components/inspiration-section";
import { TrackPage } from "@/components/track-page";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "Match Any Paint Color Across 14 Brands | Paint Color HQ",
  description:
    "Free paint color cross-reference tool. Match any color across Sherwin-Williams, Benjamin Moore, Behr, PPG & 11 more brands. 25,000+ colors with room visualizer, photo identifier & paint calculator.",
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

const faqItems = [
  {
    question: "How does cross-brand color matching work?",
    answer:
      "We use the same color-matching formula that professional labs use (CIEDE2000) to find the closest equivalent across brands. Each match comes with an accuracy score \u2014 the lower the number, the closer the match. Most of ours score under 2.0, which means the difference is barely noticeable.",
  },
  {
    question: "How much paint do I need?",
    answer:
      "The Paint Calculator computes the exact number of gallons needed based on your room dimensions, number of coats, and door/window cutouts. One gallon of paint covers approximately 350\u2013400 square feet.",
  },
  {
    question: "What are paint color undertones?",
    answer:
      "Every color has a hidden tint \u2014 warm (yellow/pink), cool (blue/gray), or neutral \u2014 that shows up under different lighting. All 25,000+ colors in our database are tagged so you can filter by undertone and avoid clashing with your existing trim, flooring, or cabinets.",
  },
];

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero \u2014 server-rendered for AI/SEO crawlers */}
      <section className="relative h-[480px] w-full overflow-hidden">
        <Image
          src="/hero.webp"
          alt="Beautifully painted room interior"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Match Any Paint Color Across 14 Brands
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
            Your designer picked one brand but your store carries another?
            Search 25,000+ colors and find the closest match instantly.
          </p>
          <HeroSearch />
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Trust bar */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-gray-500 sm:gap-6">
          <span>25,000+ colors</span>
          <span className="text-gray-300">|</span>
          <span>14 paint brands</span>
          <span className="text-gray-300">|</span>
          <span>100% free &mdash; no signup</span>
        </div>

        {/* Feature Grid */}
        <section>
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Everything You Need to Choose the Right Color
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
                Love a Sherwin-Williams color but shopping at Home Depot? Find the
                closest Behr, PPG, or Benjamin Moore match in seconds.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-blue">Find a match &rarr;</span>
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
                Preview any color on walls, trim, and floor in a realistic room
                scene before you buy a single sample pot.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-blue">Try it free &rarr;</span>
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
                Snap a photo of any color you love &mdash; a pillow, a sunset, a
                Pinterest pin &mdash; and find the closest paint match you can buy.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-blue">Upload a photo &rarr;</span>
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
                Enter your room dimensions and get the exact number of gallons
                you need.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-blue">Calculate now &rarr;</span>
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
                Every color tagged warm, cool, or neutral &mdash; so your new paint
                won&apos;t clash with your trim or cabinets.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-blue">Browse colors &rarr;</span>
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
                Pick one color you love and get a designer-quality palette &mdash;
                all mapped to real paints you can buy at the store.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-blue">Build a palette &rarr;</span>
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

        {/* FAQ section */}
        <section className="mt-20 border-t border-gray-100 pt-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Common Questions
            </h2>
            <div className="mt-8 space-y-8">
              {faqItems.map((item) => (
                <div key={item.question}>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.question}
                  </h3>
                  <p className="mt-2 leading-relaxed text-gray-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-gray-400">
              Color data is based on manufacturer-published digital values (hex, RGB). Actual
              pigments, finishes, and lighting conditions vary. Always verify with a physical
              paint sample before purchasing.
            </p>
          </div>
        </section>
      </main>

      {/* Homepage tracking */}
      <TrackPage eventName="page_view_enriched" params={{ page_type: "homepage" }} />

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
              "Free paint color database with 25,000+ colors from 14 brands. Cross-brand matching uses CIEDE2000 Delta E scoring.",
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
              "Free paint color reference database with 25,000+ colors from 14 brands. Uses the CIEDE2000 Delta E formula for cross-brand matching.",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              url: "https://www.paintcolorhq.com/contact",
            },
          }),
        }}
      />

      {/* JSON-LD FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />

      {/* JSON-LD WebApplication for tools */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Room Color Visualizer",
              url: "https://www.paintcolorhq.com/tools/room-visualizer",
              applicationCategory: "DesignApplication",
              operatingSystem: "Web browser",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description: "Preview 25,000+ paint colors on walls, trim, and floor in a realistic room scene.",
            },
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Photo Color Identifier",
              url: "https://www.paintcolorhq.com/tools/color-identifier",
              applicationCategory: "DesignApplication",
              operatingSystem: "Web browser",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description: "Upload a photo and identify the closest matching paint colors from 14 brands.",
            },
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Palette Generator",
              url: "https://www.paintcolorhq.com/tools/palette-generator",
              applicationCategory: "DesignApplication",
              operatingSystem: "Web browser",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description: "Generate coordinated color palettes mapped to real purchasable paint colors.",
            },
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Paint Calculator",
              url: "https://www.paintcolorhq.com/tools/paint-calculator",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web browser",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description: "Calculate how many gallons of paint you need based on room dimensions.",
            },
          ]),
        }}
      />

      <AdSenseScript />
      <Footer />
    </div>
  );
}

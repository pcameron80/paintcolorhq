import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { InspirationSection } from "@/components/inspiration-section";
import { TrackPage } from "@/components/track-page";
import { AdSenseScript } from "@/components/adsense-script";
import { getAllPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Find & Compare Paint Colors Across 13 Brands",
  description:
    "Discover paint colors you love from 26,000+ shades across our paint catalog, preview them on a wall, and find your color in the brand you can buy — free, no signup.",
  alternates: { canonical: "https://www.paintcolorhq.com/" },
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

// Ordered discover-first: find a color → expand it → see it on a wall →
// refine → find it in a buyable brand (the closer) → calculate how much.
const tools = [
  {
    name: "Photo Color Identifier",
    description: "Snap a photo of any color you love — a pillow, a sunset, a Pinterest pin — and find the closest paint match.",
    href: "/tools/color-identifier",
    cta: "Upload a photo",
  },
  {
    name: "Palette Generator",
    description: "Pick one color you love and get a designer-quality palette — all mapped to real paints you can buy at the store.",
    href: "/tools/palette-generator",
    cta: "Build a palette",
  },
  {
    name: "Room Visualizer",
    description: "Preview any color on main walls, accent walls, and trim in a realistic room scene before you buy a single sample pot.",
    href: "/tools/room-visualizer",
    cta: "Try it free",
  },
  {
    name: "Undertone Analysis",
    description: "Every color tagged warm, cool, or neutral — so your new paint won't clash with your trim or cabinets.",
    href: "/colors",
    cta: "Browse colors",
  },
  {
    name: "Cross-Brand Matching",
    description: "Found the one but it's the wrong brand for your store? Find the closest Sherwin-Williams, Behr, PPG, or Benjamin Moore match in seconds.",
    href: "/search",
    cta: "Find a match",
  },
  {
    name: "Paint Calculator",
    description: "Enter your room dimensions and get an estimate of the gallons you need. Accounts for doors, windows, and coats.",
    href: "/tools/paint-calculator",
    cta: "Calculate now",
  },
];

export const revalidate = 604800; // 7d — static index page

const faqItems = [
  {
    question: "How does cross-brand color matching work?",
    answer:
      "We use CIEDE2000 to compare digital color values across brands. A lower score means closer digital values. Paint formulas, finishes, and room lighting can change the result, so always test physical samples.",
  },
  {
    question: "How much paint do I need?",
    answer:
      "The Paint Calculator computes an estimate of the gallons needed based on your room dimensions, number of coats, and door/window cutouts. One gallon of paint covers approximately 350–400 square feet.",
  },
  {
    question: "What are paint color undertones?",
    answer:
      "Every color has a hidden tint — warm (yellow/pink), cool (blue/gray), or neutral — that shows up under different lighting. All 26,000+ colors in our database are tagged so you can filter by undertone and avoid clashing with your existing trim, flooring, or cabinets.",
  },
];

function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />

      {/* Hero — Intentional Asymmetry */}
      <section className="relative pt-24 px-6 md:px-12 py-20 flex flex-col lg:flex-row gap-12 items-center max-w-7xl mx-auto overflow-hidden">
        <div className="lg:w-1/2 z-10">
          <span className="inline-block px-3 py-1 bg-surface-container-highest text-primary text-[10px] uppercase tracking-[0.2em] font-bold mb-6 rounded">
            26,000+ colors &middot; multiple brands &middot; 100% free
          </span>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mb-8">
            Find a Paint Color You Love<br />
            <span className="text-primary italic">in Any Brand.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-md mb-10 leading-relaxed">
            Browse 26,000+ shades across our paint catalog, explore digital room previews, then find a close digital match in the brand you can actually buy.
          </p>
          <form action="/search" role="search" className="max-w-xl">
            <label htmlFor="home-color-search" className="block text-sm font-semibold mb-3">Enter a paint name, number, or hex code</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input id="home-color-search" name="q" type="search" required maxLength={120} placeholder="Try Sea Salt or SW 6204" className="min-w-0 flex-1 bg-white border border-outline-variant rounded-xl px-4 py-4 text-base text-on-surface focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" />
              <button type="submit" className="bg-primary text-on-primary px-6 py-4 rounded-xl font-bold focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">Find colors</button>
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">Just exploring? <Link href="/brands" className="text-primary underline underline-offset-4">Browse by brand</Link> or <Link href="/colors" className="text-primary underline underline-offset-4">explore color families</Link>.</p>
          </form>
        </div>

        <div className="lg:w-1/2 relative h-[400px] sm:h-[500px] lg:h-[600px] w-full">
          <div className="absolute top-0 right-0 w-4/5 h-4/5 rounded-xl overflow-hidden shadow-2xl z-0">
            <Image
              src="/hero.webp"
              alt="Modern interior with architectural paint"
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 80vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-0 left-0 w-2/5 h-1/2 rounded-xl overflow-hidden shadow-2xl z-20 border-8 border-surface">
            <Image
              src="/hero-brush.webp"
              alt="Close up of a paint brush with blue paint"
              fill
              sizes="(max-width: 1024px) 60vw, 25vw"
              className="object-cover"
            />
          </div>
          <p className="absolute bottom-0 right-0 max-w-[55%] text-right text-xs text-on-surface-variant">Room inspiration. Paint colors in these photos are not identified.</p>
        </div>
      </section>

      {/* Tools — Bento Grid */}
      <section className="py-24 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="font-headline text-4xl font-bold tracking-tighter text-on-surface">
              Everything You Need to<br />Choose the Right Color
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500"
              >
                <h3 className="font-headline font-bold text-lg text-on-surface mb-3 group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  {tool.description}
                </p>
                <span className="text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  {tool.cta} <span>&rarr;</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Curated Brands — Tonal Transition */}
      <section className="bg-surface py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Browse by Brand</h2>
              <p className="text-on-surface-variant mt-2">Explore colors from trusted paint manufacturers.</p>
            </div>
            <Link href="/brands" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              All brands <span>&rarr;</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brands.map((brand) => (
              <Link key={brand.slug} href={`/brands/${brand.slug}`} className="flex items-center justify-center p-5 min-h-24 bg-surface-container-lowest rounded-xl hover:shadow-md transition-shadow">
                <span className="font-headline font-bold text-base text-on-surface text-center">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Color Families */}
      <section className="py-16 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-8">Browse by Color Family</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {colorFamilies.map((family) => (
              <Link
                key={family.slug}
                href={`/colors/family/${family.slug}`}
                className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:shadow-md hover:text-primary group"
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full ${family.border ? "border border-outline-variant/30" : ""}`}
                  style={{ backgroundColor: family.color }}
                />
                {family.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Inspiration — Tonal Canvas */}
      <section className="bg-tertiary-fixed py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Inspiration</span>
            <h2 className="font-headline text-4xl font-bold mt-2 text-on-surface">Color Palettes to Spark Your Next Project</h2>
          </div>
          <InspirationSection />
        </div>
      </section>

      {/* Blog — The Architectural Journal */}
      <section className="py-24 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex justify-between items-end">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">Insights</span>
              <h2 className="font-headline text-4xl font-bold mt-2 text-on-surface">The Color Journal</h2>
            </div>
            <Link href="/blog" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              All articles <span>&rarr;</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {getAllPosts().slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group cursor-pointer">
                <div className="aspect-[16/10] overflow-hidden rounded-lg mb-6">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={600}
                      height={375}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: post.coverColor }}
                    />
                  )}
                </div>
                <h3 className="font-headline font-bold text-xl mb-3 leading-tight group-hover:text-primary transition-colors text-on-surface">
                  {post.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Compare Tool Teaser */}
      <section className="py-24 px-6 md:px-12 bg-surface overflow-hidden">
        <div className="max-w-5xl mx-auto bg-surface-container-low rounded-[2rem] p-8 md:p-12 relative flex flex-col md:flex-row items-center gap-12 border border-outline-variant/15">
          <div className="md:w-1/2">
            <h2 className="font-headline text-3xl font-bold mb-6 text-on-surface">Side-by-Side Color Comparison</h2>
            <p className="text-on-surface-variant mb-8">
              See how any two colors look next to each other. Compare their digital values, then test physical samples in your own lighting.
            </p>
            <Link
              href="/compare"
              className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm tracking-tight shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            >
              Try the Compare Tool
            </Link>
          </div>
          <div className="md:w-1/2 relative h-64 w-full flex items-center justify-center">
            <div className="w-36 h-52 bg-primary rounded-xl rotate-[-6deg] absolute z-10 shadow-xl border-4 border-white" />
            <div className="w-36 h-52 bg-secondary rounded-xl rotate-[6deg] absolute z-20 shadow-xl border-4 border-white backdrop-blur-md opacity-80" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Common Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item) => (
              <div key={item.question} className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
                <h3 className="font-headline text-lg font-bold text-on-surface">
                  {item.question}
                </h3>
                <p className="mt-3 leading-relaxed text-on-surface-variant">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-outline">
            Color data is based on manufacturer-published digital values (hex, RGB). Actual
            pigments, finishes, and lighting conditions vary. Always verify with a physical
            paint sample before purchasing.
          </p>
        </div>
      </section>

      <TrackPage eventName="page_view_enriched" params={{ page_type: "homepage" }} />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Paint Color HQ",
        url: "https://www.paintcolorhq.com",
        description: "Discover, preview, and compare 26,000+ paint colors across our paint catalog — find a color you love, see it on a wall, and get it in the brand you can buy. Cross-brand matches use CIEDE2000 Delta E. Free, no signup.",
        potentialAction: {
          "@type": "SearchAction",
          // Plain URL string is the current Sitelinks Searchbox spec — the
          // older `EntryPoint` object form still works but triggers a Rich
          // Results Test warning.
          target: "https://www.paintcolorhq.com/search?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      }} />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Paint Color HQ",
        url: "https://www.paintcolorhq.com",
        logo: "https://www.paintcolorhq.com/logo.webp",
        description: "Paint Color HQ helps you discover, preview, and compare 26,000+ paint colors across our paint catalog, then find your color in the brand you can buy. Cross-brand matches use the CIEDE2000 Delta E formula. Free, no signup.",
        sameAs: ["https://www.pinterest.com/paintcolorhq", "https://www.linkedin.com/company/paint-color-hq"],
        founder: {
          "@type": "Person",
          name: "Philip Cameron",
          url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff",
          jobTitle: "Founder, Paint Color HQ",
          sameAs: ["https://www.linkedin.com/in/philip-a-cameron/", "https://github.com/pcameron80"],
        },
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: "https://www.paintcolorhq.com/contact" },
      }} />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }} />

      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Room Color Visualizer", url: "https://www.paintcolorhq.com/tools/room-visualizer", applicationCategory: "DesignApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Preview 26,000+ paint colors on main walls, accent walls, and trim in a realistic room scene." },
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Photo Color Identifier", url: "https://www.paintcolorhq.com/tools/color-identifier", applicationCategory: "DesignApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Upload a photo and identify the closest matching paint colors from our catalog." },
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Palette Generator", url: "https://www.paintcolorhq.com/tools/palette-generator", applicationCategory: "DesignApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Generate coordinated color palettes mapped to real purchasable paint colors." },
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Paint Calculator", url: "https://www.paintcolorhq.com/tools/paint-calculator", applicationCategory: "UtilityApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Calculate how many gallons of paint you need based on room dimensions." },
      ]} />

      <AdSenseScript />
      <Footer />
    </div>
  );
}

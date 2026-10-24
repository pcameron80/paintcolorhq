import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { getColorById, getColorBySlug } from "@/lib/queries";
import { TrackedLink } from "@/components/tracked-link";
import { CompareClient } from "./compare-client";
import { SamplizeOffer } from "@/components/samplize-offer";

interface PageProps { searchParams: Promise<{ color1?: string; color2?: string }>; }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { color1, color2 } = await searchParams;
  const hasParams = Boolean(color1 || color2);
  return {
    title: "Compare Paint Colors Side by Side",
    description: "Put two paint colors side by side: swatches, hex, RGB and LRV, plus a plain-language verdict on how close they are. Works across brands.",
    alternates: { canonical: "https://www.paintcolorhq.com/compare" },
    // Parametric compare URLs are combinatorial thin-content — keep them out of the index
    // (robots.txt Disallow blocks crawl, not indexing). Mirrors /search behaviour.
    ...(hasParams && { robots: { index: false, follow: true } }),
    openGraph: { title: "Compare Paint Colors Side by Side", description: "Put two paint colors side by side: swatches, hex, RGB and LRV, plus a plain-language verdict on how close they are. Works across brands.", url: "https://www.paintcolorhq.com/compare" },
  };
}

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// Shown on the empty tool so a visitor can see a result in one click. Most
// visits that landed on bare /compare left without comparing (Plausible,
// 2026-10-20 to 23). These are the head-term pairs people decide between.
// Slugs verified against the colors table 2026-10-23.
const POPULAR_PAIRS: [string, string][] = [
  ["sherwin-williams/agreeable-gray-7029", "sherwin-williams/accessible-beige-7036"],
  ["benjamin-moore/white-dove-oc-17", "sherwin-williams/alabaster-7008"],
  ["sherwin-williams/repose-gray-7015", "sherwin-williams/agreeable-gray-7029"],
  ["benjamin-moore/chantilly-lace-2121-70", "sherwin-williams/pure-white-7005"],
  ["benjamin-moore/revere-pewter-hc-172", "benjamin-moore/edgecomb-gray-hc-173"],
  ["benjamin-moore/hale-navy-hc-154", "sherwin-williams/naval-6244"],
  ["sherwin-williams/iron-ore-7069", "sherwin-williams/tricorn-black-6258"],
  ["benjamin-moore/simply-white-2143-70", "sherwin-williams/extra-white-7006"],
  ["benjamin-moore/pale-oak-oc-20", "benjamin-moore/classic-gray-1548"],
];

async function loadPopularPairs() {
  const bySlug = async (key: string) => {
    const [brand, slug] = key.split("/");
    return getColorBySlug(brand, slug);
  };
  const pairs = await Promise.all(POPULAR_PAIRS.map(async ([a, b]) => [await bySlug(a), await bySlug(b)] as const));
  return pairs.filter((p): p is readonly [NonNullable<typeof p[0]>, NonNullable<typeof p[1]>] => Boolean(p[0] && p[1]));
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { color1: color1Id, color2: color2Id } = await searchParams;
  const [color1, color2] = await Promise.all([
    color1Id ? getColorById(color1Id) : null,
    color2Id ? getColorById(color2Id) : null,
  ]);
  const popularPairs = color1 && color2 ? [] : await loadPopularPairs();

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Paint Color Comparison Tool",
        description: "Compare any two paint colors side by side with hex codes, RGB values, LRV, and Delta E similarity scores.",
        url: "https://www.paintcolorhq.com/compare",
        applicationCategory: "DesignApplication", operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "PaintColorHQ", url: "https://www.paintcolorhq.com" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Compare Paint Colors", item: "https://www.paintcolorhq.com/compare" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Compare Colors
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Search for two paint colors to compare them side by side with Delta E similarity scores.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Keyed on the pair so a popular-pair click (same route, new params)
              remounts the client with the new colors instead of keeping its
              old useState values. */}
          <CompareClient
            key={`${color1?.id ?? ""}|${color2?.id ?? ""}`}
            initialColor1={color1}
            initialColor2={color2}
          />
          {popularPairs.length > 0 && (
            <div className="mt-12">
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Popular comparisons</h2>
              <p className="mt-2 mb-6 text-sm text-on-surface-variant">Colors people often decide between. Open one to see the side-by-side verdict.</p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {popularPairs.map(([a, b]) => (
                  <li key={`${a.id}-${b.id}`}>
                    <TrackedLink
                      href={`/compare?color1=${a.id}&color2=${b.id}`}
                      className="flex items-center gap-3 rounded-xl border border-outline-variant/30 p-3 hover:shadow-md transition-all"
                      eventName="cta_click"
                      eventParams={{ cta_label: "compare_popular_pair", color_1: a.name, color_2: b.name }}
                    >
                      <span className="flex shrink-0">
                        <span className="h-10 w-10 rounded-l-lg border border-black/10" style={{ backgroundColor: a.hex }} />
                        <span className="h-10 w-10 rounded-r-lg border border-l-0 border-black/10" style={{ backgroundColor: b.hex }} />
                      </span>
                      <span className="text-sm leading-tight">
                        <span className="block font-semibold text-on-surface">{a.name} vs {b.name}</span>
                        <span className="block text-xs text-on-surface-variant">{a.brand.name === b.brand.name ? a.brand.name : `${a.brand.name} vs ${b.brand.name}`}</span>
                      </span>
                    </TrackedLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <SamplizeOffer sid="compare" intro="Deciding between these two?" />
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-3xl mx-auto text-on-surface-variant leading-relaxed">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">Reading the comparison</h2>
          <p className="mb-4">We compare digital color values using CIEDE2000. Lower scores mean closer digital approximations; they do not certify a physical paint match.</p>
          <p className="mb-4">Do not use a digital score to approve a touch-up. Compare physical samples in the intended finish and lighting; substrate, tinting and aging can change the result.</p>
          <p className="mb-4">LRV (Light Reflectance Value) shows how much light the paint reflects — 0 for pure black, 100 for pure white. Two colors within 5–10 LRV points will read similarly under the same lighting, even if their hex values differ. That matters when you&apos;re trying to keep a room feeling balanced across walls, trim, and ceiling.</p>
          <p>Common uses: checking whether two &ldquo;white&rdquo; paints (Chantilly Lace vs. Simply White) actually differ on the wall, confirming a competitor match before buying gallons, or verifying trim-to-wall contrast before committing.</p>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

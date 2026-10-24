import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { getColorById, getColorsBySlugList } from "@/lib/queries";
import { CompareClient, type PairColor } from "./compare-client";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { SamplizeOffer } from "@/components/samplize-offer";
import { CLOSENESS_LABELS } from "@/lib/closeness";

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

// The three verdict names come from closeness.ts so a renamed label shows up
// here too. No thresholds are printed: the page states the verdict, not a score.
const [v1, v2, v3] = CLOSENESS_LABELS.map((l) => l.toLowerCase());
const VERDICT_LIST = `${v1}, ${v2} or ${v3}`;

// Shared by the intro and the WebApplication JSON-LD so the two cannot drift.
const INTRO = "Compare any two paint colors side by side with hex codes, RGB values, LRV, and a plain-language verdict on how close they are, based on CIEDE2000.";

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

// One query per brand instead of one per color: the list now renders under a
// result too, so it loads on every visit, not only on the empty tool.
async function loadPopularPairs(): Promise<[PairColor, PairColor][]> {
  const slugsByBrand = new Map<string, Set<string>>();
  for (const key of POPULAR_PAIRS.flat()) {
    const [brand, slug] = key.split("/");
    if (!slugsByBrand.has(brand)) slugsByBrand.set(brand, new Set());
    slugsByBrand.get(brand)!.add(slug);
  }
  const found = new Map<string, PairColor>();
  await Promise.all(
    [...slugsByBrand].map(async ([brand, slugs]) => {
      // A missing example pair is not worth failing the page over.
      const rows = await getColorsBySlugList(brand, [...slugs]).catch(() => []);
      for (const c of rows) {
        found.set(`${brand}/${c.slug}`, { id: c.id, name: c.name, hex: c.hex, brandName: c.brand.name });
      }
    }),
  );
  return POPULAR_PAIRS.flatMap(([a, b]) => {
    const ca = found.get(a);
    const cb = found.get(b);
    return ca && cb ? [[ca, cb] as [PairColor, PairColor]] : [];
  });
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { color1: color1Id, color2: color2Id } = await searchParams;
  const [color1, color2] = await Promise.all([
    color1Id ? getColorById(color1Id) : null,
    color2Id ? getColorById(color2Id) : null,
  ]);
  const popularPairs = await loadPopularPairs();

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Paint Color Comparison Tool",
        description: INTRO,
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

      {/* Tighter on phones than the other tool heroes so the verdict, which
          sits right under the pickers, lands in the first screen at 390x844. */}
      <section className="relative px-6 pt-20 pb-2 md:px-12 md:pt-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.95] mt-2 mb-3 md:mb-4">
            Compare Paint Colors Side by Side
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
            {INTRO}
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
            popularPairs={popularPairs}
          />
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
          <p className="mb-4">We compare digital color values using CIEDE2000 and give every pair one of three verdicts: {VERDICT_LIST}. The verdict describes how close two digital values are; it does not certify a physical paint match.</p>
          <p className="mb-4">Do not use a digital score to approve a touch-up. Compare physical samples in the intended finish and lighting; substrate, tinting and aging can change the result.</p>
          <p className="mb-4">LRV (Light Reflectance Value) shows how much light the paint reflects: 0 for pure black, 100 for pure white. Two colors within 5 to 10 LRV points will read similarly under the same lighting, even if their hex values differ. That matters when you&apos;re trying to keep a room feeling balanced across walls, trim, and ceiling.</p>
          <p>Common uses: checking whether two &ldquo;white&rdquo; paints (Chantilly Lace vs. Simply White) actually differ on the wall, confirming a competitor match before buying gallons, or verifying trim-to-wall contrast before committing.</p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <ToolCrossSell exclude="compare" />
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

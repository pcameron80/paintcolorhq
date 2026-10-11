import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { TrackPage } from "@/components/track-page";
import { MatchHubPicker } from "@/components/match-hub-picker";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { getAllBrands } from "@/lib/queries";
import { MAJOR_MATCH_BRANDS } from "@/lib/popular-colors";

export const revalidate = 2592000;

const TITLE = "Paint Color Match: Find Any Color in Another Brand";
const DESCRIPTION =
  "Match a paint color from Sherwin-Williams, Benjamin Moore, Behr and 4 more brands to its closest equivalent. Free CIEDE2000 color matching across 26,000+ colors.";
const URL = "https://www.paintcolorhq.com/match";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
};

// Most-searched pairs first (both directions), then the remaining pairs in brand order.
const PRIORITY_PAIRS: [string, string][] = [
  ["sherwin-williams", "benjamin-moore"],
  ["sherwin-williams", "behr"],
  ["benjamin-moore", "behr"],
  ["sherwin-williams", "valspar"],
  ["benjamin-moore", "valspar"],
  ["behr", "valspar"],
  ["sherwin-williams", "ppg"],
  ["behr", "ppg"],
];

function orderedPairs(): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  const add = (a: string, b: string) => {
    const key = `${a}|${b}`;
    if (a === b || seen.has(key)) return;
    seen.add(key);
    out.push([a, b]);
  };
  for (const [a, b] of PRIORITY_PAIRS) {
    add(a, b);
    add(b, a);
  }
  for (const a of MAJOR_MATCH_BRANDS) for (const b of MAJOR_MATCH_BRANDS) add(a, b);
  return out;
}

const FAQS = [
  {
    q: "How do I match a paint color to another brand?",
    a: "Pick the brand your color comes from and the brand you want to buy in, then type the color name or number. Paint Color HQ opens that color's match page, which lists the closest colors in the other brand ranked by how similar they look.",
  },
  {
    q: "Can I match Sherwin-Williams paint to Benjamin Moore or Behr?",
    a: "Yes. Every pair among Sherwin-Williams, Benjamin Moore, Behr, PPG, Valspar, Dunn-Edwards and Farrow & Ball has its own match listing, in both directions. Benjamin Moore to Sherwin-Williams is the most visited, followed by Sherwin-Williams to Benjamin Moore.",
  },
  {
    q: "How close is a digital paint match?",
    a: "Each match is labeled in plain language: nearly identical, very similar, same family, or test with sample. The label comes from a CIEDE2000 (Delta E 2000) color difference calculated on the digital color values of both paints. It tells you which color is closest on screen, not how the dried paint will look on your wall.",
  },
  {
    q: "Do I still need a physical sample?",
    a: "Yes. Screens, lighting, sheen and the base used to mix a color all change how paint looks. Use the match as a shortlist, then put a physical sample of the new brand's color next to your existing wall before you buy a gallon.",
  },
  {
    q: "Can I match a paint color from a photo?",
    a: "Yes. The Photo Color Identifier reads the color at any point you click in an uploaded photo and returns the closest paint colors across all 13 brands we carry.",
  },
];

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function MatchHubPage() {
  const all = await getAllBrands();
  const brands = MAJOR_MATCH_BRANDS.map((slug) => all.find((b) => b.slug === slug))
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .map((b) => ({ slug: b.slug, name: b.name }));
  const nameOf = (slug: string) => brands.find((b) => b.slug === slug)?.name ?? slug;
  const pairs = orderedPairs().filter(([a, b]) => brands.some((x) => x.slug === a) && brands.some((x) => x.slug === b));

  return (
    <div className="min-h-screen bg-surface">
      <TrackPage eventName="page_view_enriched" params={{ page_type: "match_hub" }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebPage",
        name: TITLE, description: DESCRIPTION, url: URL,
        isPartOf: { "@type": "WebSite", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Paint Color Match", item: URL },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">Paint Color Match</span>
          </nav>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface mb-4">
            Paint Color Match
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed mb-8">
            Find the closest equivalent of a paint color in another brand. Choose where your color comes from and where you want to buy,
            type the color name or number, and get the matches ranked by how similar they look. Covers {brands.length} major brands
            and 26,000+ colors.
          </p>
          <MatchHubPicker brands={brands} />
          <p className="mt-6 text-sm text-on-surface-variant">
            Starting from a photo instead?{" "}
            <Link href="/tools/color-identifier" className="text-primary font-semibold hover:underline underline-offset-4">
              Match a color from a photo
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-2">Match by brand pair</h2>
          <p className="text-on-surface-variant max-w-2xl mb-8">
            Every pair has its own listing of the closest matches. The most used pairs come first.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.map(([a, b]) => (
              <li key={`${a}-${b}`}>
                <Link
                  href={`/match/${a}/to/${b}`}
                  className="block rounded-xl bg-surface-container-lowest border border-outline-variant/10 px-5 py-4 font-headline font-bold text-on-surface hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {nameOf(a)} to {nameOf(b)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-4">How paint color matching works</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Every color in our database has a digital value. To match two colors, we convert both to CIELAB space and calculate
              the CIEDE2000 color difference (Delta E 2000), the standard formula for how far apart two colors look to the human eye.
              Each match page lists the closest colors in the other brand, nearest first.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Instead of showing the raw number, each match gets a plain label: <strong>nearly identical</strong>,{" "}
              <strong>very similar</strong>, <strong>same family</strong>, or <strong>test with sample</strong>. A close digital match
              between two brands is common, but an exact one is not guaranteed, because each brand mixes from its own bases and colorants.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              A digital match is a shortlist, not a final answer. Screen calibration, room lighting and sheen all change the result, so
              confirm any match with a physical sample on your wall before buying paint. Details are on the{" "}
              <Link href="/methodology" className="text-primary hover:underline underline-offset-4">methodology page</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-6">Paint color match questions</h2>
            <dl className="space-y-6">
              {FAQS.map((f) => (
                <div key={f.q}>
                  <dt className="font-headline font-bold text-on-surface mb-1">{f.q}</dt>
                  <dd className="text-on-surface-variant leading-relaxed">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <ToolCrossSell exclude="" />
        </div>
      </section>

      <Footer />
      <AdSenseScript />
    </div>
  );
}

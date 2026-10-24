import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import study from "@/data/duplication-study.json";
import { LIGHTEST_WHITES } from "@/data/lightest-whites";

// Every figure on this page comes from one dated run of the duplication study
// (scripts/study-duplication.ts writes src/data/duplication-study.json), so the
// total, the per-brand counts and the findings always agree. Re-run the script
// and redeploy to refresh them; the "as of" month follows the run date.

const fmt = (n: number) => n.toLocaleString("en-US");
const AS_OF = new Date(`${study.runDate}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const TOTAL = fmt(study.totals.colors);
const BRAND_COUNT = study.totals.brands;

export const metadata: Metadata = {
  title: "Paint Color Statistics (2026): 13 Brands by the Numbers",
  description: `How many paint colors exist? Data on ${TOTAL} colors across ${BRAND_COUNT} brands: duplication rates, the most original palette, reused names, and the lightest whites.`,
  alternates: { canonical: "https://www.paintcolorhq.com/paint-color-statistics" },
  openGraph: {
    title: "Paint Color Statistics (2026)",
    description: `${TOTAL} paint colors across ${BRAND_COUNT} brands, measured: cross-brand duplication rates, palette originality, reused names, and the lightest white each brand sells.`,
    type: "website",
    url: "https://www.paintcolorhq.com/paint-color-statistics",
  },
};

// JSON-LD helper: content is server-generated from trusted data only.
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const STUDY_URL = "/blog/most-duplicated-paint-color";

const byName = (name: string) => study.brands.find((b) => b.name === name)!;
const twinnedPct = (b: { total: number; twinned: number }) => Math.round((1000 * b.twinned) / b.total) / 10;

// Originality: share of a brand's palette with no nearly identical twin
// (CIEDE2000 under 1.0, the tightest half of the Nearly identical band) at any
// other brand. RAL is excluded: it is an industrial color standard, not a
// consumer paint line, so counting its overlap would distort the ranking.
const ORIGINALITY = study.originality;
const MOST_ORIGINAL = ORIGINALITY[0];
const RUNNERS_UP = ORIGINALITY.slice(1, 4);
const RUNNERS_UP_PCT = Math.round(RUNNERS_UP.reduce((s, r) => s + r.uniquePct, 0) / RUNNERS_UP.length);
const LEAST_ORIGINAL = ORIGINALITY[ORIGINALITY.length - 1];
const LEAST_ORIGINAL_TWINNED = twinnedPct(byName(LEAST_ORIGINAL.name));

const largestCurrent = [...study.brands].sort((a, b) => b.current - a.current)[0];
const largestTotal = study.brands[0]; // the JSON is sorted by total, largest first
const topTwoShare = Math.round((100 * (study.brands[0].total + study.brands[1].total)) / study.totals.colors);

// Most intertwined brand pair, larger direction first.
const TOP_PAIR = (() => {
  const p = study.topPairs[0];
  return p.bWithTwinInA >= p.aWithTwinInB
    ? { first: p.b, second: p.a, firstCount: p.bWithTwinInA, secondCount: p.aWithTwinInB }
    : { first: p.a, second: p.b, firstCount: p.aWithTwinInB, secondCount: p.bWithTwinInA };
})();

const listJoin = (items: string[]) => (items.length < 3 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

const [TOP_NAME, ...OTHER_NAMES] = study.reusedNames;
const OTHER_NAMES_LINE = OTHER_NAMES.every((n) => n.brands === OTHER_NAMES[0]?.brands)
  ? `${NUMBER_WORDS[OTHER_NAMES.length] ?? OTHER_NAMES.length} more names appear at ${NUMBER_WORDS[OTHER_NAMES[0]?.brands]?.toLowerCase() ?? OTHER_NAMES[0]?.brands} brands each.`
  : `${OTHER_NAMES.length} more names appear at six or more brands.`;
const PUBLISHED_WHITES = LIGHTEST_WHITES.filter((w) => !w.estimated);
const ESTIMATED_WHITES = LIGHTEST_WHITES.filter((w) => w.estimated);

export default function PaintColorStatisticsPage() {
  const { twins, exactHex, totals } = study;

  const faqs = [
    {
      q: "How many paint colors are there?",
      a: `Paint Color HQ tracks ${TOTAL} named paint colors across ${BRAND_COUNT} major brands as of ${AS_OF}: ${fmt(totals.current)} current colors and ${fmt(totals.retired)} that brands have retired but that can usually still be mixed by code. That count includes duplicates. Only ${twins.noTwinPct}% of those colors (${fmt(twins.noTwin)}) have no nearly identical twin at any other brand.`,
    },
    {
      q: "Which paint brand has the most colors?",
      a:
        largestCurrent.name === largestTotal.name
          ? `${largestTotal.name} has the largest palette of the brands we track, with ${fmt(largestTotal.total)} colors as of ${AS_OF}. The per-brand table on this page shows current and retired counts for every brand.`
          : `${largestCurrent.name} has the largest current palette of the brands we track, with ${fmt(largestCurrent.current)} colors. Counting the ${fmt(largestTotal.retired)} colors ${largestTotal.name} has retired, ${largestTotal.name}'s full catalog of ${fmt(largestTotal.total)} is the largest. The per-brand table on this page shows both figures for every brand, as of ${AS_OF}.`,
    },
    {
      q: "Which paint brand has the most original palette?",
      a: `${MOST_ORIGINAL.name} has the most original palette: ${MOST_ORIGINAL.uniquePct}% of its colors have no nearly identical twin, followed closely by ${listJoin(RUNNERS_UP.map((r) => r.name))} at about ${RUNNERS_UP_PCT}%. ${LEAST_ORIGINAL.name} has the least original palette: ${LEAST_ORIGINAL_TWINNED}% of its colors have a twin at another brand. Figures are as of ${AS_OF}, with RAL excluded because it is an industrial standard rather than a paint line.`,
    },
    {
      q: "How many paint colors are duplicates of each other?",
      a: `As of ${AS_OF}, ${twins.twinnedPct}% of the colors we track (${fmt(twins.twinned)} of ${TOTAL}) have a nearly identical twin at a competing brand, meaning the CIEDE2000 difference falls in the tightest half of our Nearly identical band. Separately, ${fmt(exactHex.hexes)} exact hex values are sold under different names by two or more brands, covering ${fmt(exactHex.colors)} colors. The overlap is heaviest between ${TOP_PAIR.first} and ${TOP_PAIR.second}: ${fmt(TOP_PAIR.firstCount)} ${TOP_PAIR.first} colors have a ${TOP_PAIR.second} twin, and ${fmt(TOP_PAIR.secondCount)} ${TOP_PAIR.second} colors have a ${TOP_PAIR.first} twin.`,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "Paint Color Statistics 2026",
          description: `Aggregate statistics on ${TOTAL} named paint colors across ${BRAND_COUNT} brands: catalog size, cross-brand duplication rates measured with the CIEDE2000 standard, palette originality, reused color names, and each brand's lightest white. Compiled by Paint Color HQ; figures as of ${AS_OF}.`,
          url: "https://www.paintcolorhq.com/paint-color-statistics",
          temporalCoverage: "2026",
          dateModified: study.runDate,
          measurementTechnique: "CIEDE2000 color difference",
          isAccessibleForFree: true,
          creator: {
            "@type": "Organization",
            name: "Paint Color HQ",
            url: "https://www.paintcolorhq.com",
          },
          license: "https://www.paintcolorhq.com/paint-color-statistics#cite",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
            { "@type": "ListItem", position: 2, name: "Paint Color Statistics", item: "https://www.paintcolorhq.com/paint-color-statistics" },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-24 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <nav className="mb-6 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2 text-outline">/</span>
              <span className="text-on-surface">Paint Color Statistics</span>
            </nav>
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Data</span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-6">
              Paint color statistics (2026)
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
              How many paint colors exist, how much brands copy each other, and which palette is the most original, measured across {TOTAL} named colors from {BRAND_COUNT} brands. Every figure comes from one dated run of our study ({AS_OF}), so you can cite them together.
            </p>
          </div>
        </section>

        {/* Citeable summary */}
        <section className="px-6 md:px-12 py-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <p className="text-base text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Short version:</strong> Paint Color HQ tracks {TOTAL} named paint colors across {BRAND_COUNT} brands. As of {AS_OF}, {twins.twinnedPct}% of them ({fmt(twins.twinned)} colors) have a nearly identical twin (in the tightest half of our Nearly identical band) at a competing brand, and {fmt(exactHex.hexes)} exact hex values are sold under different names by two or more brands. {MOST_ORIGINAL.name} has the most original palette, with {MOST_ORIGINAL.uniquePct}% of its colors unique to it; {LEAST_ORIGINAL.name} the least, at {LEAST_ORIGINAL.uniquePct}%.
            </p>
          </div>
        </section>

        {/* Market size */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">How many paint colors are there?</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Paint Color HQ indexes {TOTAL} named colors across {BRAND_COUNT} brands: {fmt(totals.current)} current colors and {fmt(totals.retired)} retired ones that a brand has dropped from its palette but that can usually still be mixed by code. {largestCurrent.name} has the largest current palette; {largestTotal.name} has the largest catalog once its {fmt(largestTotal.retired)} retired colors are counted. {study.brands[0].name} and {study.brands[1].name} alone account for {topTwoShare}% of every color we track. Counts are as of {AS_OF}.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Brand</th>
                    <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Current</th>
                    <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Retired</th>
                    <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {study.brands.map((b) => (
                    <tr key={b.slug} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4">
                        <Link href={`/brands/${b.slug}`} className="text-on-surface hover:text-primary underline-offset-4 hover:underline transition-colors">
                          {b.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right text-on-surface tabular-nums">{fmt(b.current)}</td>
                      <td className="py-3 px-4 text-right text-on-surface-variant tabular-nums">{fmt(b.retired)}</td>
                      <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{fmt(b.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-outline-variant/40">
                    <td className="py-3 pr-4 font-bold text-on-surface">All brands</td>
                    <td className="py-3 px-4 text-right font-bold text-on-surface tabular-nums">{fmt(totals.current)}</td>
                    <td className="py-3 px-4 text-right font-bold text-on-surface tabular-nums">{fmt(totals.retired)}</td>
                    <td className="py-3 pl-4 text-right font-bold text-on-surface tabular-nums">{TOTAL}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Duplication findings */}
        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">How many are duplicates?</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Different brands sell a lot of the same color. We measured every color against every other with the CIEDE2000 standard, which scores the perceptual distance between two colors. We count a pair as twins only when the gap sits in the tightest half of our Nearly identical band, a difference the human eye can barely register. As of {AS_OF}, <strong className="text-on-surface">{twins.twinnedPct}% of colors, {fmt(twins.twinned)} of {TOTAL}, have a nearly identical twin at a competing brand</strong>. The redundancy runs deeper than lookalikes: <strong className="text-on-surface">{fmt(exactHex.hexes)} exact hex values are sold by two or more brands</strong>, covering {fmt(exactHex.colors)} named colors, with up to {exactHex.maxBrands} brands sharing a single hex.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Read the other way, {twins.noTwinPct}% of the catalog ({fmt(twins.noTwin)} colors) has no nearly identical twin at any other brand. We do not publish a single count of &ldquo;distinct&rdquo; colors: near-identity is not transitive, since color A can be a twin of B and B a twin of C while A and C are visibly different, so any such count depends on how the groups are drawn.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              The overlap is not spread evenly. The most intertwined pair is <strong className="text-on-surface">{TOP_PAIR.first} and {TOP_PAIR.second}</strong>: {fmt(TOP_PAIR.firstCount)} {TOP_PAIR.first} colors have a nearly identical {TOP_PAIR.second} counterpart, and {fmt(TOP_PAIR.secondCount)} {TOP_PAIR.second} colors have a {TOP_PAIR.first} one. Separately, we track{" "}
              <Link href="/discontinued" className="text-primary hover:underline underline-offset-4">{fmt(totals.retired)} retired colors</Link>, each mapped to its closest current match. The full method and the color-by-color breakdown are in the{" "}
              <Link href={STUDY_URL} className="text-primary hover:underline underline-offset-4">most-duplicated paint color study</Link>.
            </p>
          </div>
        </section>

        {/* Originality ranking */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Which brand has the most original palette?</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Originality here is the share of a brand&apos;s colors that have no nearly identical twin (in the tightest half of our Nearly identical band) at any other brand: colors you can only get from that brand. {MOST_ORIGINAL.name} leads at {MOST_ORIGINAL.uniquePct}%, with {listJoin(RUNNERS_UP.map((r) => r.name))} close behind at about {RUNNERS_UP_PCT}%. {LEAST_ORIGINAL.name} sits at the bottom: {LEAST_ORIGINAL_TWINNED}% of its colors have a twin elsewhere. Figures are as of {AS_OF}. RAL is excluded because it is an industrial color standard rather than a consumer paint line.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Rank</th>
                    <th className="py-3 px-4 text-[11px] uppercase tracking-widest text-outline font-bold">Brand</th>
                    <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Colors unique to it</th>
                  </tr>
                </thead>
                <tbody>
                  {ORIGINALITY.map((row, i) => (
                    <tr key={row.slug} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4 text-outline tabular-nums">{i + 1}</td>
                      <td className="py-3 px-4 text-on-surface">{row.name}</td>
                      <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{row.uniquePct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Reused names */}
        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">The most reused color names</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Some names are near-universal. &ldquo;{TOP_NAME.name}&rdquo; is the most reused: {TOP_NAME.brands} of the {BRAND_COUNT} brands sell a color under that exact name, though, as the duplication data shows, a shared name does not mean a shared color. {OTHER_NAMES_LINE}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Color name</th>
                    <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Brands using it</th>
                  </tr>
                </thead>
                <tbody>
                  {study.reusedNames.map((row) => (
                    <tr key={row.name} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4 text-on-surface">{row.name}</td>
                      <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{row.brands} of {BRAND_COUNT}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Lightest whites */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">The lightest white each brand sells</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              LRV, or Light Reflectance Value, runs from 0 (absolute black) to 100 (pure white) and measures how much light a color bounces back. Among brands that publish LRV, the whitest whites top out at 94 (Behr Ultra Pure White), with Sherwin-Williams UltraWhite at 93.5 and Dunn-Edwards Warm White at 93. Most brands&apos; lightest whites sit between 89 and 92. We have no published LRV on file for {listJoin(ESTIMATED_WHITES.map((w) => w.brand))}, so those rows show our estimate from each color&apos;s hex value, marked est.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Brand</th>
                    <th className="py-3 px-4 text-[11px] uppercase tracking-widest text-outline font-bold">Whitest color</th>
                    <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">LRV</th>
                    <th className="py-3 pl-4 text-[11px] uppercase tracking-widest text-outline font-bold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {[...PUBLISHED_WHITES, ...ESTIMATED_WHITES].map((row) => (
                    <tr key={row.brandSlug} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4 text-on-surface">{row.brand}</td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        <Link href={`/colors/${row.brandSlug}/${row.slug}`} className="hover:text-primary underline-offset-4 hover:underline transition-colors">
                          {row.name}
                        </Link>{" "}
                        <span className="text-outline">{row.code}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-on-surface tabular-nums whitespace-nowrap">
                        {row.estimated ? row.lrv.toFixed(1) : String(row.lrv)}
                        {row.estimated && <span className="text-outline"> est.</span>}
                      </td>
                      <td className="py-3 pl-4 text-on-surface-variant text-sm">{row.estimated ? "Our estimate" : row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              Published values were checked against each manufacturer&apos;s site in October 2026. The LRV on an individual color page can differ where we still store a value computed from the hex.
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              To browse every current Sherwin-Williams, Benjamin Moore, Behr and Dutch Boy color by LRV, use the{" "}
              <Link href="/tools/lrv-finder" className="text-primary hover:underline underline-offset-4">LRV finder</Link>.
            </p>
          </div>
        </section>

        {/* How to cite */}
        <section id="cite" className="px-6 md:px-12 py-16 bg-surface-container-low scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">How to cite this page</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              These numbers are free to cite and quote with attribution. Cite as:
            </p>
            <p className="text-on-surface leading-relaxed mb-6 pl-4 border-l-2 border-primary">
              Paint Color HQ, &ldquo;Paint Color Statistics,&rdquo; 2026,{" "}
              <Link href="/paint-color-statistics" className="text-primary hover:underline underline-offset-4">https://www.paintcolorhq.com/paint-color-statistics</Link>.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              The catalog counts, duplication and originality figures all come from our {AS_OF} run of the{" "}
              <Link href={STUDY_URL} className="text-primary hover:underline underline-offset-4">duplication study</Link>. That run replaced the July 2026 figures, which were computed before we corrected outdated hex values for about 3,000 Behr, 1,100 Vista Paint and 500 Valspar colors on 2026-10-11. Please quote figures with the month they are dated to.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-8">Frequently asked questions</h2>
            <div className="space-y-8">
              {faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{f.q}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import study from "@/data/duplication-study.json";
import stats from "@/data/palette-stats-study.json";
import { LIGHTEST_WHITES } from "@/data/lightest-whites";

// The figures on this page come from two dated, reproducible runs:
//   - the duplication study (scripts/study-duplication.ts writes
//     src/data/duplication-study.json): catalog size, twins, originality, names;
//   - the palette statistics study (scripts/study-palette-stats.ts writes
//     src/data/palette-stats-study.json and the per-brand CSV in public/data/):
//     published LRV, Color of the Year lightness, hue crowding and retirements.
// Re-run a script and redeploy to refresh its sections; each "as of" month
// follows its own run date. Every sentence below reads its number from the JSON.

const fmt = (n: number) => n.toLocaleString("en-US");
const monthOf = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const AS_OF = monthOf(study.runDate);
const STATS_AS_OF = monthOf(stats.runDate);
const CSV_PATH = "/data/paint-color-statistics-by-brand.csv";
const PAGE_URL = "https://www.paintcolorhq.com/paint-color-statistics";
const TOTAL = fmt(study.totals.colors);
const BRAND_COUNT = study.totals.brands;

export const metadata: Metadata = {
  title: "Paint Color Statistics (2026): 13 Brands by the Numbers",
  description: `How many paint colors exist? Data on ${TOTAL} colors across ${BRAND_COUNT} brands: duplication, originality, how light whites and grays really are, and Color of the Year LRVs.`,
  alternates: { canonical: "https://www.paintcolorhq.com/paint-color-statistics" },
  openGraph: {
    title: "Paint Color Statistics (2026)",
    description: `${TOTAL} paint colors across ${BRAND_COUNT} brands, measured: cross-brand duplication, palette originality, how light colors named white and gray really are, Color of the Year LRVs, and where brands crowd the color wheel.`,
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

// --- Palette statistics study ---
const COV = stats.coverage;
const LRV_BRANDS = listJoin(COV.lrvBrands);
const LRV = stats.lrv;
const LIGHTEST_BRAND = LRV.brands[0];
const DARKEST_BRAND = LRV.brands[LRV.brands.length - 1];
const WHITES = LRV.whites;
const WORST_WHITES = WHITES.byBrand[0];
const BEST_WHITES = WHITES.byBrand[WHITES.byBrand.length - 1];
const WHITE_LRV = Number(stats.method.whiteLrv);
const word = (w: string) => LRV.nameWords.find((n) => n.word === w)!;
const GRAY = word("gray");
const BEIGE = word("beige");
const COTY = stats.coty;
const COTY_BRANDS = listJoin(COTY.brands);
const COTY_LATE_SPAN = `${COTY.late.from} through ${COTY.late.to}`;
const COTY_EARLY_SPAN = `${COTY.early.from} and ${COTY.early.to}`;
const Z = stats.zones;
const TOP_SECTOR = Z.sectors[0];
const BOTTOM_SECTOR = Z.sectors[Z.sectors.length - 1];
const SECTOR_RATIO = (TOP_SECTOR.colors / BOTTOM_SECTOR.colors).toFixed(1);
const GRID_MAX = Math.max(...Z.grid.flatMap((g) => g.bands));
const RETIRED = LRV.retired;
const BEHR_RETIRED = RETIRED.find((r) => r.slug === "behr");
const ONE_IN = Math.round(100 / Z.nearWhite.pct);
const ONE_IN_TEXT = `One in ${NUMBER_WORDS[ONE_IN]?.toLowerCase() ?? ONE_IN}`;
const COTY_LAST_YEAR = COTY.byYear[COTY.byYear.length - 1].year;
const LAST_YEAR_LIGHTEST = COTY.picks.filter((p) => p.year === COTY_LAST_YEAR).reduce((a, b) => (b.lrv > a.lrv ? b : a));
const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);
const pctText = (n: number) => `${n.toFixed(1)}%`;

/** A small color chip; decorative, the name and code carry the meaning. */
function Chip({ hex }: { hex: string }) {
  return <span aria-hidden="true" className="inline-block w-4 h-4 mr-2 align-[-2px] rounded-sm border border-outline-variant/40" style={{ backgroundColor: hex }} />;
}

/** One labeled horizontal bar. The visible label and value are the text alternative; the bar itself is hidden from screen readers. */
function BarRow({ label, value, share, marker }: { label: ReactNode; value: string; share: number; marker?: number }) {
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_auto] sm:grid-cols-[12rem_1fr_auto] items-center gap-3 py-1.5">
      <span className="text-sm text-on-surface truncate">{label}</span>
      <span aria-hidden="true" className="relative h-3 rounded-full bg-surface-container">
        <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, share))}%` }} />
        {marker != null && <span className="absolute -inset-y-1 w-0.5 bg-on-surface" style={{ left: `${marker}%` }} />}
      </span>
      <span className="text-sm text-on-surface tabular-nums text-right min-w-[3.5rem]">{value}</span>
    </li>
  );
}

export default function PaintColorStatisticsPage() {
  const { twins, exactHex, totals } = study;

  const faqs = [
    {
      q: "How many paint colors are there?",
      a: `Paint Color HQ tracks ${TOTAL} named paint colors across ${BRAND_COUNT} major brands as of ${AS_OF}: ${fmt(totals.current)} current colors and ${fmt(totals.retired)} that brands have retired but that can usually still be mixed by code. That count includes duplicates. Only ${twins.noTwinPct}% of those colors (${fmt(twins.noTwin)}) have no nearly identical twin at any other brand.`,
    },
    {
      q: "How white are white paint colors?",
      a: `Less white than the name suggests. As of ${STATS_AS_OF}, ${pctText(WHITES.belowWhiteLrvPct)} of the current colors whose name ends in "White" at ${LRV_BRANDS} (${fmt(WHITES.belowWhiteLrv)} of ${fmt(WHITES.colors)}) have a published LRV below ${WHITE_LRV}. ${WORST_WHITES.name} has the highest share, ${pctText(WORST_WHITES.belowWhiteLrvPct)} (${WORST_WHITES.belowWhiteLrv} of ${WORST_WHITES.whites}), and ${BEST_WHITES.name} the lowest, ${pctText(BEST_WHITES.belowWhiteLrvPct)}. The darkest of them is ${WHITES.darkest[0].brand} ${WHITES.darkest[0].name} at LRV ${WHITES.darkest[0].lrv}.`,
    },
    {
      q: "How dark is the average gray paint color?",
      a: `Darker than most people expect. The median current color with "gray" or "grey" in its name has a published LRV of ${GRAY.medianLrv}, and ${pctText(GRAY.under50Pct)} of them (${GRAY.under50} of ${GRAY.colors}) sit below LRV 50, the middle of the 0 to 100 scale. Colors named beige run lighter, at a median of ${BEIGE.medianLrv}. Figures cover ${LRV_BRANDS}, the brands whose published LRV we hold, as of ${STATS_AS_OF}.`,
    },
    {
      q: "Are Colors of the Year getting darker?",
      a: `For ${COTY_BRANDS}, yes. Their ${COTY.late.picks} picks for ${COTY_LATE_SPAN} average a published LRV of ${COTY.late.meanLrv}, against ${COTY.early.meanLrv} for their ${COTY.early.picks} picks for ${COTY_EARLY_SPAN}, and ${COTY.late.under25} of those ${COTY.late.picks} recent picks sit below LRV 25. It is not a straight line: the ${COTY.byYear[COTY.byYear.length - 1].year} picks average ${COTY.byYear[COTY.byYear.length - 1].meanLrv}, lighter than ${COTY.byYear.reduce((a, b) => (b.meanLrv < a.meanLrv ? b : a)).year}'s ${COTY.byYear.reduce((a, b) => (b.meanLrv < a.meanLrv ? b : a)).meanLrv}.`,
    },
    {
      q: "Which paint brand has the darkest palette?",
      a: `Of the four brands whose published LRV we hold, ${DARKEST_BRAND.name} has the darkest current palette: its median color has an LRV of ${DARKEST_BRAND.medianLrv}, and only ${pctText(DARKEST_BRAND.lrv80PlusPct)} of its colors reach LRV ${WHITE_LRV} or more. ${LIGHTEST_BRAND.name} has the lightest, at a median of ${LIGHTEST_BRAND.medianLrv} with ${pctText(LIGHTEST_BRAND.lrv80PlusPct)} at LRV ${WHITE_LRV} or more. Figures are as of ${STATS_AS_OF}.`,
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
          description: `Aggregate statistics on ${TOTAL} named paint colors across ${BRAND_COUNT} brands: catalog size, cross-brand duplication rates measured with the CIEDE2000 standard, palette originality, reused color names, each brand's lightest white, manufacturer-published LRV by brand and by color name, the LRV of Color of the Year picks from ${COTY.early.from} to ${COTY.late.to}, and how colors are spread across hue and lightness. Compiled by Paint Color HQ; figures as of ${AS_OF} (duplication) and ${STATS_AS_OF} (LRV, hue and retirement).`,
          url: PAGE_URL,
          temporalCoverage: "2026",
          dateModified: [study.runDate, stats.runDate].sort().pop(),
          measurementTechnique: ["CIEDE2000 color difference", "Manufacturer-published Light Reflectance Value (LRV)", "CIELAB lightness, chroma and hue from each brand's published swatch"],
          variableMeasured: [
            "Colors per brand (current and retired)",
            "Share of colors with a nearly identical twin at another brand",
            "Median published LRV of each brand's current palette",
            "Published LRV of colors by name word (white, gray, beige and others)",
            "Published LRV of Color of the Year picks",
            "Colors per hue sector and lightness band",
          ],
          keywords: ["paint colors", "paint color statistics", "LRV", "light reflectance value", "Color of the Year", "Benjamin Moore", "Sherwin-Williams", "Behr"],
          isAccessibleForFree: true,
          creator: {
            "@type": "Organization",
            name: "Paint Color HQ",
            url: "https://www.paintcolorhq.com",
          },
          distribution: [
            {
              "@type": "DataDownload",
              encodingFormat: "text/csv",
              contentUrl: `https://www.paintcolorhq.com${CSV_PATH}`,
              name: "Paint color statistics by brand (CSV)",
            },
          ],
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
              How many paint colors exist, how much brands copy each other, which palette is the most original, and how light colors sold as white or gray really are, measured across {TOTAL} named colors from {BRAND_COUNT} brands. Every figure comes from a dated, reproducible run of one of our two studies ({AS_OF === STATS_AS_OF ? `both ${AS_OF}` : `${AS_OF} and ${STATS_AS_OF}`}), and the per-brand table is <a href={CSV_PATH} className="text-primary hover:underline underline-offset-4" download>free to download as a CSV</a>.
            </p>
          </div>
        </section>

        {/* Citeable summary */}
        <section className="px-6 md:px-12 py-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <p className="text-base text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Short version:</strong> Paint Color HQ tracks {TOTAL} named paint colors across {BRAND_COUNT} brands. As of {AS_OF}, {twins.twinnedPct}% of them ({fmt(twins.twinned)} colors) have a nearly identical twin (in the tightest half of our Nearly identical band) at a competing brand, and {fmt(exactHex.hexes)} exact hex values are sold under different names by two or more brands. {MOST_ORIGINAL.name} has the most original palette, with {MOST_ORIGINAL.uniquePct}% of its colors unique to it; {LEAST_ORIGINAL.name} the least, at {LEAST_ORIGINAL.uniquePct}%.
            </p>
            <p className="text-base text-on-surface-variant leading-relaxed mt-4">
              On light and dark, using only manufacturer-published LRV ({STATS_AS_OF}): {pctText(WHITES.belowWhiteLrvPct)} of current colors whose name ends in &ldquo;White&rdquo; reflect less than {WHITE_LRV}% of light, the median color named gray has an LRV of {GRAY.medianLrv}, and the {COTY.late.picks} Color of the Year picks {COTY_BRANDS} made for {COTY_LATE_SPAN} average an LRV of {COTY.late.meanLrv}, down from {COTY.early.meanLrv} for {COTY_EARLY_SPAN}. {ONE_IN_TEXT} colors we could verify is a near-white neutral.
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
              These are digital matches from each brand&apos;s published swatch values: confirm any substitute with a physical sample before you buy, because sheen and base change how a color reads on the wall. Read the other way, {twins.noTwinPct}% of the catalog ({fmt(twins.noTwin)} colors) has no nearly identical twin at any other brand. We do not publish a single count of &ldquo;distinct&rdquo; colors: near-identity is not transitive, since color A can be a twin of B and B a twin of C while A and C are visibly different, so any such count depends on how the groups are drawn.
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
          </div>
        </section>

        {/* Whites by published LRV */}
        <section id="whites" className="px-6 md:px-12 py-16 bg-surface-container-low scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">How white are white paint colors?</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Just over half are off-whites by that measure. Of the {fmt(WHITES.colors)} current colors at {LRV_BRANDS} whose name ends in &ldquo;White&rdquo;, <strong className="text-on-surface">{fmt(WHITES.belowWhiteLrv)} ({pctText(WHITES.belowWhiteLrvPct)}) have a published LRV below {WHITE_LRV}</strong>, meaning they reflect less than {WHITE_LRV}% of the light that hits them. We use LRV {WHITE_LRV} as the line between a white and an off-white; the median &ldquo;White&rdquo; sits at {WHITES.medianLrv}, right on it.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              The brands differ. <strong className="text-on-surface">{WORST_WHITES.name}: {WORST_WHITES.belowWhiteLrv} of its {WORST_WHITES.whites} &ldquo;Whites&rdquo; ({pctText(WORST_WHITES.belowWhiteLrvPct)}) fall below LRV {WHITE_LRV}</strong>, against {BEST_WHITES.belowWhiteLrv} of {BEST_WHITES.whites} ({pctText(BEST_WHITES.belowWhiteLrvPct)}) at {BEST_WHITES.name}. Figures are as of {STATS_AS_OF}.
            </p>

            <figure className="mb-10">
              <figcaption className="text-sm font-bold text-on-surface mb-3">Share of colors named &ldquo;White&rdquo; with a published LRV below {WHITE_LRV}</figcaption>
              <ul>
                {WHITES.byBrand.map((b) => (
                  <BarRow key={b.slug} label={b.name} value={pctText(b.belowWhiteLrvPct)} share={b.belowWhiteLrvPct} />
                ))}
              </ul>
              <p className="mt-2 text-xs text-on-surface-variant">Current colors whose name ends in White or Whites: {WHITES.byBrand.map((b) => `${b.name} ${b.whites}`).join(", ")}.</p>
            </figure>

            <h3 className="font-headline text-xl font-bold text-on-surface mb-3">The darkest colors sold as a white</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Color</th>
                    <th className="py-3 px-4 text-[11px] uppercase tracking-widest text-outline font-bold">Brand</th>
                    <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Published LRV</th>
                  </tr>
                </thead>
                <tbody>
                  {WHITES.darkest.map((w) => (
                    <tr key={w.slug} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4 text-on-surface">
                        <Chip hex={w.hex} />
                        <Link href={`/colors/${w.brandSlug}/${w.slug}`} className="hover:text-primary underline-offset-4 hover:underline transition-colors">{w.name}</Link> <span className="text-outline">{w.code}</span>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">{w.brand}</td>
                      <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{w.lrv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* LRV by name word */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">How light is a color called gray?</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              A color&apos;s name says little about how light it is. <strong className="text-on-surface">The median current color with &ldquo;gray&rdquo; or &ldquo;grey&rdquo; in its name has a published LRV of {GRAY.medianLrv}, and {GRAY.under50} of {GRAY.colors} ({pctText(GRAY.under50Pct)}) sit below LRV 50</strong>, the middle of the scale. Colors named beige run lighter, at a median of {BEIGE.medianLrv}, and the middle 80% of grays spans LRV {GRAY.p10} to {GRAY.p90}, from charcoal to light gray.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              If you are choosing by name, check the LRV on the color page: two colors called gray can be {Math.round(GRAY.p90 - GRAY.p10)} points apart. Figures cover {LRV_BRANDS}, as of {STATS_AS_OF}.
            </p>

            <figure>
              <figcaption className="text-sm font-bold text-on-surface mb-3">Median published LRV by a word in the color&apos;s name (0 is black, 100 is pure white)</figcaption>
              <ul>
                {LRV.nameWords.map((w) => (
                  <BarRow key={w.word} label={`${w.label} (${fmt(w.colors)})`} value={String(w.medianLrv)} share={w.medianLrv} />
                ))}
              </ul>
              <p className="mt-2 text-xs text-on-surface-variant">Number of current colors in brackets. &ldquo;White&rdquo; counts names ending in White; the other words match anywhere in the name. Words with fewer than 15 colors are left out.</p>
            </figure>
          </div>
        </section>

        {/* LRV by brand */}
        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Which brands sell the lightest and darkest palettes?</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Across the {fmt(COV.currentWithPublishedLrv)} current colors with a published LRV from {LRV_BRANDS}, the median color has an LRV of {LRV.pooledCurrentMedian}. <strong className="text-on-surface">{DARKEST_BRAND.name} runs darkest, at a median of {DARKEST_BRAND.medianLrv}, and only {pctText(DARKEST_BRAND.lrv80PlusPct)} of its current colors reach LRV {WHITE_LRV}</strong>. {LIGHTEST_BRAND.name} runs lightest, at {LIGHTEST_BRAND.medianLrv}, with {pctText(LIGHTEST_BRAND.lrv80PlusPct)} at LRV {WHITE_LRV} or more. {listJoin(COV.lrvPendingBrands)} also publish LRV, but we have not finished reconciling our copies of their values, so they are not ranked here. Figures are as of {STATS_AS_OF}.
            </p>

            <figure className="mb-8">
              <figcaption className="text-sm font-bold text-on-surface mb-3">Median published LRV of each brand&apos;s current palette (the dark line marks the four-brand median, {LRV.pooledCurrentMedian})</figcaption>
              <ul>
                {LRV.brands.map((b) => (
                  <BarRow key={b.slug} label={b.name} value={String(b.medianLrv)} share={b.medianLrv} marker={LRV.pooledCurrentMedian} />
                ))}
              </ul>
            </figure>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Brand</th>
                    <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Colors</th>
                    <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Median LRV</th>
                    <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">LRV {WHITE_LRV}+</th>
                    <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Below LRV 20</th>
                  </tr>
                </thead>
                <tbody>
                  {LRV.brands.map((b) => (
                    <tr key={b.slug} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4 text-on-surface">{b.name}</td>
                      <td className="py-3 px-4 text-right text-on-surface-variant tabular-nums">{fmt(b.colors)}</td>
                      <td className="py-3 px-4 text-right text-on-surface tabular-nums">{b.medianLrv}</td>
                      <td className="py-3 px-4 text-right text-on-surface tabular-nums">{pctText(b.lrv80PlusPct)}</td>
                      <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{pctText(b.lrvUnder20Pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Color of the Year LRV */}
        <section id="color-of-the-year" className="px-6 md:px-12 py-16 scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Colors of the Year have gotten darker</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              <strong className="text-on-surface">The {COTY.late.picks} Color of the Year picks {COTY_BRANDS} made for {COTY_LATE_SPAN} average a published LRV of {COTY.late.meanLrv}, against {COTY.early.meanLrv} for their {COTY.early.picks} picks for {COTY_EARLY_SPAN}.</strong> Of those {COTY.late.picks} recent picks, {COTY.late.under25} sit below LRV 25. The sharpest drop was Behr&apos;s: Blank Canvas, an off-white at LRV {COTY.picks.find((p) => p.slug === "blank-canvas-dc-003")?.lrv}, for 2023, then Cracked Pepper, a soft black at LRV {COTY.picks.find((p) => p.slug === "cracked-pepper-ppu18-01")?.lrv}, for 2024.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              It is not a straight line. The {COTY.byYear[COTY.byYear.length - 1].year} picks average {COTY.byYear[COTY.byYear.length - 1].meanLrv}, lighter than the low of {COTY.byYear.reduce((a, b) => (b.meanLrv < a.meanLrv ? b : a)).meanLrv} in {COTY.byYear.reduce((a, b) => (b.meanLrv < a.meanLrv ? b : a)).year}, mostly because of {possessive(LAST_YEAR_LIGHTEST.brand)} {LAST_YEAR_LIGHTEST.name} at LRV {LAST_YEAR_LIGHTEST.lrv}. Sherwin-Williams named a nine-color capsule for 2025 instead of one color, so that year has two picks. The full list of this year&apos;s picks and their cross-brand matches is on our <Link href="/color-of-the-year" className="text-primary hover:underline underline-offset-4">Color of the Year page</Link>.
            </p>

            <figure>
              <figcaption className="text-sm font-bold text-on-surface mb-3">Published LRV of each Color of the Year pick, {COTY.early.from} to {COTY.late.to}</figcaption>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30">
                      <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Year</th>
                      <th className="py-3 px-4 text-[11px] uppercase tracking-widest text-outline font-bold">Pick</th>
                      <th className="py-3 px-4 text-[11px] uppercase tracking-widest text-outline font-bold w-1/3"><span className="sr-only">Bar</span></th>
                      <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">LRV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COTY.picks.map((p, i) => (
                      <tr key={p.slug} className={`border-b ${i > 0 && COTY.picks[i - 1].year !== p.year ? "border-t-2 border-t-outline-variant/30" : ""} border-outline-variant/15`}>
                        <td className="py-2 pr-4 text-outline tabular-nums">{p.year}</td>
                        <td className="py-2 px-4 text-on-surface">
                          <Chip hex={p.hex} />
                          <Link href={`/colors/${p.brandSlug}/${p.slug}`} className="hover:text-primary underline-offset-4 hover:underline transition-colors">{p.name}</Link> <span className="text-on-surface-variant text-sm">{p.brand}</span>
                        </td>
                        <td className="py-2 px-4" aria-hidden="true">
                          <span className="block h-2.5 rounded-full bg-surface-container">
                            <span className="block h-2.5 rounded-full bg-primary" style={{ width: `${p.lrv}%` }} />
                          </span>
                        </td>
                        <td className="py-2 pl-4 text-right text-on-surface tabular-nums">{p.lrv}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">Year averages: {COTY.byYear.map((y) => `${y.year} ${y.meanLrv}`).join(", ")}.</p>
            </figure>
          </div>
        </section>

        {/* Hue and lightness crowding */}
        <section id="crowding" className="px-6 md:px-12 py-16 bg-surface-container-low scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Where brands crowd the color wheel</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Paint palettes are not spread evenly. Of the {fmt(Z.colors)} colors we could check against each brand&apos;s own palette, <strong className="text-on-surface">{fmt(Z.nearWhite.colors)} ({pctText(Z.nearWhite.pct)}) are near-white neutrals</strong>, the single most crowded spot, and {fmt(Z.neutral.colors)} ({pctText(Z.neutral.pct)}) are near-neutrals of any lightness: whites, grays, greiges and blacks with almost no color in them.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Among colors with a visible hue, warm ones dominate. <strong className="text-on-surface">{TOP_SECTOR.name} hues make up {pctText(TOP_SECTOR.pctOfTinted)} ({fmt(TOP_SECTOR.colors)}), {SECTOR_RATIO} times as many as {BOTTOM_SECTOR.name.toLowerCase()} ({fmt(BOTTOM_SECTOR.colors)}, {pctText(BOTTOM_SECTOR.pctOfTinted)})</strong>. Deep yellows barely exist: the very dark yellow cell holds {Z.grid.find((g) => g.name === TOP_SECTOR.name)?.bands[Z.bands.length - 1]} color{Z.grid.find((g) => g.name === TOP_SECTOR.name)?.bands[Z.bands.length - 1] === 1 ? "" : "s"}, because a yellow that dark turns olive or brown. Figures are as of {STATS_AS_OF}.
            </p>

            <figure>
              <figcaption className="text-sm font-bold text-on-surface mb-3">Number of colors by hue and lightness (darker cells hold more colors)</figcaption>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className="py-2 pr-3 text-left text-[11px] uppercase tracking-widest text-outline font-bold">Hue</th>
                      {Z.bands.map((b) => (
                        <th key={b.name} scope="col" className="py-2 px-1 text-center text-[11px] uppercase tracking-widest text-outline font-bold">{b.name}</th>
                      ))}
                      <th scope="col" className="py-2 pl-3 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Z.grid.map((g) => (
                      <tr key={g.name}>
                        <th scope="row" className="py-1 pr-3 text-left font-normal text-on-surface whitespace-nowrap">{g.name}</th>
                        {g.bands.map((count, i) => {
                          const share = count / GRID_MAX;
                          return (
                            <td
                              key={Z.bands[i].name}
                              className={`py-2 px-1 text-center tabular-nums border border-surface ${share > 0.45 ? "text-on-primary" : "text-on-surface"}`}
                              style={{ backgroundColor: `color-mix(in srgb, var(--color-primary) ${Math.round(6 + 94 * share)}%, transparent)` }}
                            >
                              {fmt(count)}
                            </td>
                          );
                        })}
                        <td className="py-1 pl-3 text-right text-on-surface-variant tabular-nums">{pctText(g.pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">
                Lightness is CIELAB L* of each brand&apos;s published swatch: very light {Z.bands[0].minL}+, light {Z.bands[1].minL} to {Z.bands[1].maxL}, mid {Z.bands[2].minL} to {Z.bands[2].maxL}, dark {Z.bands[3].minL} to {Z.bands[3].maxL}, very dark under {Z.bands[3].minL}. Near-neutral means CIELAB chroma under {Z.neutralChromaMax}; every other color is placed by its hue angle.
              </p>
            </figure>
          </div>
        </section>

        {/* Retired colors */}
        {BEHR_RETIRED && (
          <section className="px-6 md:px-12 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">How many colors are retired but still sold?</h2>
              <p className="text-on-surface-variant leading-relaxed mb-4">
                Brands drop colors from their fan decks without taking them off the mixing machine. <strong className="text-on-surface">Of the {fmt(BEHR_RETIRED.listed)} Behr colors we matched to Behr&apos;s own site, {fmt(BEHR_RETIRED.retired)} ({pctText(BEHR_RETIRED.retiredPct)}) are retired.</strong> When we checked 10 of them in October 2026, Behr&apos;s pages said all 10 could still be bought at The Home Depot. Across all brands we track {fmt(totals.retired)} retired colors, each mapped to its closest current match on our <Link href="/discontinued" className="text-primary hover:underline underline-offset-4">retired colors page</Link>.
              </p>
              <p className="text-on-surface-variant leading-relaxed mb-8">
                What brands retire differs. {RETIRED.map((r) => `${possessive(r.name)} retired colors have a median published LRV of ${r.retiredMedianLrv}, against ${r.currentMedianLrv} for the colors it still promotes`).join("; ")}. Figures are as of {STATS_AS_OF}, counting each code once.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30">
                      <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Brand</th>
                      <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Retired</th>
                      <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Share of listed</th>
                      <th className="py-3 px-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Median LRV, retired</th>
                      <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Median LRV, current</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RETIRED.map((r) => (
                      <tr key={r.slug} className="border-b border-outline-variant/15">
                        <td className="py-3 pr-4 text-on-surface">{r.name}</td>
                        <td className="py-3 px-4 text-right text-on-surface tabular-nums">{fmt(r.retired)}</td>
                        <td className="py-3 px-4 text-right text-on-surface tabular-nums">{pctText(r.retiredPct)}</td>
                        <td className="py-3 px-4 text-right text-on-surface tabular-nums">{r.retiredMedianLrv}</td>
                        <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{r.currentMedianLrv}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Data download and method */}
        <section id="method" className="px-6 md:px-12 py-16 bg-surface-container-low scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Download the data and how we measured it</h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              <a href={CSV_PATH} download className="text-primary font-bold hover:underline underline-offset-4">Download the per-brand table (CSV)</a>: catalog size, current and retired counts, the share of each palette with no nearly identical twin, near-neutral shares, and published-LRV figures for every brand. It is free to use with a link to this page.
            </p>
            <h3 className="font-headline text-lg font-bold text-on-surface mb-2">Method note</h3>
            <ul className="list-disc pl-5 space-y-2 text-on-surface-variant leading-relaxed">
              <li>
                <strong className="text-on-surface">Which colors count.</strong> The LRV, hue and retirement figures use only colors we could check against the manufacturer&apos;s own current palette (scan of {stats.scanDate}): same code, same name, and a stored swatch within CIEDE2000 2 of the brand&apos;s. Each manufacturer code counts once. That leaves {fmt(COV.verified)} of our {fmt(COV.catalog)} rows. RAL ({COV.ral} rows) is not studied: it is an industrial standard, and most of our RAL swatches are off RAL&apos;s own. {fmt(COV.notInFeed + COV.noLiveSource)} rows have no current manufacturer listing to check against, mostly legacy Kilz, Valspar and Behr rows and every Colorhouse row, {COV.nameMismatch} carry a name the brand no longer uses, and {COV.duplicateCode} repeat a code already counted; all are left out.
              </li>
              <li>
                <strong className="text-on-surface">Rows removed after our {stats.auditDate} data audit.</strong> {fmt(COV.flagged)} rows flagged by that audit are excluded from every figure in these sections (some carry more than one flag): {COV.excluded.map((e) => `${e.title} (${e.rows})`).join("; ")}.
              </li>
              <li>
                <strong className="text-on-surface">LRV.</strong> Only manufacturer-published LRV is used: {LRV_BRANDS}. {listJoin(COV.lrvPendingBrands)} publish LRV too, but the values we store for them are still computed from the hex and run up to several points high on whites, so those brands are left out of every LRV figure rather than estimated. Valspar, Kilz, Farrow &amp; Ball and Colorhouse publish none in our sources. The lightest-whites table above uses values checked by hand on each brand&apos;s site.
              </li>
              <li>
                <strong className="text-on-surface">Names, not labels.</strong> &ldquo;Gray&rdquo;, &ldquo;beige&rdquo; and &ldquo;white&rdquo; mean the word in the color&apos;s name. We do not use our stored color-family or undertone labels here, because the audit found both need correcting.
              </li>
              <li>
                <strong className="text-on-surface">Hue and lightness</strong> come from CIELAB values of each brand&apos;s published swatch hex, which is a screen color, not a measured paint sample.
              </li>
              <li>
                <strong className="text-on-surface">Duplication and originality</strong> come from the separate {AS_OF} duplication study, which covers every row; the{" "}
                <Link href={STUDY_URL} className="text-primary hover:underline underline-offset-4">study post</Link> explains that method. Neither study reads match ranks, so it is not affected by the match-order issue the audit found.
              </li>
            </ul>
          </div>
        </section>

        {/* How to cite */}
        <section id="cite" className="px-6 md:px-12 py-16 scroll-mt-24">
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
              <Link href={STUDY_URL} className="text-primary hover:underline underline-offset-4">duplication study</Link>. That run replaced the July 2026 figures, which were computed before we corrected outdated hex values for about 3,000 Behr, 1,100 Vista Paint and 500 Valspar colors on 2026-10-11. The LRV, Color of the Year, hue and retirement figures come from our {STATS_AS_OF} palette statistics run, described in the <a href="#method" className="text-primary hover:underline underline-offset-4">method note</a>. Please quote figures with the month they are dated to.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
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

import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { supabase } from "@/lib/supabase";

export const revalidate = 604800; // 7d — per-brand counts move only when the data pipeline re-runs

export const metadata: Metadata = {
  title: "Paint Color Statistics (2026): 13 Brands by the Numbers",
  description:
    "How many paint colors exist? Data on 26,597 colors across 13 brands — duplication rates, the most original palette, reused names, and how they compare.",
  alternates: { canonical: "https://www.paintcolorhq.com/paint-color-statistics" },
  openGraph: {
    title: "Paint Color Statistics (2026)",
    description:
      "26,597 paint colors across 13 brands, measured: cross-brand duplication rates, palette originality, reused names, and the lightest white each brand sells.",
    type: "website",
    url: "https://www.paintcolorhq.com/paint-color-statistics",
  },
};

// JSON-LD helper — content is server-generated from trusted data only.
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const STUDY_URL = "/blog/most-duplicated-paint-color";

// Findings from the Paint Color HQ cross-brand duplication study (published
// July 2026, linked at STUDY_URL). These are static snapshots, labeled "as of
// July 2026" wherever shown, because the live catalog shifts as brand palettes
// change. Only the market-size table above them is computed live at render.

// Share of each brand's palette with no near-identical match (CIEDE2000 Delta E
// 1.0) at any other brand. RAL is excluded — it is an industrial color standard,
// not a consumer paint line, so counting its overlap would distort the ranking.
const ORIGINALITY_RANKING: { brand: string; uniquePct: number }[] = [
  { brand: "Behr", uniquePct: 48.5 },
  { brand: "Dunn-Edwards", uniquePct: 35.6 },
  { brand: "Kilz", uniquePct: 34.8 },
  { brand: "Valspar", uniquePct: 34.5 },
  { brand: "Benjamin Moore", uniquePct: 34.0 },
  { brand: "PPG", uniquePct: 32.8 },
  { brand: "Colorhouse", uniquePct: 27.3 },
  { brand: "Sherwin-Williams", uniquePct: 26.6 },
  { brand: "Farrow & Ball", uniquePct: 26.3 },
  { brand: "Dutch Boy", uniquePct: 26.1 },
  { brand: "Vista Paint", uniquePct: 19.7 },
  { brand: "Hirshfield's", uniquePct: 8.2 },
];

// Color names sold by the most brands under that exact name.
const REUSED_NAMES: { name: string; brands: number }[] = [
  { name: "Antique White", brands: 8 },
  { name: "Swiss Coffee", brands: 6 },
  { name: "Navajo White", brands: 6 },
  { name: "Citron", brands: 6 },
  { name: "White", brands: 6 },
];

// The lightest white each brand sells, by Light Reflectance Value (0–100).
const LIGHTEST_WHITES: { brand: string; name: string; lrv: number }[] = [
  { brand: "Behr", name: "Ultra Pure White", lrv: 97.3 },
  { brand: "Farrow & Ball", name: "All White", lrv: 94.2 },
  { brand: "Kilz", name: "Ultra Bright White", lrv: 93.3 },
  { brand: "Dutch Boy", name: "Tulle White", lrv: 93.1 },
  { brand: "Hirshfield's", name: "Touch of Sun", lrv: 92.7 },
  { brand: "Valspar", name: "Ultra White", lrv: 92.6 },
  { brand: "Sherwin-Williams", name: "High Reflective White", lrv: 92.6 },
  { brand: "Vista Paint", name: "Touch of Sun", lrv: 91.6 },
  { brand: "Benjamin Moore", name: "Ice Mist", lrv: 90.6 },
  { brand: "PPG", name: "Soft Candlelight", lrv: 88.7 },
];

interface BrandCount {
  name: string;
  slug: string;
  count: number;
}

// Live market-size figures: one query for the brand list, then a cheap
// head-only count per brand (no rows returned, just the total). 13 small
// requests at weekly ISR keeps the grand total current without shipping a
// stale hardcoded number. Sorted largest-first, ties broken alphabetically.
async function getBrandColorCounts(): Promise<{ brands: BrandCount[]; total: number }> {
  const { data: brands, error } = await supabase.from("brands").select("id, name, slug");
  if (error) throw error;

  const counts = await Promise.all(
    (brands ?? []).map(async (b) => {
      const { count } = await supabase
        .from("colors")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", b.id);
      return { name: b.name as string, slug: b.slug as string, count: count ?? 0 };
    })
  );

  counts.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  return { brands: counts, total };
}

export default async function PaintColorStatisticsPage() {
  const { brands, total } = await getBrandColorCounts();
  const totalLabel = total.toLocaleString("en-US");

  const faqs = [
    {
      q: "How many paint colors are there?",
      a: `Paint Color HQ tracks ${totalLabel} named paint colors across 13 major brands. That count includes duplicates; once near-identical colors — those within Delta E 1.0 of another under the CIEDE2000 standard — are collapsed into one, roughly 14,700 are genuinely distinct, about 55% of the catalog, based on our July 2026 analysis.`,
    },
    {
      q: "Which paint brand has the most colors?",
      a: "Behr has the largest catalog of the brands we track, ahead of Benjamin Moore and PPG. The per-brand table on this page shows the current count for each brand and updates as palettes change. Behr also has the most original palette: as of July 2026, 48.5% of its colors have no near-identical match at any other brand.",
    },
    {
      q: "How many paint colors are duplicates of each other?",
      a: "As of July 2026, 66.6% of the colors we track (17,702 of 26,597) have a near-identical twin — within Delta E 1.0 — at a competing brand, and 749 exact hex values are sold under different names by two or more brands. The overlap is heaviest between Behr and Benjamin Moore, which share about 2,400 near-identical colors.",
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
          description:
            "Aggregate statistics on 26,597 named paint colors across 13 brands: catalog size, cross-brand duplication rates measured with the CIEDE2000 standard, palette originality, and reused color names. Compiled by Paint Color HQ.",
          url: "https://www.paintcolorhq.com/paint-color-statistics",
          temporalCoverage: "2026",
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
              How many paint colors exist, how much brands copy each other, and which palette is the most original — measured across {totalLabel} named colors from 13 brands. The catalog figures below are computed live; the study findings are dated so you can cite them cleanly.
            </p>
          </div>
        </section>

        {/* Citeable summary */}
        <section className="px-6 md:px-12 py-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <p className="text-base text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Short version:</strong> Paint Color HQ tracks {totalLabel} named paint colors across 13 brands. As of July 2026, two thirds of them — 66.6%, or 17,702 colors — have a near-identical twin within Delta E 1.0 at a competing brand, and 749 exact hex values are sold under different names by two or more brands. Collapse the near-identical overlap and about 14,700 genuinely distinct colors remain, roughly 55% of the catalog. Behr has the most original palette, with 48.5% of its colors unique to it; Hirshfield&apos;s the least, at 8.2%.
            </p>
          </div>
        </section>

        {/* Market size — LIVE */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">How many paint colors are there?</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Paint Color HQ indexes {totalLabel} named colors across 13 brands. The table below counts every color in each brand&apos;s catalog and refreshes from the live database, so the totals stay current as brands add or retire colors. Behr and Benjamin Moore alone account for more than a third of every color we track.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Brand</th>
                    <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">Colors</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.slug} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4">
                        <Link href={`/brands/${b.slug}`} className="text-on-surface hover:text-primary underline-offset-4 hover:underline transition-colors">
                          {b.name}
                        </Link>
                      </td>
                      <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{b.count.toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-outline-variant/40">
                    <td className="py-3 pr-4 font-bold text-on-surface">All brands</td>
                    <td className="py-3 pl-4 text-right font-bold text-on-surface tabular-nums">{totalLabel}</td>
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
              Different brands sell a lot of the same color. We measured every color against every other with the CIEDE2000 standard, where Delta E is the perceptual distance between two colors and anything under 1.0 is a difference the human eye can barely register. As of July 2026, <strong className="text-on-surface">66.6% of colors — 17,702 of 26,597 — have a near-identical twin at a competing brand</strong>. The redundancy runs deeper than lookalikes: <strong className="text-on-surface">749 exact hex values are sold identically by two or more brands</strong>, covering 1,555 named colors, with up to four brands sharing a single hex.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Strip out the overlap and the catalog shrinks. Collapsing every group of near-identical colors (each member within Delta E 1.0 of its reference) down to one leaves <strong className="text-on-surface">about 14,700 genuinely distinct colors — roughly 55% of the catalog</strong>. Tighten the threshold to Delta E 0.5, a difference almost nobody can see, and about 22,050 colors (around 83%) still stand apart.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              The overlap is not spread evenly. The most intertwined pair is <strong className="text-on-surface">Behr and Benjamin Moore</strong>: roughly 2,400 colors in each brand&apos;s palette have a near-identical counterpart in the other. Separately, we track{" "}
              <Link href="/discontinued" className="text-primary hover:underline underline-offset-4">243 discontinued or archived colors</Link>, each mapped to its closest current match. The full method and the color-by-color breakdown are in the{" "}
              <Link href={STUDY_URL} className="text-primary hover:underline underline-offset-4">most-duplicated paint color study</Link>.
            </p>
          </div>
        </section>

        {/* Originality ranking */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Which brand has the most original palette?</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Originality here is the share of a brand&apos;s colors that have no near-identical match (within Delta E 1.0) at any other brand — colors you can only get from that brand. Behr leads by a wide margin; Hirshfield&apos;s sits at the bottom, with more than nine in ten of its colors matched elsewhere. Figures are as of July 2026. RAL is excluded because it is an industrial color standard rather than a consumer paint line.
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
                  {ORIGINALITY_RANKING.map((row, i) => (
                    <tr key={row.brand} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4 text-outline tabular-nums">{i + 1}</td>
                      <td className="py-3 px-4 text-on-surface">{row.brand}</td>
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
              Some names are near-universal. &ldquo;Antique White&rdquo; is the most reused: 8 of the 13 brands sell a color under that exact name — though, as the duplication data shows, those eight are rarely the same color underneath. Four more names appear at six brands each.
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
                  {REUSED_NAMES.map((row) => (
                    <tr key={row.name} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4 text-on-surface">{row.name}</td>
                      <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{row.brands} of 13</td>
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
              LRV, or Light Reflectance Value, runs from 0 (absolute black) to 100 (pure white) and measures how much light a color bounces back. The brightest white on the market is Behr Ultra Pure White at an LRV of 97.3; the rest of the brands&apos; whitest whites cluster in the low 90s and high 80s.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-3 pr-4 text-[11px] uppercase tracking-widest text-outline font-bold">Brand</th>
                    <th className="py-3 px-4 text-[11px] uppercase tracking-widest text-outline font-bold">Whitest color</th>
                    <th className="py-3 pl-4 text-right text-[11px] uppercase tracking-widest text-outline font-bold">LRV</th>
                  </tr>
                </thead>
                <tbody>
                  {LIGHTEST_WHITES.map((row) => (
                    <tr key={row.brand} className="border-b border-outline-variant/15">
                      <td className="py-3 pr-4 text-on-surface">{row.brand}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{row.name}</td>
                      <td className="py-3 pl-4 text-right text-on-surface tabular-nums">{row.lrv.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              The catalog figures — the total and the per-brand counts — update as brand palettes change, so quote them with the date you accessed the page. The duplication and originality findings are fixed to our{" "}
              <Link href={STUDY_URL} className="text-primary hover:underline underline-offset-4">July 2026 analysis</Link>{" "}
              and are labeled as such throughout.
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

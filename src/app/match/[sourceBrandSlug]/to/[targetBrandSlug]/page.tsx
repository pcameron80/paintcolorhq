import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ColorSwatch } from "@/components/color-swatch";
import { TrackPage } from "@/components/track-page";
import { getBrandBySlug, getTopCrossBrandMatches } from "@/lib/queries";

export const revalidate = 3600;

const MAJOR_BRANDS = ["sherwin-williams", "benjamin-moore", "behr", "valspar", "ppg"];

interface PageProps { params: Promise<{ sourceBrandSlug: string; targetBrandSlug: string }>; }

function getDeltaELabel(deltaE: number): { label: string; shortLabel: string; className: string } {
  if (deltaE < 1) return { label: "Exact Match", shortLabel: "Exact", className: "bg-primary-fixed text-primary" };
  if (deltaE < 2) return { label: "Nearly identical", shortLabel: "Nearly identical", className: "bg-primary-fixed text-primary" };
  if (deltaE < 3) return { label: "Very similar", shortLabel: "Very similar", className: "bg-secondary-fixed text-secondary" };
  if (deltaE < 5) return { label: "Same family", shortLabel: "Same family", className: "bg-tertiary-fixed text-tertiary" };
  return { label: "Test with sample", shortLabel: "Test first", className: "bg-error-container text-error" };
}

export async function generateStaticParams() {
  const params: { sourceBrandSlug: string; targetBrandSlug: string }[] = [];
  for (const source of MAJOR_BRANDS) for (const target of MAJOR_BRANDS) if (source !== target) params.push({ sourceBrandSlug: source, targetBrandSlug: target });
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sourceBrandSlug, targetBrandSlug } = await params;
  const [sourceBrand, targetBrand] = await Promise.all([getBrandBySlug(sourceBrandSlug), getBrandBySlug(targetBrandSlug)]);
  if (!sourceBrand || !targetBrand) return { title: "Brand Match Not Found" };
  const title = `${sourceBrand.name} to ${targetBrand.name} Equivalent Colors | Paint Color HQ`;
  const description = `Switching from ${sourceBrand.name} to ${targetBrand.name}? Find the closest matching colors between the two brands.`;
  const url = `https://www.paintcolorhq.com/match/${sourceBrandSlug}/to/${targetBrandSlug}`;
  const shouldIndex = MAJOR_BRANDS.includes(sourceBrandSlug) && MAJOR_BRANDS.includes(targetBrandSlug);
  return { title, description, alternates: { canonical: url }, ...(!shouldIndex && { robots: { index: false } }), openGraph: { title, description, url } };
}

// JSON-LD helper - all content is server-generated from trusted database values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function BrandToBrandMatchPage({ params }: PageProps) {
  const { sourceBrandSlug, targetBrandSlug } = await params;
  const [sourceBrand, targetBrand] = await Promise.all([getBrandBySlug(sourceBrandSlug), getBrandBySlug(targetBrandSlug)]);
  if (!sourceBrand || !targetBrand) notFound();

  const matches = await getTopCrossBrandMatches(sourceBrandSlug, targetBrandSlug, 50);
  const brandNames: Record<string, string> = { "sherwin-williams": "Sherwin-Williams", "benjamin-moore": "Benjamin Moore", behr: "Behr", valspar: "Valspar", ppg: "PPG" };

  const MATCH_INTROS: Record<string, string> = {
    "sherwin-williams-to-benjamin-moore": "These are the two flagship brands of American interior paint, and this is one of the most frequent transitions designers and contractors make. Both occupy the same premium tier — Sherwin-Williams through 4,000+ company-owned stores, Benjamin Moore exclusively through independent dealers — but they approach color from different starting points. SW tends toward slightly warmer, grayer neutrals; Benjamin Moore's Gennex colorant system produces richer, more saturated tones with exceptional batch-to-batch consistency. Neutrals match closely; saturated colors diverge more. Buy a sample pot before purchasing full gallons on any bold shade.",
    "sherwin-williams-to-behr": "Behr is the exclusive paint brand at Home Depot, making it the default alternative when a Sherwin-Williams store isn't nearby. It sits a price tier below — $35–$55/gallon versus SW's $55–$85 — but Behr Marquee and Dynasty lines are genuinely competitive in durability and coverage. The bigger adjustment is the palette: Behr's neutrals run slightly cooler and bluer than SW's warm-skewing range, so the same greige can read meaningfully different on the wall. Whites especially warrant a sample comparison before painting a full room.",
    "sherwin-williams-to-ppg": "PPG and Sherwin-Williams are peers in the professional-grade market, so this transition is usually about store proximity or a contractor account rather than a quality upgrade or downgrade. PPG Timeless and PPG Diamond are the closest performance equivalents to SW SuperPaint and Duration. The palettes diverge more than you might expect: PPG's neutrals lean slightly cooler overall, which means warm SW grays and beiges may map to PPG equivalents with noticeably different undertones. Check the color scores on each match and grab a sample before committing.",
    "sherwin-williams-to-valspar": "Sherwin-Williams acquired Valspar in 2017, but the two brands have kept separate color systems and retail channels — SW in company stores ($55–$85/gallon), Valspar at Lowe's ($30–$50). Some colors share corporate DNA and align closely; others were developed independently and diverge, especially in the mid-tone and saturated range. The formula quality gap is real: SW's professional-grade coverage is noticeably better than standard Valspar lines. If quality matters as much as cost savings, step up to Valspar Signature rather than the base line.",
    "benjamin-moore-to-sherwin-williams": "Sherwin-Williams' frequent 30–40% off sales events are what drive most of this transition — a $80/gallon Benjamin Moore paint becomes genuinely cost-competitive with SW at sale prices. The brands are equally premium in formula quality, and professional painters work comfortably with both. The color character differs: SW's palette skews slightly warmer and more neutral, while BM's Gennex system produces greater depth and saturation. Most warm BM neutrals find a close SW match; complex mid-tones and deep colors sometimes need more searching.",
    "benjamin-moore-to-behr": "The quality gap between Benjamin Moore and Behr is real but not as wide as the price difference suggests. BM's Gennex colorant delivers richer color depth and better one-coat coverage — that's what the extra $25–$35 per gallon buys, especially on deep shades. Behr Marquee and Dynasty are the lines most likely to close that gap. The more significant challenge is the palette: BM's neutrals are more refined and subtly layered, while Behr's range is broader and slightly brighter. BM's Historic Color Collection has no close Behr parallels; everything else depends on the specific color.",
    "benjamin-moore-to-ppg": "PPG Diamond and PPG Timeless compete directly with BM Regal Select in the professional market, and contractors who work across both brands rarely notice a significant quality difference at the same line tier. The palettes are independently developed: PPG's neutrals run slightly warmer and more saturated than BM's characteristically refined, subtle range. This switch is common on commercial projects where PPG Paints stores are the specified supplier. Standard grays, whites, and beiges match well; for any BM color with a distinctive undertone character — Revere Pewter, Chantilly Lace — verify with a physical sample.",
    "benjamin-moore-to-valspar": "This is a significant step in both price and color system. BM's Gennex colorant produces color depth that Valspar's standard lines can't fully replicate — the difference is most visible on deep shades like navy, forest green, and charcoal, where BM achieves a richness that $30–$50/gallon Valspar can't match. Valspar Signature is the closest alternative to BM's mid-range lines. For light neutrals and whites, match quality is good enough that the per-gallon savings is defensible on large-volume projects. Go one shade darker than the BM color you're matching to compensate for the difference in color depth.",
    "behr-to-sherwin-williams": "This transition is one of the most common paint upgrades a homeowner makes after a project where Behr underdelivered — either in coverage, color accuracy, or durability on high-traffic surfaces. Sherwin-Williams costs more ($55–$85/gallon vs Behr's $35–$55), but the professional-grade formulas show it, especially on dark colors. Behr's palette skews slightly cooler and bluer than SW's warmer range, so direct comparisons don't always land where you expect. The color score labels on each match — Nearly Identical, Very Similar, Same Family — tell you which ones to sample before committing.",
    "behr-to-benjamin-moore": "Designers and contractors who specify BM are almost always recommending an upgrade from a previous Behr project. The quality difference is tangible: BM's Gennex colorant delivers richer depth, superior one-coat coverage, and better fade resistance over time. It's sold exclusively through independent paint dealers, not Home Depot. Behr's palette trends cooler and slightly more neutral than BM's complex, layered tones — popular Behr warm neutrals often find their closest BM matches in the Affinity or Color Stories collections rather than the Classic Colors range.",
    "behr-to-ppg": "Behr is Home Depot's exclusive house brand; PPG Timeless is available at the same stores alongside it. That shared distribution makes this a common same-trip decision when a specific PPG color isn't available in Behr. Quality is comparable — Behr Marquee against PPG Diamond is a genuine coin-flip — but the palettes diverge. Behr's cooler, slightly more neutral range contrasts with PPG's warmer, more saturated approach. Greiges and warm whites may need some searching; for accent colors, the color scores on each match will tell you how close the equivalents actually land.",
    "behr-to-valspar": "Behr and Valspar are direct competitors in the big-box hardware store space — Behr at Home Depot, Valspar at Lowe's — and this transition almost always comes down to store convenience or a Valspar color with no close Behr parallel. Quality is similar; Behr Marquee has a slight edge in blind consumer tests, but Valspar Signature is genuinely competitive. The palettes are independently developed: Behr's slightly blue-neutral range and Valspar's cooler, more muted tones share some territory but part ways on accent colors. For anything beyond a basic white or gray, compare samples side by side.",
    "ppg-to-sherwin-williams": "Professional contractors often move between these two brands based on account relationships, regional store access, or project specifications — the quality difference at the same line tier is minimal. The practical distinction is the retail network: SW operates 4,000+ company-owned stores with trained staff and a deeper color program, while PPG sells through a combination of independent stores and Home Depot. SW's palette skews slightly warmer than PPG's. For neutrals and grays, match quality is generally very good; saturated colors warrant a physical sample comparison.",
    "ppg-to-benjamin-moore": "Both are premium brands favored by designers and architects, and the distinction often comes down to which brand a specific project has specified. BM's Gennex colorant delivers slightly richer color depth, especially in the mid-tone and saturated range — it's sold exclusively through independent dealers, not Home Depot or Lowe's. PPG and BM palettes are developed independently; standard neutrals and grays match well, but BM's design-forward collections (Historical Colors, Williamsburg) have no PPG equivalents. For those specific BM colors, match quality varies considerably.",
    "ppg-to-behr": "Behr is Home Depot's house brand; PPG Timeless is available at the same stores. The switch is usually lateral — similar price points, comparable quality tiers, different specific colors. PPG's palette leans slightly warmer and more saturated than Behr's cooler, more neutral range. That difference is most visible in the warm earthy tones where PPG's terracottas and ochres sit on a noticeably different foundation than Behr's take on the same color family. For whites and standard grays, the match quality is typically strong.",
    "ppg-to-valspar": "PPG at Home Depot or PPG Paints stores and Valspar at Lowe's occupy the same mid-range quality tier at similar price points ($35–$55 for PPG vs $30–$50 for Valspar), so this transition is almost always about store preference or a specific color. The palettes are independently developed and the divergence can be surprising: PPG's warmer, more saturated approach to neutrals sits on a noticeably different foundation than Valspar's cooler, more muted range. Whites usually match well; mid-tones and warm neutrals are where a physical sample comparison saves you from a repaint.",
    "valspar-to-sherwin-williams": "Despite being owned by the same parent company since 2017, Valspar and Sherwin-Williams have completely separate color systems, formulas, and retail channels — they don't share dye lots or mixing bases. Valspar is at Lowe's ($30–$50/gallon); SW is in company-owned stores ($55–$85/gallon). The practical reason for upgrading is usually formula performance: SW's professional-grade coverage and color depth are meaningfully better, and frequent 30–40% off sales can narrow the price gap significantly. The palettes don't cross-reference, so use the match scores here to find your closest equivalent.",
    "valspar-to-benjamin-moore": "Benjamin Moore is sold exclusively through independent paint dealers — no Lowe's, no Home Depot — and the decision to upgrade from Valspar usually follows a designer recommendation or frustration with Valspar's color depth on a deep shade. BM's Gennex colorant produces richer, more accurate color reproduction, especially on saturated colors where Valspar's standard lines fall noticeably short. For light neutrals and whites, the palettes overlap reasonably well. For designer-specific BM colors, you're working from a different color language entirely — treat the match scores as a starting point, not a final answer.",
    "valspar-to-behr": "Valspar and Behr are the two dominant big-box hardware store brands — Valspar at Lowe's, Behr at Home Depot — and this switch is almost always driven by store convenience or price comparison rather than a quality grievance. Both are credible mid-range options; Behr Marquee edges Valspar in durability tests, but the difference is marginal day-to-day. The palettes diverge in the mid-tone range: Valspar's cooler, more muted tones and Behr's broader neutral range overlap on beige-to-greige but part ways on accent colors. For standard home colors, expect solid match quality.",
    "valspar-to-ppg": "Valspar at Lowe's and PPG at Home Depot or PPG Paints stores are close quality peers at overlapping price points. Neither has a clear overall advantage — the decision is usually about which store is more accessible or which brand has the specific color you need. PPG's palette runs slightly warmer and more saturated than Valspar's characteristically muted, cooler tones — the same putative 'beige' will read meaningfully differently between the two brands in a warm afternoon light. Whites and light grays match well; warm mid-tones are where a sample comparison is worth the time.",
  };

  return (
    <div className="min-h-screen bg-surface">
      <TrackPage eventName="page_view_enriched" params={{ page_type: "match_listing", source_brand: sourceBrandSlug, target_brand: targetBrandSlug }} />
      <Header />

      {/* Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <Link href="/brands" className="hover:text-primary transition-colors">Brands</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">{sourceBrand.name} to {targetBrand.name}</span>
          </nav>

          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface mb-4">
            {sourceBrand.name} to {targetBrand.name}
          </h1>
          {(() => {
            const introKey = `${sourceBrandSlug}-to-${targetBrandSlug}`;
            const intro = MATCH_INTROS[introKey];
            return intro ? (
              <p className="text-on-surface-variant max-w-2xl leading-relaxed mb-4">{intro}</p>
            ) : (
              <p className="text-on-surface-variant max-w-2xl leading-relaxed mb-4">
                Switching from {sourceBrand.name} to {targetBrand.name}? These are the closest matches between the two brands, ranked by how similar they actually look.
              </p>
            );
          })()}
          <p className="text-sm text-outline">
            Looking for{" "}
            <Link href={`/match/${targetBrandSlug}/to/${sourceBrandSlug}`} className="text-primary hover:underline underline-offset-4">
              {targetBrand.name} to {sourceBrand.name}
            </Link>
            {" "}instead?
          </p>
        </div>
      </section>

      {/* Legend */}
      <section className="px-6 md:px-12 pb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-primary-fixed px-3 py-1 text-primary font-bold">Nearly identical</span>
          <span className="rounded-full bg-secondary-fixed px-3 py-1 text-secondary font-bold">Very similar</span>
          <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-tertiary font-bold">Same family</span>
          <span className="rounded-full bg-error-container px-3 py-1 text-error font-bold">Test with sample</span>
        </div>
      </section>

      {/* Match table */}
      <section className="px-6 md:px-12 py-12 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          {matches.length > 0 ? (
            <div className="overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant/10">
              <div className="hidden border-b border-outline-variant/10 bg-surface-container-low px-6 py-4 sm:grid sm:grid-cols-[1fr_40px_1fr_140px] sm:items-center sm:gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{sourceBrand.name}</span>
                <span />
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{targetBrand.name}</span>
                <span className="text-right text-[10px] font-bold uppercase tracking-widest text-outline">Match Quality</span>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {matches.map((m) => {
                  const { label, shortLabel, className } = getDeltaELabel(m.deltaE);
                  return (
                    <Link key={`${m.source.id}-${m.match.id}`} href={`/match/${sourceBrandSlug}/${m.source.slug}-to-${targetBrandSlug}`}
                      className="block px-6 py-4 transition hover:bg-surface-container-low group">
                      <div className="hidden sm:grid sm:grid-cols-[1fr_40px_1fr_140px] sm:items-center sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: m.source.hex }} />
                          <div>
                            <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{m.source.name}</p>
                            {m.source.color_number && <p className="text-[10px] text-outline">{m.source.color_number}</p>}
                          </div>
                        </div>
                        <div className="flex justify-center text-outline">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: m.match.hex }} />
                          <div>
                            <p className="font-headline font-bold text-on-surface">{m.match.name}</p>
                            {m.match.color_number && <p className="text-[10px] text-outline">{m.match.color_number}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold ${className}`}>{label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:hidden">
                        <div className="w-8 h-8 rounded-md shrink-0" style={{ backgroundColor: m.source.hex }} />
                        <p className="truncate text-sm font-headline font-bold text-on-surface flex-1">{m.source.name}</p>
                        <svg className="h-4 w-4 text-outline shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        <div className="w-8 h-8 rounded-md shrink-0" style={{ backgroundColor: m.match.hex }} />
                        <p className="truncate text-sm font-headline font-bold text-on-surface flex-1">{m.match.name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${className}`}>{shortLabel}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-12 text-center">
              <p className="text-on-surface-variant">No cross-brand matches found between {sourceBrand.name} and {targetBrand.name}.</p>
            </div>
          )}
          <p className="mt-6 text-center text-xs text-outline">Digital color matches based on color values. Always verify with physical paint samples.</p>
        </div>
      </section>

      {/* Search CTA */}
      <section className="py-20 px-6 md:px-12 bg-tertiary-fixed">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-4">Looking for a specific color?</h2>
          <p className="text-on-surface-variant mb-8">Search our database of 25,000+ colors from all major paint brands.</p>
          <Link href="/search" className="inline-block bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-base shadow-lg shadow-primary/20">Search Colors</Link>
        </div>
      </section>

      {/* Other brand matches */}
      <section className="py-16 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">Other {sourceBrand.name} Matches</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MAJOR_BRANDS.filter((b) => b !== sourceBrandSlug && b !== targetBrandSlug).map((slug) => (
              <Link key={slug} href={`/match/${sourceBrandSlug}/to/${slug}`}
                className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 text-center hover:shadow-lg transition-all duration-500">
                <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{sourceBrand.name} to {brandNames[slug]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "ItemList",
        name: `${sourceBrand.name} to ${targetBrand.name} Equivalent Colors`,
        numberOfItems: matches.length,
        itemListElement: matches.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: `${m.source.name} to ${m.match.name}`, url: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/${m.source.slug}-to-${targetBrandSlug}` })),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Brands", item: "https://www.paintcolorhq.com/brands" },
          { "@type": "ListItem", position: 3, name: sourceBrand.name, item: `https://www.paintcolorhq.com/brands/${sourceBrandSlug}` },
          { "@type": "ListItem", position: 4, name: `${sourceBrand.name} to ${targetBrand.name}` },
        ],
      }} />

      <AdSenseScript />
      <Footer />
    </div>
  );
}

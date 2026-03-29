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
    "sherwin-williams-to-benjamin-moore": "Switching from Sherwin-Williams to Benjamin Moore is one of the most common brand transitions — often driven by moving to a new area, switching from a Lowe's-accessible brand to an independent paint store, or following a designer recommendation. The two brands occupy the same premium tier, but they approach color differently: Sherwin-Williams favors slightly warmer, grayer neutrals, while Benjamin Moore's Gennex system produces richer, more saturated tones. Match accuracy is generally excellent for neutrals (Delta E under 2) but can diverge on saturated colors. Always buy a sample pot before committing to a full room.",
    "sherwin-williams-to-behr": "Switching from Sherwin-Williams to Behr is common when moving from a Sherwin-Williams store to a Home Depot. Behr is the exclusive Home Depot brand, making it the most accessible alternative for DIYers. Behr sits a price tier below Sherwin-Williams ($35–$55 vs $55–$85 per gallon), but Behr Marquee and Dynasty lines offer comparable quality. The color systems diverge more than SW-to-BM, especially in the neutral range — Behr's palette runs slightly cooler. Delta E scores below 2 indicate a near-invisible match; above 5, test with a physical sample.",
    "sherwin-williams-to-ppg": "Switching from Sherwin-Williams to PPG is common for homeowners who have PPG Paints stores or Home Depot's PPG Timeless line nearby. PPG is a global coatings giant with strong professional and DIY lines, and their Timeless line at Home Depot competes directly with SW SuperPaint. SW and PPG use different color numbering systems, but neutral and greige matches tend to be very close. PPG's palette leans slightly cooler than Sherwin-Williams overall. Check Delta E scores — anything under 3 is a solid visual match.",
    "sherwin-williams-to-valspar": "Valspar was acquired by Sherwin-Williams in 2017, yet the brands maintain separate color systems and distribution. Valspar is sold at Lowe's as a mid-range option ($30–$50/gallon), while Sherwin-Williams operates its own stores. Because they share the same parent company, some colors are closely aligned, but the Valspar palette was developed independently and many shades diverge. Switching from SW to Valspar is most common when Lowe's is more convenient. For neutrals and whites, Delta E scores under 3 are achievable; saturated colors vary more.",
    "benjamin-moore-to-sherwin-williams": "Switching from Benjamin Moore to Sherwin-Williams is common when moving away from an independent paint store to a more accessible retail channel, or when budget is a factor — Sherwin-Williams' frequent 30–40% off sales can significantly undercut Benjamin Moore's prices. The brands are equally premium, but SW's color system skews slightly warmer. BM's Gennex colorant produces notably richer, more saturated tones, so expect some Delta E variation on deep or bold colors. For whites and neutrals, matches are usually excellent.",
    "benjamin-moore-to-behr": "Switching from Benjamin Moore to Behr is a significant step down in price — Behr runs $35–$55 vs BM's $60–$85 per gallon — and the quality difference is noticeable in coverage and depth of color. However, Behr Marquee and Dynasty lines are genuinely high-performing paints. The biggest adjustment is color system: BM's palette has more nuance and depth in the neutral range, and Behr's whites tend to be slightly brighter and cooler. For standard neutrals, match quality is good; for BM's Historic Color Collection, expect more variation.",
    "benjamin-moore-to-ppg": "Switching from Benjamin Moore to PPG is common in commercial projects and when PPG Paints stores are the most convenient option. PPG is a serious professional-grade brand, and their premium lines (PPG Diamond, PPG Timeless) compete at the same quality level as BM Regal Select. The color palettes are developed independently — PPG's neutrals lean slightly warmer and more saturated than BM's refined, subtle range. For straightforward grays, whites, and beiges, Delta E scores under 3 are common. Always verify with a physical sample for accent colors.",
    "benjamin-moore-to-valspar": "Valspar (now Sherwin-Williams owned) and Benjamin Moore occupy different distribution channels — Valspar at Lowe's, BM at independent dealers — and different price tiers. Valspar runs $30–$50 vs BM's $60–$85/gallon. The color systems are independently developed, and BM's Gennex system produces richer color depth that Valspar sometimes can't fully replicate on deep or jewel tones. For whites and light neutrals, matches are generally close. This switch works well for budget-sensitive projects where a physical sample test is feasible.",
    "behr-to-sherwin-williams": "Switching from Behr to Sherwin-Williams is a common upgrade path — usually driven by a contractor recommendation, a move toward professional-grade paint, or a design project requiring more nuanced color. Sherwin-Williams runs $55–$85/gallon vs Behr's $35–$55, but the difference in color depth and application quality is noticeable, especially on bold or dark colors. Behr's palette trends slightly cooler than SW's, so warm Behr neutrals may map to slightly warmer SW equivalents. Use our Delta E scores to find the closest match, then confirm with a sample.",
    "behr-to-benjamin-moore": "Switching from Behr to Benjamin Moore is the most common premium upgrade — designers and contractors who want richer color depth and superior coverage consistently recommend the move. The price difference is real ($35–$55 for Behr vs $60–$85 for BM) but so is the quality gap, especially in color saturation and one-coat coverage. BM is sold only at independent dealers, not Lowe's or Home Depot. Behr's cooler-skewing palette means warm Behr neutrals may match BM neutrals with slightly warmer undertones.",
    "behr-to-ppg": "Both Behr and PPG compete in the Home Depot ecosystem (Behr is exclusive; PPG Timeless is available there too), making this a natural horizontal switch. The brands are at similar price points and quality levels. PPG's palette is independently developed and tends to skew slightly warmer than Behr's cooler, slightly bluer neutrals. For most standard colors, Delta E scores under 3 are achievable. This switch is often driven by a specific PPG color that has no close Behr equivalent.",
    "behr-to-valspar": "Both Behr and Valspar are mid-range, hardware-store brands — Behr at Home Depot, Valspar at Lowe's — making this switch common when changing stores or when a specific Valspar color is unavailable from Behr. Quality is comparable, though Behr Marquee slightly outperforms Valspar in blind consumer tests. The palettes are independently developed and color accuracy varies: neutrals tend to match well, but bold and saturated colors can diverge significantly. Always test with a sample for anything beyond a basic white or greige.",
    "ppg-to-sherwin-williams": "Switching from PPG to Sherwin-Williams is a common upgrade driven by contractor relationships, store proximity, or a need for the broader SW color library. Both are serious professional-grade brands — PPG with a global industrial heritage, SW with the deepest retail color program. SW's palette skews slightly warmer than PPG's. Professional contractors favor SW for the paint-and-primer formulas and the deep network of company-owned stores with knowledgeable staff. Match accuracy is good for neutrals; verify with samples for saturated colors.",
    "ppg-to-benjamin-moore": "Both PPG and Benjamin Moore are professional-grade brands favored by designers and contractors. The switch is common when a project specifies a specific BM color, or when moving from a PPG Paints account to a local BM dealer. BM's Gennex colorant system produces slightly richer color depth than PPG's formulas, and BM is sold exclusively through independent dealers. The color palettes are developed independently — BM's neutrals are more refined and subtle than PPG's broader-stroke approach. Excellent match quality for standard colors; test deep colors.",
    "ppg-to-behr": "Switching from PPG to Behr is common when Home Depot is more accessible than a PPG Paints store. Both brands are mid-to-premium tier and compete on quality. Behr's palette trends slightly cooler and more neutral than PPG's warmer approach. For most standard home colors, Delta E scores under 3 are achievable. Behr Marquee and Dynasty are the lines most likely to match PPG Diamond in coverage and durability. This is a lateral move in quality — neither brand has a clear overall advantage.",
    "ppg-to-valspar": "PPG and Valspar are both widely distributed mid-range brands, making this a common lateral switch. PPG sells through PPG Paints stores and Home Depot (Timeless line); Valspar sells at Lowe's. The color palettes are independently developed and diverge more than you might expect — PPG's warmer, slightly more saturated neutrals don't always map cleanly to Valspar's cooler, more muted tones. For whites and basic grays, matches are usually good. For mid-tones and accent colors, always verify with a physical sample.",
    "valspar-to-sherwin-williams": "Valspar was acquired by Sherwin-Williams in 2017, and while the brands now share a parent company, they maintain independent color systems and retail channels. Valspar is sold at Lowe's ($30–$50/gallon); Sherwin-Williams operates 4,000+ company-owned stores ($55–$85/gallon). Switching from Valspar to SW is often driven by product quality — SW's professional-grade formulas offer better coverage and color depth, and their frequent 30–40% off sales can narrow the price gap significantly. Match quality for neutrals is good; test saturated colors.",
    "valspar-to-benjamin-moore": "Switching from Valspar to Benjamin Moore is a premium upgrade from a Lowe's-accessible brand to the designer favorite sold only through independent dealers. BM's Gennex color system produces noticeably richer, more accurate color — especially on deep or bold shades. The price difference is significant: Valspar at $30–$50/gallon vs BM at $60–$85. The color systems are independently developed with limited overlap. For basic neutrals and whites, matches are usually within Delta E 3; for designer-specific colors, test with a sample.",
    "valspar-to-behr": "Valspar and Behr are direct competitors in the big-box hardware store space — Valspar at Lowe's, Behr at Home Depot. Both are mid-range brands at comparable price points ($30–$50/gallon for Valspar, $35–$55 for Behr). Quality is similar, though Behr Marquee slightly edges out in blind consumer tests. The palettes are independently developed: Valspar tends toward cooler, slightly more muted tones while Behr has a broader, more neutral range. For standard home colors, Delta E scores under 3 are common; test accent colors before committing.",
    "valspar-to-ppg": "Both Valspar and PPG are mid-range, widely distributed brands with similar price points and quality tiers. Valspar at Lowe's ($30–$50/gallon) and PPG Timeless at Home Depot or PPG Paints stores ($35–$55/gallon) compete directly. The color palettes diverge more than might be expected from similar-tier brands — PPG's warmer, slightly more saturated approach contrasts with Valspar's cooler, more muted palette. For neutrals and whites, Delta E under 3 is achievable. For mid-tones and saturated colors, always verify with a physical sample.",
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

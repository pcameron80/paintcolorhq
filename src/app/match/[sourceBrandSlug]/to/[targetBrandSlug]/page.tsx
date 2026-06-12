import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ColorSwatch } from "@/components/color-swatch";
import { TrackPage } from "@/components/track-page";
import { MatchColorSearch } from "@/components/match-color-search";
import { getBrandBySlug, getTopCrossBrandMatches } from "@/lib/queries";
import { MAJOR_MATCH_BRANDS } from "@/lib/popular-colors";
import { getBrandPairIntro } from "@/lib/brand-pair-intros";

export const revalidate = 2592000; // 30d — static color/match/brand data; redeploys pick up data changes

const MAJOR_BRANDS = MAJOR_MATCH_BRANDS;

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
  const title = `${sourceBrand.name} to ${targetBrand.name} Equivalent Colors`;
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
  const brandNames: Record<string, string> = { "sherwin-williams": "Sherwin-Williams", "benjamin-moore": "Benjamin Moore", behr: "Behr", valspar: "Valspar", ppg: "PPG", "dunn-edwards": "Dunn-Edwards", "farrow-ball": "Farrow & Ball" };

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
          {/* Per-pair intro paragraph — M7 fix. Each of the 42 directional
              brand pairs gets a unique 60-100 word positioning paragraph
              covering price/availability differences and color-matching
              specifics. Falls back to the generic templated copy if the
              pair isn't in the BRAND_PAIR_INTROS map. */}
          <p className="text-on-surface-variant max-w-2xl leading-relaxed mb-4">
            {getBrandPairIntro(sourceBrandSlug, targetBrandSlug) ??
              `Switching from ${sourceBrand.name} to ${targetBrand.name}? These are the closest matches between the two brands, ranked by how similar they actually look.`}
          </p>
          <MatchColorSearch
            sourceBrandSlug={sourceBrandSlug}
            targetBrandSlug={targetBrandSlug}
            sourceBrandName={sourceBrand.name}
            targetBrandName={targetBrand.name}
          />

          <p className="mt-6 text-sm text-outline">
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
          <p className="text-on-surface-variant mb-8">Search our database of 26,000+ colors from all major paint brands.</p>
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

      {/* Related reading — closes the cluster gap the audit flagged:
          /match/[a]/to/[b] pages had zero outbound editorial links into the
          blog cluster despite being high-intent commercial pages. Methodology
          post is universal; the brand-comparison post is conditional on the
          pair containing SW, BM, or Behr. */}
      <section className="py-16 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">
            Related Reading
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link
              href="/blog/how-to-find-perfect-color-match-across-brands"
              className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all"
            >
              <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Methodology</p>
              <p className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                How to find the perfect paint color match across brands
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                The CIEDE2000 Delta E score, how to read the verdict labels, and what changes between cross-brand pairs.
              </p>
            </Link>
            {(() => {
              const pair = `${sourceBrandSlug}|${targetBrandSlug}`;
              if (pair === "sherwin-williams|benjamin-moore" || pair === "benjamin-moore|sherwin-williams") {
                return (
                  <Link href="/blog/sherwin-williams-vs-benjamin-moore" className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all">
                    <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Comparison</p>
                    <p className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">Sherwin-Williams vs. Benjamin Moore: full brand comparison</p>
                    <p className="mt-2 text-sm text-on-surface-variant">Price, color depth, finish quality, and where each brand wins.</p>
                  </Link>
                );
              }
              if ([sourceBrandSlug, targetBrandSlug].every((s) => ["sherwin-williams", "benjamin-moore", "behr"].includes(s))) {
                return (
                  <Link href="/blog/behr-vs-sherwin-williams-vs-benjamin-moore" className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all">
                    <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Comparison</p>
                    <p className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">Behr vs. Sherwin-Williams vs. Benjamin Moore</p>
                    <p className="mt-2 text-sm text-on-surface-variant">Three-way comparison of the most cross-shopped consumer paint brands.</p>
                  </Link>
                );
              }
              return (
                <Link href="/blog/understanding-paint-color-undertones" className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all">
                  <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Color Theory</p>
                  <p className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">Understanding paint color undertones</p>
                  <p className="mt-2 text-sm text-on-surface-variant">Why a perfect Delta E match can still look wrong on the wall — and how to read undertones before you commit.</p>
                </Link>
              );
            })()}
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
          { "@type": "ListItem", position: 4, name: `${sourceBrand.name} to ${targetBrand.name}`, item: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/to/${targetBrandSlug}` },
        ],
      }} />
      {/* FAQPage for AI engine citation. Data-grounded answers from values
          already in scope — match count for this brand pair, plus the
          Delta E methodology explainer. */}
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `How many ${sourceBrand.name} colors have a ${targetBrand.name} equivalent?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Paint Color HQ has identified ${matches.length} close ${sourceBrand.name}-to-${targetBrand.name} color matches ranked by CIEDE2000 Delta E score. Colors with a Delta E under 2.0 are virtually identical on a finished wall; under 5.0 are visibly similar.`,
            },
          },
          {
            "@type": "Question",
            name: `What is the best way to match ${sourceBrand.name} paint colors to ${targetBrand.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Use the Delta E color difference score. A Delta E under 2.0 means the colors are nearly identical on a finished wall; under 5.0 means visibly similar but distinguishable. Always verify with physical paint samples in your room's actual lighting before committing — small differences amplify at scale.`,
            },
          },
        ],
      }} />

      <AdSenseScript />
      <Footer />
    </div>
  );
}

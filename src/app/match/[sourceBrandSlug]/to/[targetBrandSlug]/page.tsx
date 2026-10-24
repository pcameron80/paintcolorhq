import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { TrackPage } from "@/components/track-page";
import { MatchColorSearch } from "@/components/match-color-search";
import { getBrandBySlug, getBrandPairCloseCount, getTopCrossBrandMatches } from "@/lib/queries";
import { MAJOR_MATCH_BRANDS } from "@/lib/popular-colors";
import { closenessLabel } from "@/lib/closeness";
import { getBrandPairIntro } from "@/lib/brand-pair-intros";

export const revalidate = 2592000; // 30d — static color/match/brand data; redeploys pick up data changes

const MAJOR_BRANDS = MAJOR_MATCH_BRANDS;
const PAIR_LIMIT = 50;

// unstable_cache keys on the arguments too, so each brand pair caches its own count.
const getCloseCount = unstable_cache(
  async (sourceBrandId: string, targetBrandId: string) => getBrandPairCloseCount(sourceBrandId, targetBrandId),
  ["brand-pair-close-count-v1"],
  { revalidate: 2592000 },
);

interface PageProps { params: Promise<{ sourceBrandSlug: string; targetBrandSlug: string }>; }

function getDeltaELabel(deltaE: number): { label: string; className: string } {
  const label = closenessLabel(deltaE);
  const className =
    label === "Nearly identical"
      ? "bg-primary-fixed text-primary"
      : label === "Very similar"
        ? "bg-secondary-fixed text-secondary"
        : "bg-error-container text-error";
  return { label, className };
}

// Answer to "How many A colors have a B equivalent?". closeCount and listed
// come from the same filtered population (see getBrandPairCloseCount).
function pairCountAnswer(sourceName: string, targetName: string, closeCount: number, listed: number): string {
  const n = closeCount.toLocaleString("en-US");
  const caveat = "These are digital matches ranked by CIEDE2000 Delta E, so confirm with a physical sample before you buy.";
  if (closeCount === 0) {
    const list = listed > 0 ? ` We list the ${listed} closest pairs.` : "";
    return `No ${sourceName} color in the current palette has a nearly identical ${targetName} match.${list} ${caveat}`;
  }
  const lead = `${n} ${sourceName} colors in the current palette have a nearly identical ${targetName} match.`;
  const list = closeCount >= listed
    ? `We list the ${listed} closest of ${n} nearly identical pairs.`
    : `We list the ${listed} closest pairs, including all ${n} nearly identical ones.`;
  return `${lead} ${list} ${caveat}`;
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

  const [matches, closeCount] = await Promise.all([
    getTopCrossBrandMatches(sourceBrand.id, targetBrand.id, PAIR_LIMIT),
    getCloseCount(sourceBrand.id, targetBrand.id),
  ]);
  // Every indexed pair has well over 50 current-palette pairs (the smallest,
  // Farrow & Ball to Behr, has 92 on 2026-10-24). A short chart means the
  // query or the data broke, so say so in the build log.
  if (matches.length < PAIR_LIMIT && MAJOR_BRANDS.includes(sourceBrandSlug) && MAJOR_BRANDS.includes(targetBrandSlug)) {
    console.warn(`[match-listing] ${sourceBrandSlug} to ${targetBrandSlug} returned ${matches.length} of ${PAIR_LIMIT} rows`);
  }
  // One array feeds both the visible FAQ and the FAQPage JSON-LD, so the
  // schema never claims an answer the page does not show.
  const faqs = [
    {
      question: `How many ${sourceBrand.name} colors have a ${targetBrand.name} equivalent?`,
      answer: pairCountAnswer(sourceBrand.name, targetBrand.name, closeCount, matches.length),
    },
    {
      question: `What is the best way to match ${sourceBrand.name} paint colors to ${targetBrand.name}?`,
      answer: `Use the Delta E color difference score. A lower score means a closer digital approximation, not a guaranteed physical match. Always verify with physical paint samples in your room's actual lighting before committing. Small differences amplify at scale.`,
    },
  ];
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
          <span className="rounded-full bg-error-container px-3 py-1 text-error font-bold">Visible difference</span>
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
                  const { label, className } = getDeltaELabel(m.deltaE);
                  return (
                    <Link key={`${m.source.id}-${m.match.id}`} href={`/match/${sourceBrandSlug}/${m.source.slug}-to-${targetBrandSlug}`}
                      className="block px-4 sm:px-6 py-4 transition hover:bg-surface-container-low group">
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
                      {/* Phone: names on line 1 (wrapping, never truncated), closeness badge on line 2. */}
                      <div className="sm:hidden">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md shrink-0" style={{ backgroundColor: m.source.hex }} />
                          <p className="min-w-0 flex-1 break-words text-sm font-headline font-bold text-on-surface">{m.source.name}</p>
                          <svg className="h-4 w-4 text-outline shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                          <div className="w-8 h-8 rounded-md shrink-0" style={{ backgroundColor: m.match.hex }} />
                          <p className="min-w-0 flex-1 break-words text-sm font-headline font-bold text-on-surface">{m.match.name}</p>
                        </div>
                        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>{label}</span>
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

      {/* FAQ, visible. Same array as the FAQPage JSON-LD below; markup follows /faq. */}
      <section className="py-16 px-6 md:px-12 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-2">Frequently asked questions</h2>
          <div className="divide-y divide-outline-variant/20">
            {faqs.map((faq, i) => (
              <details key={faq.question} className="group py-6" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-on-surface hover:text-primary">
                  {faq.question}
                  <svg className="h-5 w-5 shrink-0 text-outline transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="mt-4 leading-relaxed text-on-surface-variant">{faq.answer}</p>
              </details>
            ))}
          </div>
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
              href="/methodology"
              className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all"
            >
              <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Methodology</p>
              <p className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                How we match paint colors across brands
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                The CIEDE2000 pipeline, what the Delta E verdict labels mean on a wall, and the known limits of a hex-based match.
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
      {/* FAQPage for AI engine citation. Built from the same faqs array as
          the visible FAQ section: the nearly identical count for this brand
          pair, plus the Delta E methodology explainer. */}
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }} />

      <AdSenseScript />
      <Footer />
    </div>
  );
}

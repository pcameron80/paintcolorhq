import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ColorSwatch } from "@/components/color-swatch";
import { TrackPage } from "@/components/track-page";
import { getColorBySlug, getCrossBrandMatches, getBrandBySlug } from "@/lib/queries";

export const revalidate = 3600;

interface PageProps { params: Promise<{ sourceBrandSlug: string; matchSlug: string }>; }

function parseParams(raw: string): { colorSlug: string; targetBrandSlug: string } | null {
  const match = raw.match(/^(.+)-to-(.+)$/);
  if (!match) return null;
  return { colorSlug: match[1], targetBrandSlug: match[2] };
}

function deltaELabel(score: number): string {
  if (score < 1) return "virtually identical";
  if (score < 2) return "near-identical match";
  if (score < 5) return "close match";
  return "noticeable difference";
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sourceBrandSlug, matchSlug } = await params;
  const parsed = parseParams(matchSlug);
  if (!parsed) return { title: "Match Not Found" };
  const [sourceColor, targetBrand] = await Promise.all([getColorBySlug(sourceBrandSlug, parsed.colorSlug), getBrandBySlug(parsed.targetBrandSlug)]);
  if (!sourceColor || !targetBrand) return { title: "Match Not Found" };
  const allMatches = await getCrossBrandMatches(sourceColor.id);
  const best = allMatches.find((m) => m.match_color.brand.slug === parsed.targetBrandSlug);
  const note = best ? deltaELabel(Number(best.delta_e_score)) : "match";
  const url = `https://www.paintcolorhq.com/match/${sourceBrandSlug}/${parsed.colorSlug}-to-${parsed.targetBrandSlug}`;
  return {
    title: `${sourceColor.brand.name} ${sourceColor.name} to ${targetBrand.name} Match`,
    description: `${sourceColor.brand.name} ${sourceColor.name} (${sourceColor.hex.toUpperCase()}) to ${targetBrand.name}: ${note}. Compare hex, undertone, and LRV.`,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
    openGraph: { title: `${sourceColor.brand.name} ${sourceColor.name} to ${targetBrand.name} Match`, description: `Find the closest ${targetBrand.name} equivalent.`, url,
      images: [{ url: `/api/og?hex=${encodeURIComponent(sourceColor.hex)}&name=${encodeURIComponent(sourceColor.name)}&brand=${encodeURIComponent(`${sourceColor.brand.name} \u2192 ${targetBrand.name}`)}`, width: 1200, height: 630 }],
    },
  };
}

// JSON-LD helper \u2014 content is server-generated from trusted database values only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function MatchPage({ params }: PageProps) {
  const { sourceBrandSlug, matchSlug } = await params;
  const parsed = parseParams(matchSlug);
  if (!parsed) notFound();
  const [sourceColor, targetBrand] = await Promise.all([getColorBySlug(sourceBrandSlug, parsed.colorSlug), getBrandBySlug(parsed.targetBrandSlug)]);
  if (!sourceColor || !targetBrand) notFound();

  const allMatches = await getCrossBrandMatches(sourceColor.id);
  const targetMatches = allMatches.filter((m) => m.match_color.brand.slug === parsed.targetBrandSlug);
  const bestMatch = targetMatches[0];

  if (!bestMatch) notFound();

  const otherBrandMatches = new Map<string, { brandName: string; brandSlug: string }>();
  for (const m of allMatches) {
    const slug = m.match_color.brand.slug;
    if (slug !== parsed.targetBrandSlug && slug !== sourceBrandSlug && !otherBrandMatches.has(slug))
      otherBrandMatches.set(slug, { brandName: m.match_color.brand.name, brandSlug: slug });
  }
  const otherBrands = Array.from(otherBrandMatches.values()).slice(0, 6);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
        { "@type": "ListItem", position: 2, name: sourceColor.name, item: `https://www.paintcolorhq.com/colors/${sourceColor.brand.slug}/${sourceColor.slug}` },
        { "@type": "ListItem", position: 3, name: `Match in ${targetBrand.name}` },
      ]}} />
      {bestMatch && <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
        { "@type": "Question", name: `What is the ${targetBrand.name} equivalent of ${sourceColor.brand.name} ${sourceColor.name}?`,
          acceptedAnswer: { "@type": "Answer", text: `The closest ${targetBrand.name} equivalent is ${bestMatch.match_color.name} (${bestMatch.match_color.hex.toUpperCase()}) \u2014 ${deltaELabel(Number(bestMatch.delta_e_score))}.` } },
      ]}} />}

      {/* Hero \u2014 side by side */}
      {bestMatch ? (
        <section className="pt-[65px]">
          <div className="grid grid-cols-2 h-48 md:h-64">
            <div className="flex items-end p-6 md:p-10" style={{ backgroundColor: sourceColor.hex }}>
              <div>
                <p className={`font-headline font-extrabold text-xl md:text-2xl ${isLight(sourceColor.hex) ? "text-on-surface" : "text-on-primary"}`}>{sourceColor.name}</p>
                <p className={`text-[10px] uppercase tracking-widest mt-1 ${isLight(sourceColor.hex) ? "text-on-surface-variant" : "text-on-primary/70"}`}>{sourceColor.brand.name}</p>
              </div>
            </div>
            <div className="flex items-end p-6 md:p-10" style={{ backgroundColor: bestMatch.match_color.hex }}>
              <div>
                <p className={`font-headline font-extrabold text-xl md:text-2xl ${isLight(bestMatch.match_color.hex) ? "text-on-surface" : "text-on-primary"}`}>{bestMatch.match_color.name}</p>
                <p className={`text-[10px] uppercase tracking-widest mt-1 ${isLight(bestMatch.match_color.hex) ? "text-on-surface-variant" : "text-on-primary/70"}`}>{targetBrand.name}</p>
              </div>
            </div>
          </div>
        </section>
      ) : <div className="pt-[65px] h-32 bg-surface-container-low" />}

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <nav className="mb-8 text-sm text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2 text-outline">/</span>
          <Link href={`/colors/${sourceColor.brand.slug}/${sourceColor.slug}`} className="hover:text-primary transition-colors">{sourceColor.name}</Link>
          <span className="mx-2 text-outline">/</span>
          <span className="text-on-surface">Match in {targetBrand.name}</span>
        </nav>

        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-4">
          {sourceColor.brand.name} {sourceColor.name} in {targetBrand.name}
        </h1>

        {bestMatch ? (
          <>
            <p className="text-on-surface-variant leading-relaxed max-w-3xl mb-10">
              The closest {targetBrand.name} equivalent to {sourceColor.brand.name} {sourceColor.name} ({sourceColor.hex.toUpperCase()}) is {bestMatch.match_color.name} ({bestMatch.match_color.hex.toUpperCase()}) \u2014 {deltaELabel(Number(bestMatch.delta_e_score))}. Always verify with physical paint samples.
            </p>

            <div className="bg-surface-container-low rounded-xl p-6 mb-12 text-center">
              <p className="font-headline font-bold text-on-surface">{Number(bestMatch.delta_e_score) < 2 ? "Nearly identical" : Number(bestMatch.delta_e_score) < 5 ? "Very similar" : "Visible difference"}</p>
              <p className="text-sm text-on-surface-variant mt-1">Based on CIEDE2000 color difference analysis</p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mb-12">
              <Link href={`/colors/${sourceColor.brand.slug}/${sourceColor.slug}`} className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden hover:shadow-lg transition-all">
                <div className="h-40" style={{ backgroundColor: sourceColor.hex }} />
                <div className="p-6">
                  <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-1">{sourceColor.brand.name}</p>
                  <h2 className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{sourceColor.name}</h2>
                  <div className="h-4" />
                  <p className="font-mono text-[10px] text-outline">{sourceColor.hex.toUpperCase()}</p>
                </div>
              </Link>
              <Link href={`/colors/${bestMatch.match_color.brand.slug}/${bestMatch.match_color.slug}`} className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden hover:shadow-lg transition-all">
                <div className="h-40" style={{ backgroundColor: bestMatch.match_color.hex }} />
                <div className="p-6">
                  <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-1">{targetBrand.name}</p>
                  <h2 className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{bestMatch.match_color.name}</h2>
                  <div className="h-4" />
                  <p className="font-mono text-[10px] text-outline">{bestMatch.match_color.hex.toUpperCase()}</p>
                </div>
              </Link>
            </div>

            {targetMatches.length > 1 && (
              <section className="mb-12">
                <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">Other Close Matches in {targetBrand.name}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {targetMatches.slice(1, 5).map((match) => (
                    <Link key={match.id} href={`/colors/${match.match_color.brand.slug}/${match.match_color.slug}`}
                      className="flex items-center gap-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-5 hover:shadow-md transition-all group">
                      <div className="w-12 h-12 rounded-lg shrink-0" style={{ backgroundColor: match.match_color.hex }} />
                      <div className="min-w-0 flex-1">
                        <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{match.match_color.name}</p>
                        <p className="text-xs text-on-surface-variant">{deltaELabel(Number(match.delta_e_score))}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-surface-container-low rounded-2xl p-8 md:p-12">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">Keep Exploring</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link href={`/compare?colors=${sourceColor.hex.slice(1)},${bestMatch.match_color.hex.slice(1)}`}
                  className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all">
                  <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Compare Side by Side</p>
                  <p className="mt-1 text-sm text-on-surface-variant">See both colors next to each other</p>
                </Link>
                <Link href={`/colors/${sourceColor.brand.slug}/${sourceColor.slug}`}
                  className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: sourceColor.hex }} />
                  <div><p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">View {sourceColor.name}</p><p className="text-xs text-on-surface-variant">Full color details</p></div>
                </Link>
                <Link href={`/colors/${bestMatch.match_color.brand.slug}/${bestMatch.match_color.slug}`}
                  className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: bestMatch.match_color.hex }} />
                  <div><p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">View {bestMatch.match_color.name}</p><p className="text-xs text-on-surface-variant">Full color details</p></div>
                </Link>
              </div>
              {otherBrands.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-headline font-bold text-on-surface mb-4">Match {sourceColor.name} in other brands</h3>
                  <div className="flex flex-wrap gap-2">
                    {otherBrands.map((b) => (
                      <Link key={b.brandSlug} href={`/match/${sourceBrandSlug}/${sourceColor.slug}-to-${b.brandSlug}`}
                        className="rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-all">{b.brandName}</Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-12 text-center">
            <p className="text-on-surface-variant">No matches found in {targetBrand.name}.</p>
          </div>
        )}
      </main>

      <TrackPage eventName="page_view_enriched" params={{ page_type: "match", source_brand: sourceColor.brand.name, target_brand: targetBrand.name }} />
      <AdSenseScript />
      <Footer />
    </div>
  );
}

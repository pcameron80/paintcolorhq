import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ColorSwatch } from "@/components/color-swatch";
import { TrackPage } from "@/components/track-page";
import { getColorBySlug, getCrossBrandMatches, getBrandBySlug } from "@/lib/queries";
import { POPULAR_COLOR_SLUGS, MAJOR_MATCH_BRANDS } from "@/lib/popular-colors";

export const revalidate = 2592000; // 30d — static color/match/brand data; redeploys pick up data changes

// Without generateStaticParams Next.js 16 falls back to fully dynamic SSR for
// dynamic route segments — `revalidate` alone doesn't opt the route into ISR.
// Pre-render the curated POPULAR × MAJOR combinations (same set the sitemap's
// match-individual shard emits). All other match URLs render on demand and
// then cache via ISR.
// https://nextjs.org/docs/app/api-reference/functions/generate-static-params#dynamic-segments-without-generatestaticparams
export async function generateStaticParams() {
  const params: { sourceBrandSlug: string; matchSlug: string }[] = [];
  for (const { brandSlug, colorSlug } of POPULAR_COLOR_SLUGS) {
    for (const target of MAJOR_MATCH_BRANDS) {
      if (target === brandSlug) continue;
      params.push({
        sourceBrandSlug: brandSlug,
        matchSlug: `${colorSlug}-to-${target}`,
      });
    }
  }
  return params;
}

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
  const variantMatch = parsed.colorSlug.match(/-([2-9])$/);
  const variant = variantMatch && !sourceColor.color_number?.toLowerCase().endsWith(variantMatch[1]) ? ` (variant ${variantMatch[1]})` : "";
  const colorNum = sourceColor.color_number ? ` ${sourceColor.color_number}` : "";
  // Title pivots to the exact phrasing of the dominant PAA query
  // ("What is the Behr equivalent of Agreeable Gray?") to lift CTR and
  // align with the way Google surfaces "[Brand] equivalent of [color]" results.
  const shortTitle = `${targetBrand.name} Equivalent of ${sourceColor.brand.name} ${sourceColor.name}${colorNum}${variant}`;
  // Index only matches close enough to be useful answers. At Delta E >= 3 the
  // "match" carries a visible difference and the page reads as a low-quality
  // doorway at scale (~150k crawlable pairs total). Also noindex when the
  // source slug is a variant (e.g. agreeable-gray-7029-2-to-behr) — the base
  // match page already covers the query.
  const deltaScore = best ? Number(best.delta_e_score) : null;
  const isVariantSource = variant !== "";
  const shouldIndex = deltaScore !== null && deltaScore < 3 && !isVariantSource;
  return {
    title: { absolute: shortTitle },
    description: `Find the closest ${targetBrand.name} match for ${sourceColor.brand.name} ${sourceColor.name}${colorNum}${variant} (${sourceColor.hex.toUpperCase()}). ${note}. Compare hex, LRV, and undertone side by side.`,
    alternates: { canonical: url },
    robots: shouldIndex ? undefined : { index: false, follow: true },
    openGraph: { title: shortTitle, description: `Find the closest ${targetBrand.name} equivalent.`, url,
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
        { "@type": "ListItem", position: 3, name: `${targetBrand.name} Equivalent`, item: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/${parsed.colorSlug}-to-${parsed.targetBrandSlug}` },
      ]}} />
      {bestMatch && <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
        { "@type": "Question", name: `What is the ${targetBrand.name} equivalent of ${sourceColor.brand.name} ${sourceColor.name}?`,
          acceptedAnswer: { "@type": "Answer", text: `The closest ${targetBrand.name} equivalent to ${sourceColor.brand.name} ${sourceColor.name} is ${bestMatch.match_color.name} (${bestMatch.match_color.hex.toUpperCase()}) \u2014 ${deltaELabel(Number(bestMatch.delta_e_score))} on the wall. The match is computed with the CIEDE2000 color-difference formula, which measures how close two colors look to the human eye rather than comparing their hex codes.${targetMatches.length > 1 ? ` If you want a backup, ${targetMatches[1].match_color.name} is the next-closest ${targetBrand.name} option.` : ""} Order a sample before painting \u2014 sheen and lighting shift the result.` } },
        { "@type": "Question", name: `Will ${bestMatch.match_color.name} look exactly like ${sourceColor.name}?`,
          acceptedAnswer: { "@type": "Answer", text: `${bestMatch.match_color.name} is ${Number(bestMatch.delta_e_score) < 2 ? "near-identical" : Number(bestMatch.delta_e_score) < 5 ? "very close" : "a close but visibly different alternative"} to ${sourceColor.brand.name} ${sourceColor.name}, but no cross-brand match is ever perfectly identical \u2014 paint bases, sheens, and tinting systems differ between brands. ${Number(bestMatch.delta_e_score) < 2 ? "Most people won't read the two as different colors once they're on a wall." : Number(bestMatch.delta_e_score) < 5 ? "The difference shows side by side but is rarely noticeable across a room." : "The difference is visible up close, so treat it as the closest available option rather than an exact dupe."} For a high-stakes room, buy a sample pot and compare it against ${sourceColor.name} in your actual lighting first.` } },
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
          {targetBrand.name} Equivalent of {sourceColor.name}{sourceColor.color_number ? ` ${sourceColor.color_number}` : ""}
        </h1>
        <p className="text-sm text-on-surface-variant mb-4">
          Cross-brand match from {sourceColor.brand.name} {sourceColor.name} to {targetBrand.name}.
        </p>

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

            {/* Methodology — gives match pages real, extractable prose (they were
                ~70 words to content/AI extractors) grounded in the actual pair. */}
            <article id="match-methodology" className="max-w-3xl mb-12 text-on-surface-variant leading-relaxed">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-4">How this match is calculated</h2>
              <p className="mb-4">
                Every {sourceColor.brand.name} and {targetBrand.name} color in our database is converted to CIELAB coordinates, then scored with the CIEDE2000 formula — the current ISO standard for how different two colors look to the human eye. It corrects for the fact that the eye notices small shifts in some hue ranges far more than others, so it predicts real-world appearance more reliably than comparing hex codes directly.
              </p>
              <p>
                {bestMatch.match_color.name} ranks as the closest {targetBrand.name} equivalent to {sourceColor.name} because it sits nearest in that perceptual space.{" "}
                {Number(bestMatch.delta_e_score) < 2
                  ? "The two are near-identical — most people won't read them as different colors once they're on a wall."
                  : Number(bestMatch.delta_e_score) < 5
                  ? "The two are very similar — the difference shows side by side but is rarely noticeable across a room."
                  : "There is a visible difference between them, so treat this as the closest available option rather than an exact dupe."}{" "}
                Sheen, lighting, and the existing wall color all shift perceived color, so order a sample of {bestMatch.match_color.name} and check it in your actual room before committing.
              </p>
            </article>

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
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">Keep Exploring {sourceColor.name}</h2>
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

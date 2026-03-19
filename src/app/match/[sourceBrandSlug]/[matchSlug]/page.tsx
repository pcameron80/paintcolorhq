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

interface PageProps {
  params: Promise<{
    sourceBrandSlug: string;
    matchSlug: string;
  }>;
}

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sourceBrandSlug } = await params;
  const rawSlug = (await params).matchSlug;
  const parsed = parseParams(rawSlug);
  if (!parsed) return { title: "Match Not Found" };

  const [sourceColor, targetBrand] = await Promise.all([
    getColorBySlug(sourceBrandSlug, parsed.colorSlug),
    getBrandBySlug(parsed.targetBrandSlug),
  ]);

  if (!sourceColor || !targetBrand) return { title: "Match Not Found" };

  const allMatches = await getCrossBrandMatches(sourceColor.id);
  const bestMatchForMeta = allMatches.find(
    (m) => m.match_color.brand.slug === parsed.targetBrandSlug
  );
  const deltaENote = bestMatchForMeta
    ? deltaELabel(Number(bestMatchForMeta.delta_e_score))
    : "match";

  const url = `https://www.paintcolorhq.com/match/${sourceBrandSlug}/${parsed.colorSlug}-to-${parsed.targetBrandSlug}`;
  return {
    title: `${sourceColor.brand.name} ${sourceColor.name} to ${targetBrand.name} Match | Paint Color HQ`,
    description: `${sourceColor.brand.name} ${sourceColor.name} (${sourceColor.hex.toUpperCase()}) to ${targetBrand.name}: ${deltaENote}. Compare hex, undertone, and LRV. Always verify with physical samples.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${sourceColor.brand.name} ${sourceColor.name} to ${targetBrand.name} Match`,
      description: `Find the closest ${targetBrand.name} equivalent to ${sourceColor.brand.name} ${sourceColor.name}.`,
      url,
      images: [
        {
          url: `/api/og?hex=${encodeURIComponent(sourceColor.hex)}&name=${encodeURIComponent(sourceColor.name)}&brand=${encodeURIComponent(`${sourceColor.brand.name} → ${targetBrand.name}`)}`,
          width: 1200,
          height: 630,
          alt: `${sourceColor.name} paint color match`,
        },
      ],
    },
  };
}

export default async function MatchPage({ params }: PageProps) {
  const { sourceBrandSlug } = await params;
  const rawSlug = (await params).matchSlug;
  const parsed = parseParams(rawSlug);
  if (!parsed) notFound();

  const [sourceColor, targetBrand] = await Promise.all([
    getColorBySlug(sourceBrandSlug, parsed.colorSlug),
    getBrandBySlug(parsed.targetBrandSlug),
  ]);

  if (!sourceColor || !targetBrand) notFound();

  const allMatches = await getCrossBrandMatches(sourceColor.id);
  const targetMatches = allMatches.filter(
    (m) => m.match_color.brand.slug === parsed.targetBrandSlug
  );

  const bestMatch = targetMatches[0];

  // Collect other brands that have matches (for "Match in other brands" CTA)
  const otherBrandMatches = new Map<string, { brandName: string; brandSlug: string }>();
  for (const m of allMatches) {
    const slug = m.match_color.brand.slug;
    if (slug !== parsed.targetBrandSlug && slug !== sourceBrandSlug && !otherBrandMatches.has(slug)) {
      otherBrandMatches.set(slug, { brandName: m.match_color.brand.name, brandSlug: slug });
    }
  }
  const otherBrands = Array.from(otherBrandMatches.values()).slice(0, 6);

  // JSON-LD structured data (safe: all values are from our own database, not user input)
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.paintcolorhq.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: sourceColor.name,
        item: `https://www.paintcolorhq.com/colors/${sourceColor.brand.slug}/${sourceColor.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Match in ${targetBrand.name}`,
        item: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/${parsed.colorSlug}-to-${parsed.targetBrandSlug}`,
      },
    ],
  };

  const faqJsonLd = bestMatch
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is the ${targetBrand.name} equivalent of ${sourceColor.brand.name} ${sourceColor.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `The closest ${targetBrand.name} equivalent to ${sourceColor.brand.name} ${sourceColor.name} (${sourceColor.hex.toUpperCase()}) is ${bestMatch.match_color.name} (${bestMatch.match_color.hex.toUpperCase()}), with a Delta E of ${Number(bestMatch.delta_e_score).toFixed(2)} — ${deltaELabel(Number(bestMatch.delta_e_score))}. Always verify with physical paint samples before purchasing.`,
            },
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link
            href={`/colors/${sourceColor.brand.slug}/${sourceColor.slug}`}
            className="hover:text-gray-900"
          >
            {sourceColor.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Match in {targetBrand.name}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {sourceColor.brand.name} {sourceColor.name} in {targetBrand.name} — Paint Color Match
        </h1>

        {bestMatch ? (
          <>
            {/* Citeable summary paragraph */}
            <p className="mt-4 text-base text-gray-700 leading-relaxed">
              The closest {targetBrand.name} equivalent to {sourceColor.brand.name}{" "}
              {sourceColor.name} ({sourceColor.hex.toUpperCase()}) is{" "}
              {bestMatch.match_color.name} ({bestMatch.match_color.hex.toUpperCase()}),
              with a Delta E of {Number(bestMatch.delta_e_score).toFixed(2)} —{" "}
              {deltaELabel(Number(bestMatch.delta_e_score))}. Delta E measures perceptual
              color difference; values below 2 are virtually indistinguishable.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {/* Source Color */}
              <div className="text-center">
                <div
                  className="mx-auto aspect-square w-full max-w-xs rounded-2xl border border-gray-200"
                  style={{ backgroundColor: sourceColor.hex }}
                />
                <h2 className="mt-4 text-xl font-semibold">{sourceColor.name}</h2>
                <p className="text-gray-600">{sourceColor.brand.name}</p>
                <p className="font-mono text-sm text-gray-500">
                  {sourceColor.hex.toUpperCase()}
                </p>
              </div>

              {/* Best Match */}
              <div className="text-center">
                <div
                  className="mx-auto aspect-square w-full max-w-xs rounded-2xl border border-gray-200"
                  style={{ backgroundColor: bestMatch.match_color.hex }}
                />
                <h2 className="mt-4 text-xl font-semibold">
                  {bestMatch.match_color.name}
                </h2>
                <p className="text-gray-600">{targetBrand.name}</p>
                <p className="font-mono text-sm text-gray-500">
                  {bestMatch.match_color.hex.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-sm text-blue-800">
                Delta E: {Number(bestMatch.delta_e_score).toFixed(2)}
                {" — "}
                {Number(bestMatch.delta_e_score) < 1
                  ? "Virtually identical"
                  : Number(bestMatch.delta_e_score) < 2
                    ? "Near-identical match"
                    : Number(bestMatch.delta_e_score) < 5
                      ? "Close match"
                      : "Noticeable difference"}
              </p>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              This is the closest digital match based on color values. Actual
              pigments and finishes differ between brands. Always verify with
              physical paint samples before purchasing.
            </p>

            {/* Other matches */}
            {targetMatches.length > 1 && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-gray-900">
                  Other Close Matches in {targetBrand.name}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {targetMatches.slice(1, 5).map((match) => (
                    <Link
                      key={match.id}
                      href={`/colors/${match.match_color.brand.slug}/${match.match_color.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:shadow-md"
                    >
                      <ColorSwatch hex={match.match_color.hex} size="md" />
                      <div>
                        <p className="font-medium">{match.match_color.name}</p>
                        <p className="text-xs text-gray-500">
                          Delta E: {Number(match.delta_e_score).toFixed(2)}
                          {" — "}
                          {deltaELabel(Number(match.delta_e_score))}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Keep Exploring CTAs */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900">Keep Exploring</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href={`/compare?colors=${encodeURIComponent(sourceColor.hex.replace("#", ""))},${encodeURIComponent(bestMatch.match_color.hex.replace("#", ""))}`}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 p-4 hover:shadow-md"
                >
                  <span className="text-lg" aria-hidden="true">&#x2194;&#xFE0F;</span>
                  <span className="font-medium">Compare side by side</span>
                </Link>
                <Link
                  href={`/colors/${sourceColor.brand.slug}/${sourceColor.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 p-4 hover:shadow-md"
                >
                  <ColorSwatch hex={sourceColor.hex} size="sm" />
                  <span className="font-medium">View {sourceColor.name} details</span>
                </Link>
                <Link
                  href={`/colors/${bestMatch.match_color.brand.slug}/${bestMatch.match_color.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 p-4 hover:shadow-md"
                >
                  <ColorSwatch hex={bestMatch.match_color.hex} size="sm" />
                  <span className="font-medium">View {bestMatch.match_color.name} details</span>
                </Link>
              </div>

              {otherBrands.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Match {sourceColor.name} in other brands
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {otherBrands.map((b) => (
                      <Link
                        key={b.brandSlug}
                        href={`/match/${sourceBrandSlug}/${sourceColor.slug}-to-${b.brandSlug}`}
                        className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                      >
                        {b.brandName}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="mt-12 text-center text-gray-500">
            No matches found in {targetBrand.name}.
          </p>
        )}
      </main>

      <TrackPage
        eventName="page_view_enriched"
        params={{
          page_type: "match",
          source_brand: sourceColor.brand.name,
          target_brand: targetBrand.name,
        }}
      />
      <AdSenseScript />
      <Footer />
    </div>
  );
}

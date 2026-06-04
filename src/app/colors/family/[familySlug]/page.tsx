import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FamilyColorLibrary } from "@/components/family-color-library";
import { FamilyColorLibraryFallback } from "@/components/family-color-library-fallback";
import { getColorsByFamily, getColorsByFamilyCount, getAllBrands } from "@/lib/queries";
import { getFamilyContent, getFamilyRelatedPalettes, getFamilyAnchor } from "@/lib/family-content";
import { getPostsByFamily } from "@/lib/blog-posts";
import { FAMILY_UNDERTONE_ANSWERS } from "@/lib/family-undertone-copy";
import { getPaletteBySlug } from "@/lib/palettes";
import { TrackPage } from "@/components/track-page";
import { ColorLinkEnhancer } from "@/components/color-link-enhancer";

export const revalidate = 3600;

const validFamilies = [
  "red", "orange", "yellow", "green", "blue", "purple", "pink",
  "white", "off-white", "black", "gray", "brown", "beige", "tan", "neutral",
];

const familyColors: Record<string, { hex: string; border?: boolean }> = {
  red: { hex: "#DC2626" }, orange: { hex: "#EA580C" }, yellow: { hex: "#EAB308" },
  green: { hex: "#16A34A" }, blue: { hex: "#2563EB" }, purple: { hex: "#9333EA" },
  pink: { hex: "#EC4899" }, white: { hex: "#FFFFFF", border: true },
  "off-white": { hex: "#F5F0E8", border: true }, black: { hex: "#1F2937" },
  gray: { hex: "#9CA3AF" }, brown: { hex: "#8B6914" }, beige: { hex: "#D4C5A9" },
  tan: { hex: "#D2B48C" }, neutral: { hex: "#C7C1B7" },
};

interface PageProps {
  params: Promise<{ familySlug: string }>;
}

export async function generateStaticParams() {
  return validFamilies.map((f) => ({ familySlug: f }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { familySlug } = await params;
  const name = familySlug.replace(/-/g, " ");
  const url = `https://www.paintcolorhq.com/colors/family/${familySlug}`;
  // Canonical always points to the unfiltered base URL. Filter/pagination
  // variants now share the same static HTML and refetch client-side, so the
  // canonical consolidates them for Google.
  return {
    title: `${capitalize(name)} Paint Colors - All Brands`,
    description: `Browse ${name} paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more. Compare colors with hex codes and LRV values.`,
    alternates: { canonical: url },
    openGraph: { title: `${capitalize(name)} Paint Colors`, description: `Browse ${name} paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more.`, url },
  };
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// JSON-LD helper — content is server-generated from trusted database values only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function ColorFamilyPage({ params }: PageProps) {
  const { familySlug } = await params;

  if (!validFamilies.includes(familySlug)) notFound();

  const perPage = 60;

  // Server renders the canonical (unfiltered, page 1) variant. Filters and
  // pagination are handled client-side by FamilyColorLibrary, which refetches
  // from /api/family/[slug]/colors when URL params are present. Reading
  // searchParams on the server here would force dynamic rendering and kill
  // ISR caching for the canonical URL.
  const [colors, brands, totalCount] = await Promise.all([
    getColorsByFamily(familySlug, { limit: perPage, offset: 0 }),
    getAllBrands(),
    getColorsByFamilyCount(familySlug),
  ]);

  const familyName = capitalize(familySlug.replace(/-/g, " "));
  const familyContent = getFamilyContent(familySlug);
  // Reciprocal family→blog links — close the one-way link gap the cluster audit
  // flagged (round-up posts link into family pages but not back).
  const relatedPosts = getPostsByFamily(familySlug);
  const brandCount = brands.length;
  const baseUrl = `https://www.paintcolorhq.com/colors/family/${familySlug}`;
  const fc = familyColors[familySlug] ?? { hex: "#9CA3AF" };

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@graph": [
          { "@type": "CollectionPage", name: `${familyName} Paint Colors`, description: `Browse ${totalCount} ${familyName.toLowerCase()} paint colors from ${brandCount} brands.`, url: baseUrl, numberOfItems: totalCount,
            mainEntity: { "@type": "ItemList", numberOfItems: totalCount, itemListElement: colors.slice(0, 20).map((color, i) => ({ "@type": "ListItem", position: i + 1, name: color.name, url: `https://www.paintcolorhq.com/colors/${color.brand.slug}/${color.slug}` })) },
          },
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
            { "@type": "ListItem", position: 2, name: "Colors", item: "https://www.paintcolorhq.com/colors" },
            { "@type": "ListItem", position: 3, name: `${familyName} Paint Colors`, item: baseUrl },
          ]},
        ],
      }} />
      {/* FAQPage schema — primarily for AI engine citation (Perplexity, AI
          Overviews, ChatGPT). Google restricted FAQPage rich results to
          government/healthcare in Aug 2023, so commercial pages don't get
          Google rich-result lift here, but the structured Q&A is still
          consumed by AI search and lifts citation odds. */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `How many ${familyName.toLowerCase()} paint colors are catalogued?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Paint Color HQ catalogs ${totalCount.toLocaleString()} ${familyName.toLowerCase()} paint colors across ${brandCount} major brands, including Sherwin-Williams, Benjamin Moore, Behr, Valspar, PPG, Dunn-Edwards, and Farrow & Ball.`,
            },
          },
          {
            "@type": "Question",
            name: `What undertones do ${familyName.toLowerCase()} paint colors have?`,
            acceptedAnswer: {
              "@type": "Answer",
              // Use a family-specific paragraph when available so the FAQ answer
              // varies across all 15 family hubs instead of reading as a
              // templated string with only the family name swapped (M1 audit).
              text:
                FAMILY_UNDERTONE_ANSWERS[familySlug] ??
                `${familyName} paint colors come in warm undertones (leaning yellower, redder, or browner), cool undertones (leaning bluer or greener), and balanced neutrals. Use the undertone filter on this page to narrow your search to warm, cool, or neutral options.`,
            },
          },
          {
            "@type": "Question",
            name: `How do I find a ${familyName.toLowerCase()} paint color that matches across brands?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Every color page on Paint Color HQ shows cross-brand matches ranked by CIEDE2000 Delta E score. Colors with a Delta E under 2.0 are virtually identical on a finished wall. Click any color in the grid above to see its closest matches across all ${brandCount} brands.`,
            },
          },
        ],
      }} />
      <TrackPage eventName="page_view_enriched" params={{ page_type: "family", color_family: familySlug, result_count: totalCount }} />
      <Header />

      {/* Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-8">
          <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl shrink-0 shadow-lg ${fc.border ? "border border-outline-variant/30" : ""}`} style={{ backgroundColor: fc.hex }} />
          <div>
            <nav className="mb-4 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2 text-outline">/</span>
              <Link href="/colors" className="hover:text-primary transition-colors">Colors</Link>
              <span className="mx-2 text-outline">/</span>
              <span className="text-on-surface">{familyName}</span>
            </nav>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mb-4">
              {familyName} Paint Colors
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
              {totalCount.toLocaleString()} {familyName.toLowerCase()} paint colors across {brandCount} brands including Sherwin-Williams, Benjamin Moore, and Behr.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Intro */}
      {familyContent?.intro && (
        <section className="bg-tertiary-fixed py-16 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="bg-primary h-1 w-12 mb-8" />
            <article id="family-intro" className="max-w-4xl text-on-surface-variant leading-relaxed">
              {familyContent.intro}
              {getFamilyAnchor(familySlug) && (
                <p className="mt-3">{getFamilyAnchor(familySlug)}</p>
              )}
            </article>
            <ColorLinkEnhancer containerRef="family-intro" />
          </div>
        </section>
      )}

      {/* Color Library \u2014 client-driven for filter/pagination interactivity.
          Suspense fallback renders the static unfiltered page-1 state, which
          is what Googlebot sees. useSearchParams in the client component
          requires the Suspense boundary so the rest of the page can still
          be statically prerendered. */}
      <section className="py-24 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <FamilyColorLibraryFallback
                familySlug={familySlug}
                familyName={familyName}
                brands={brands}
                initialColors={colors}
                initialTotalCount={totalCount}
              />
            }
          >
            <FamilyColorLibrary
              familySlug={familySlug}
              familyName={familyName}
              brands={brands}
              initialColors={colors}
              initialTotalCount={totalCount}
            />
          </Suspense>
        </div>
      </section>

      {/* Guide content */}
      {familyContent?.guide && (
        <section className="py-16 px-6 md:px-12 bg-tertiary-fixed">
          <div className="max-w-7xl mx-auto">
            <article id="family-guide" className="max-w-4xl text-on-surface-variant">
              {familyContent.guide}
            </article>
            <ColorLinkEnhancer containerRef="family-guide" />
          </div>
        </section>
      )}

      {/* Related reading — reciprocal links to the family's round-up posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 px-6 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">Related reading</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {relatedPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}
                  className="group block rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 hover:shadow-lg transition-all">
                  <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant line-clamp-2">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-primary font-bold text-sm group-hover:gap-2 transition-all">Read the guide <span>&rarr;</span></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse Other Families */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">Browse Other Color Families</h2>
          <div className="flex flex-wrap gap-3">
            {validFamilies
              .filter((f) => f !== familySlug)
              .map((f) => {
                const fData = familyColors[f] ?? { hex: "#9CA3AF" };
                return (
                  <Link key={f} href={`/colors/family/${f}`}
                    className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:shadow-md hover:text-primary"
                  >
                    <span className={`inline-block h-5 w-5 rounded-full ${fData.border ? "border border-outline-variant/30" : ""}`} style={{ backgroundColor: fData.hex }} />
                    {capitalize(f.replace(/-/g, " "))}
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* FAQ — rendered as visible HTML in addition to the FAQPage JSON-LD
          above. Perplexity, AI Overviews, and ChatGPT primarily extract
          from visible DOM text rather than schema, so the family-specific
          undertone copy (M1) plus count and matching guidance need to be
          on-page, not schema-only. */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
            {familyName} Paint Colors — Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10">
              <summary className="flex cursor-pointer items-center justify-between px-6 py-5 font-headline font-bold text-on-surface hover:text-primary transition-colors">
                How many {familyName.toLowerCase()} paint colors are catalogued?
                <svg className="h-5 w-5 shrink-0 text-outline transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </summary>
              <div className="px-6 pb-5 text-on-surface-variant leading-relaxed">
                Paint Color HQ catalogs {totalCount.toLocaleString()} {familyName.toLowerCase()} paint colors across {brandCount} major brands, including Sherwin-Williams, Benjamin Moore, Behr, Valspar, PPG, Dunn-Edwards, and Farrow & Ball.
              </div>
            </details>
            <details className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10">
              <summary className="flex cursor-pointer items-center justify-between px-6 py-5 font-headline font-bold text-on-surface hover:text-primary transition-colors">
                What undertones do {familyName.toLowerCase()} paint colors have?
                <svg className="h-5 w-5 shrink-0 text-outline transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </summary>
              <div className="px-6 pb-5 text-on-surface-variant leading-relaxed">
                {FAMILY_UNDERTONE_ANSWERS[familySlug] ??
                  `${familyName} paint colors come in warm undertones (leaning yellower, redder, or browner), cool undertones (leaning bluer or greener), and balanced neutrals. Use the undertone filter above to narrow your search.`}
              </div>
            </details>
            <details className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10">
              <summary className="flex cursor-pointer items-center justify-between px-6 py-5 font-headline font-bold text-on-surface hover:text-primary transition-colors">
                How do I find a {familyName.toLowerCase()} paint color that matches across brands?
                <svg className="h-5 w-5 shrink-0 text-outline transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </summary>
              <div className="px-6 pb-5 text-on-surface-variant leading-relaxed">
                Every color page on Paint Color HQ shows cross-brand matches ranked by CIEDE2000 Delta E score. Colors with a Delta E under 2.0 are virtually identical on a finished wall. Click any color in the grid above to see its closest matches across all {brandCount} brands.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Inspiration Featuring [Family] — closes the family -> inspiration
          cluster gap the audit flagged. Cards link to curated palettes that
          prominently feature this color family. */}
      {(() => {
        const relatedSlugs = getFamilyRelatedPalettes(familySlug);
        const relatedPalettes = relatedSlugs
          .map((slug) => getPaletteBySlug(slug))
          .filter((p): p is NonNullable<typeof p> => p !== undefined);
        if (relatedPalettes.length === 0) return null;
        return (
          <>
            {/* ItemList JSON-LD for the inspiration card grid. Gives crawlers a
                structured signal that family hubs surface non-color content
                (the CollectionPage ItemList only covers the color grid). */}
            <JsonLd data={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `Inspiration palettes featuring ${familyName.toLowerCase()} colors`,
              numberOfItems: relatedPalettes.length,
              itemListElement: relatedPalettes.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.name,
                url: `https://www.paintcolorhq.com/inspiration/${p.slug}`,
              })),
            }} />
            <section className="py-20 px-6 md:px-12 bg-surface-container-low">
            <div className="max-w-7xl mx-auto">
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-2">
                Inspiration Featuring {familyName}
              </h2>
              <p className="text-on-surface-variant mb-8 max-w-2xl">
                Curated palettes where {familyName.toLowerCase()} plays a leading role — see how designers pair these colors in real rooms.
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPalettes.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/inspiration/${p.slug}`}
                    className="group block overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant/10 transition-all hover:shadow-lg"
                  >
                    <div className="flex h-24 w-full">
                      {p.colors.map((hex, i) => (
                        <div
                          key={i}
                          className="flex-1"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <div className="p-5">
                      <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                        {p.name}
                      </p>
                      <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
          </>
        );
      })()}

      <Footer />
    </div>
  );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FamilyColorLibrary } from "@/components/family-color-library";
import { getColorsByFamily, getColorsByFamilyCount, getAllBrands } from "@/lib/queries";
import { getFamilyContent } from "@/lib/family-content";
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
            <div id="family-intro" className="max-w-4xl text-on-surface-variant leading-relaxed">
              {familyContent.intro}
            </div>
            <ColorLinkEnhancer containerRef="family-intro" />
          </div>
        </section>
      )}

      {/* Color Library \u2014 client-driven for filter/pagination interactivity. The
          server-rendered initial state (page 1, unfiltered) is what Google
          indexes; client refetches via /api/family/[slug]/colors on URL change. */}
      <section className="py-24 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <FamilyColorLibrary
            familySlug={familySlug}
            familyName={familyName}
            brands={brands}
            initialColors={colors}
            initialTotalCount={totalCount}
          />
        </div>
      </section>

      {/* Guide content */}
      {familyContent?.guide && (
        <section className="py-16 px-6 md:px-12 bg-tertiary-fixed">
          <div className="max-w-7xl mx-auto">
            <div id="family-guide" className="max-w-4xl text-on-surface-variant">
              {familyContent.guide}
            </div>
            <ColorLinkEnhancer containerRef="family-guide" />
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

      <Footer />
    </div>
  );
}

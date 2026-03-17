import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ColorSwatch } from "@/components/color-swatch";
import { getBrandBySlug, getTopCrossBrandMatches } from "@/lib/queries";

export const revalidate = 3600;

const MAJOR_BRANDS = [
  "sherwin-williams",
  "benjamin-moore",
  "behr",
  "valspar",
  "ppg",
];

interface PageProps {
  params: Promise<{
    sourceBrandSlug: string;
    targetBrandSlug: string;
  }>;
}

function getDeltaELabel(deltaE: number): { label: string; className: string } {
  if (deltaE < 1) return { label: "Exact Match", className: "text-green-700 bg-green-50" };
  if (deltaE < 2) return { label: "Very Close", className: "text-green-600 bg-green-50" };
  if (deltaE < 3) return { label: "Close Match", className: "text-blue-700 bg-blue-50" };
  if (deltaE < 5) return { label: "Near Match", className: "text-yellow-700 bg-yellow-50" };
  return { label: "Approximate", className: "text-orange-700 bg-orange-50" };
}

function formatBrandName(brand: { name: string }): string {
  return brand.name;
}

export async function generateStaticParams() {
  const params: { sourceBrandSlug: string; targetBrandSlug: string }[] = [];
  for (const source of MAJOR_BRANDS) {
    for (const target of MAJOR_BRANDS) {
      if (source !== target) {
        params.push({ sourceBrandSlug: source, targetBrandSlug: target });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sourceBrandSlug, targetBrandSlug } = await params;

  const [sourceBrand, targetBrand] = await Promise.all([
    getBrandBySlug(sourceBrandSlug),
    getBrandBySlug(targetBrandSlug),
  ]);

  if (!sourceBrand || !targetBrand) return { title: "Brand Match Not Found" };

  const title = `${formatBrandName(sourceBrand)} to ${formatBrandName(targetBrand)} Color Matches | Paint Color HQ`;
  const description = `Find the closest ${formatBrandName(targetBrand)} equivalent for any ${formatBrandName(sourceBrand)} color. Top 50 matches ranked by color accuracy using Delta E 2000.`;
  const url = `https://www.paintcolorhq.com/match/${sourceBrandSlug}/to/${targetBrandSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
    },
  };
}

export default async function BrandToBrandMatchPage({ params }: PageProps) {
  const { sourceBrandSlug, targetBrandSlug } = await params;

  const [sourceBrand, targetBrand] = await Promise.all([
    getBrandBySlug(sourceBrandSlug),
    getBrandBySlug(targetBrandSlug),
  ]);

  if (!sourceBrand || !targetBrand) notFound();

  const matches = await getTopCrossBrandMatches(sourceBrandSlug, targetBrandSlug, 50);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${formatBrandName(sourceBrand)} to ${formatBrandName(targetBrand)} Color Matches`,
    description: `Top cross-brand color matches from ${formatBrandName(sourceBrand)} to ${formatBrandName(targetBrand)}`,
    numberOfItems: matches.length,
    itemListElement: matches.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${m.source.name} to ${m.match.name}`,
      url: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/${m.source.slug}-to-${targetBrandSlug}`,
    })),
  };

  const jsonLdString = JSON.stringify(jsonLd);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/brands" className="hover:text-gray-900">Brands</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">
            {formatBrandName(sourceBrand)} to {formatBrandName(targetBrand)}
          </span>
        </nav>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {formatBrandName(sourceBrand)} to {formatBrandName(targetBrand)} Color Matches
          </h1>
          <p className="mt-2 text-gray-600">
            The top {matches.length} closest color matches from {formatBrandName(sourceBrand)} to{" "}
            {formatBrandName(targetBrand)}, ranked by color accuracy using Delta E 2000.
            Lower Delta E means a closer match.
          </p>
        </div>

        {/* Match quality legend */}
        <div className="mb-6 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
            &lt; 2: Very Close
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
            2-3: Close Match
          </span>
          <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">
            3-5: Near Match
          </span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">
            5+: Approximate
          </span>
        </div>

        {matches.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {/* Table header - desktop */}
            <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-[1fr_40px_1fr_120px] sm:items-center sm:gap-4">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {formatBrandName(sourceBrand)}
              </span>
              <span />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {formatBrandName(targetBrand)}
              </span>
              <span className="text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Delta E
              </span>
            </div>

            {/* Match rows */}
            <div className="divide-y divide-gray-100">
              {matches.map((m) => {
                const { label, className } = getDeltaELabel(m.deltaE);
                return (
                  <Link
                    key={`${m.source.id}-${m.match.id}`}
                    href={`/match/${sourceBrandSlug}/${m.source.slug}-to-${targetBrandSlug}`}
                    className="block px-4 py-3 transition hover:bg-gray-50"
                  >
                    {/* Desktop layout */}
                    <div className="hidden sm:grid sm:grid-cols-[1fr_40px_1fr_120px] sm:items-center sm:gap-4">
                      {/* Source color */}
                      <div className="flex items-center gap-3">
                        <ColorSwatch hex={m.source.hex} size="md" />
                        <div>
                          <p className="font-medium text-gray-900">{m.source.name}</p>
                          {m.source.color_number && (
                            <p className="text-xs text-gray-500">{m.source.color_number}</p>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center text-gray-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>

                      {/* Match color */}
                      <div className="flex items-center gap-3">
                        <ColorSwatch hex={m.match.hex} size="md" />
                        <div>
                          <p className="font-medium text-gray-900">{m.match.name}</p>
                          {m.match.color_number && (
                            <p className="text-xs text-gray-500">{m.match.color_number}</p>
                          )}
                        </div>
                      </div>

                      {/* Delta E */}
                      <div className="text-right">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
                          {m.deltaE.toFixed(2)} - {label}
                        </span>
                      </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="flex items-center gap-3 sm:hidden">
                      <ColorSwatch hex={m.source.hex} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {m.source.name}
                        </p>
                      </div>
                      <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <ColorSwatch hex={m.match.hex} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {m.match.name}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
                        {m.deltaE.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">
              No cross-brand matches found between {formatBrandName(sourceBrand)} and{" "}
              {formatBrandName(targetBrand)}.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          These are digital color matches based on color values. Actual pigments and finishes
          differ between brands. Always verify with physical paint samples before purchasing.
        </p>

        {/* CTA */}
        <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-blue-900">
            Looking for a specific color?
          </h2>
          <p className="mt-2 text-sm text-blue-700">
            Search our database of 25,000+ colors from all major paint brands.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search Colors
          </Link>
        </div>

        {/* Other brand match links */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">
            Other {formatBrandName(sourceBrand)} Matches
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MAJOR_BRANDS.filter(
              (b) => b !== sourceBrandSlug && b !== targetBrandSlug
            ).map((brandSlug) => {
              const brandNames: Record<string, string> = {
                "sherwin-williams": "Sherwin-Williams",
                "benjamin-moore": "Benjamin Moore",
                behr: "Behr",
                valspar: "Valspar",
                ppg: "PPG",
              };
              return (
                <Link
                  key={brandSlug}
                  href={`/match/${sourceBrandSlug}/to/${brandSlug}`}
                  className="rounded-lg border border-gray-200 p-4 text-center hover:shadow-md"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {formatBrandName(sourceBrand)} to {brandNames[brandSlug]}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <AdSenseScript />
      <Footer />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
    </div>
  );
}

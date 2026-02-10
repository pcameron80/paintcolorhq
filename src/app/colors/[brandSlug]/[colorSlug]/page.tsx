import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorSwatch } from "@/components/color-swatch";
import { getColorBySlug, getCrossBrandMatches } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ brandSlug: string; colorSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brandSlug, colorSlug } = await params;
  const color = await getColorBySlug(brandSlug, colorSlug);
  if (!color) return { title: "Color Not Found" };

  return {
    title: `${color.name} by ${color.brand.name} | ${color.hex.toUpperCase()}`,
    description: `${color.name} (${color.color_number ?? color.hex.toUpperCase()}) by ${color.brand.name}. Hex ${color.hex.toUpperCase()}, RGB(${color.rgb_r}, ${color.rgb_g}, ${color.rgb_b})${color.lrv ? `, LRV ${color.lrv.toFixed(1)}` : ""}. Find closest matches from other brands.`,
  };
}

export default async function ColorPage({ params }: PageProps) {
  const { brandSlug, colorSlug } = await params;
  const color = await getColorBySlug(brandSlug, colorSlug);
  if (!color) notFound();

  const matches = await getCrossBrandMatches(color.id);

  // Group matches by brand
  const matchesByBrand = matches.reduce(
    (acc, match) => {
      const brandName = match.match_color.brand.name;
      if (!acc[brandName]) acc[brandName] = [];
      acc[brandName].push(match);
      return acc;
    },
    {} as Record<string, typeof matches>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/brands/${color.brand.slug}`}
            className="hover:text-gray-900"
          >
            {color.brand.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{color.name}</span>
        </nav>

        {/* Color Hero */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div
            className="aspect-square w-full rounded-2xl border border-gray-200"
            style={{ backgroundColor: color.hex }}
          />

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{color.name}</h1>
            <p className="mt-1 text-lg text-gray-600">{color.brand.name}</p>
            {color.color_number && (
              <p className="mt-1 text-sm text-gray-500">{color.color_number}</p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Hex
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
                  {color.hex.toUpperCase()}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  RGB
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
                  {color.rgb_r}, {color.rgb_g}, {color.rgb_b}
                </p>
              </div>
              {color.lrv != null && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    LRV
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {Number(color.lrv).toFixed(1)}
                  </p>
                </div>
              )}
              {color.color_family && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Color Family
                  </p>
                  <Link
                    href={`/colors/${color.color_family}`}
                    className="mt-1 block text-lg font-semibold capitalize text-blue-600 hover:underline"
                  >
                    {color.color_family}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cross-Brand Matches */}
        {Object.keys(matchesByBrand).length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">
              Closest Matches from Other Brands
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Closest digital match based on color values. Pigments and finishes
              differ between brands — always verify with physical samples.
            </p>

            <div className="mt-8 space-y-8">
              {Object.entries(matchesByBrand).map(([brandName, brandMatches]) => (
                <div key={brandName}>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {brandName}
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {brandMatches.slice(0, 3).map((match) => (
                      <Link
                        key={match.id}
                        href={`/colors/${match.match_color.brand.slug}/${match.match_color.slug}`}
                        className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                      >
                        <ColorSwatch hex={match.match_color.hex} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">
                            {match.match_color.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {match.match_color.hex.toUpperCase()}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Delta E: {Number(match.delta_e_score).toFixed(2)}
                            {Number(match.delta_e_score) < 2
                              ? " (very close)"
                              : Number(match.delta_e_score) < 5
                                ? " (close)"
                                : " (noticeable difference)"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: `${color.name} Paint Color`,
              brand: {
                "@type": "Brand",
                name: color.brand.name,
              },
              color: color.hex,
              description: `${color.name} paint color by ${color.brand.name}. Hex: ${color.hex.toUpperCase()}, RGB: ${color.rgb_r}, ${color.rgb_g}, ${color.rgb_b}`,
              sku: color.color_number ?? undefined,
            }),
          }}
        />
      </main>

      <Footer />
    </div>
  );
}

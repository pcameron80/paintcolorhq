import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorSwatch } from "@/components/color-swatch";
import { getColorBySlug, getCrossBrandMatches, getBrandBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    sourceBrandSlug: string;
    "colorSlug]-to-[targetBrandSlug": string;
  }>;
}

function parseParams(raw: string): { colorSlug: string; targetBrandSlug: string } | null {
  const match = raw.match(/^(.+)-to-(.+)$/);
  if (!match) return null;
  return { colorSlug: match[1], targetBrandSlug: match[2] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sourceBrandSlug } = await params;
  const rawSlug = (await params)["colorSlug]-to-[targetBrandSlug"];
  const parsed = parseParams(rawSlug);
  if (!parsed) return { title: "Match Not Found" };

  const [sourceColor, targetBrand] = await Promise.all([
    getColorBySlug(sourceBrandSlug, parsed.colorSlug),
    getBrandBySlug(parsed.targetBrandSlug),
  ]);

  if (!sourceColor || !targetBrand) return { title: "Match Not Found" };

  return {
    title: `${sourceColor.brand.name} ${sourceColor.name} in ${targetBrand.name}`,
    description: `Find the closest ${targetBrand.name} equivalent to ${sourceColor.brand.name} ${sourceColor.name} (${sourceColor.hex.toUpperCase()}). Cross-brand paint color matching.`,
  };
}

export default async function MatchPage({ params }: PageProps) {
  const { sourceBrandSlug } = await params;
  const rawSlug = (await params)["colorSlug]-to-[targetBrandSlug"];
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

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
          {sourceColor.brand.name} {sourceColor.name} in {targetBrand.name}
        </h1>

        {bestMatch ? (
          <>
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
                {Number(bestMatch.delta_e_score) < 2
                  ? " — Very close match"
                  : Number(bestMatch.delta_e_score) < 5
                    ? " — Close match"
                    : " — Noticeable difference"}
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
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mt-12 text-center text-gray-500">
            No matches found in {targetBrand.name}.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}

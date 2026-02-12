import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getColorById } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Compare Paint Colors Side by Side",
  description:
    "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
  alternates: { canonical: "https://www.paintcolorhq.com/compare" },
  openGraph: {
    title: "Compare Paint Colors Side by Side",
    description:
      "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
    url: "https://www.paintcolorhq.com/compare",
  },
};

interface PageProps {
  searchParams: Promise<{ color1?: string; color2?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { color1: color1Id, color2: color2Id } = await searchParams;

  const [color1, color2] = await Promise.all([
    color1Id ? getColorById(color1Id) : null,
    color2Id ? getColorById(color2Id) : null,
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Compare Paint Colors
        </h1>
        <p className="mt-2 text-gray-600">
          Compare two paint colors side by side.
        </p>

        {color1 && color2 ? (
          <div className="mt-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Color 1 */}
              <div>
                <div
                  className="aspect-square w-full rounded-2xl border border-gray-200"
                  style={{ backgroundColor: color1.hex }}
                />
                <div className="mt-4">
                  <Link
                    href={`/colors/${color1.brand.slug}/${color1.slug}`}
                    className="text-xl font-semibold text-gray-900 hover:text-brand-blue"
                  >
                    {color1.name}
                  </Link>
                  <p className="text-gray-600">{color1.brand.name}</p>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Hex</dt>
                    <dd className="font-mono font-medium">
                      {color1.hex.toUpperCase()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">RGB</dt>
                    <dd className="font-mono">
                      {color1.rgb_r}, {color1.rgb_g}, {color1.rgb_b}
                    </dd>
                  </div>
                  {color1.lrv != null && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">LRV</dt>
                      <dd>{Number(color1.lrv).toFixed(1)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Color 2 */}
              <div>
                <div
                  className="aspect-square w-full rounded-2xl border border-gray-200"
                  style={{ backgroundColor: color2.hex }}
                />
                <div className="mt-4">
                  <Link
                    href={`/colors/${color2.brand.slug}/${color2.slug}`}
                    className="text-xl font-semibold text-gray-900 hover:text-brand-blue"
                  >
                    {color2.name}
                  </Link>
                  <p className="text-gray-600">{color2.brand.name}</p>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Hex</dt>
                    <dd className="font-mono font-medium">
                      {color2.hex.toUpperCase()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">RGB</dt>
                    <dd className="font-mono">
                      {color2.rgb_r}, {color2.rgb_g}, {color2.rgb_b}
                    </dd>
                  </div>
                  {color2.lrv != null && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">LRV</dt>
                      <dd>{Number(color2.lrv).toFixed(1)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-gray-500">
              Use the{" "}
              <Link href="/search" className="text-brand-blue hover:underline">
                search
              </Link>{" "}
              to find colors, then compare them here.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

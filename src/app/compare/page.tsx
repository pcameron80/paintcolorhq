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

            {/* Dynamic comparison */}
            <div className="mt-8 rounded-lg bg-gray-50 p-6">
              <p className="text-base leading-relaxed text-gray-700">
                {color1.name} ({color1.hex.toUpperCase()}) by{" "}
                {color1.brand.name}
                {color1.lrv != null && color2.lrv != null ? (
                  <>
                    {" "}has an LRV of {Number(color1.lrv).toFixed(1)},{" "}
                    {Number(color1.lrv) > Number(color2.lrv)
                      ? "higher"
                      : Number(color1.lrv) < Number(color2.lrv)
                        ? "lower"
                        : "identical"}{" "}
                    than {color2.name}&apos;s{" "}
                    {Number(color2.lrv).toFixed(1)}
                    {Math.abs(Number(color1.lrv) - Number(color2.lrv)) > 10
                      ? ". This is a significant difference that will be clearly visible on a wall"
                      : Math.abs(
                            Number(color1.lrv) - Number(color2.lrv)
                          ) > 3
                        ? ". This difference is noticeable, especially in side-by-side samples"
                        : ". These colors reflect a similar amount of light and will read close in brightness"}
                    .
                  </>
                ) : (
                  <> and {color2.name} ({color2.hex.toUpperCase()}) by{" "}
                    {color2.brand.name} are shown above with their technical
                    values for easy comparison.</>
                )}{" "}
                Always compare with physical paint samples under the
                lighting conditions in your actual room before making a
                final decision.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-12">
            <div className="mx-auto max-w-2xl space-y-6 text-base leading-relaxed text-gray-700">
              <p>
                Comparing paint colors side by side is one of the most
                effective ways to spot subtle differences that are invisible
                on their own. Even colors that look identical in a fan deck
                can reveal different undertones, brightness levels, and
                warmth when placed next to each other.
              </p>
              <h2 className="text-xl font-bold text-gray-900">
                What to Look For When Comparing
              </h2>
              <ul className="list-disc space-y-3 pl-5 text-sm text-gray-600">
                <li>
                  <strong>LRV (Light Reflectance Value)</strong> — ranges
                  from 0 (pure black) to 100 (pure white). A difference of
                  5 or more is noticeable on a wall. Higher LRV colors make
                  rooms feel larger and brighter.
                </li>
                <li>
                  <strong>Undertone</strong> — two grays can look completely
                  different if one leans blue and the other leans green.
                  Comparing reveals these hidden tones.
                </li>
                <li>
                  <strong>Hex and RGB values</strong> — the digital
                  fingerprint of each color. Small differences in these
                  numbers can translate to visible differences on a painted
                  surface.
                </li>
              </ul>
              <p className="text-sm text-gray-600">
                To get started,{" "}
                <Link
                  href="/search"
                  className="text-brand-blue hover:underline"
                >
                  search for a color
                </Link>{" "}
                and use the compare button on any color page. You can also
                upload a photo with the{" "}
                <Link
                  href="/tools/color-identifier"
                  className="text-brand-blue hover:underline"
                >
                  Color Identifier
                </Link>{" "}
                to find the closest paint match, then compare it against
                alternatives.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

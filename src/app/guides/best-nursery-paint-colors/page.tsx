import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getGuideColors } from "@/lib/queries";

export const revalidate = 3600;

const CANONICAL_URL =
  "https://www.paintcolorhq.com/guides/best-nursery-paint-colors";

export const metadata: Metadata = {
  title:
    "Best Nursery Paint Colors - Safe, Calming Colors That Grow With Your Child",
  description:
    "Skip the stereotypes. These nursery paint colors are calming, gender-neutral, and versatile enough to last from baby through school age. Real colors from all major brands.",
  alternates: { canonical: CANONICAL_URL },
  openGraph: {
    title:
      "Best Nursery Paint Colors - Safe, Calming Colors That Grow With Your Child",
    description:
      "Skip the stereotypes. These nursery paint colors are calming, gender-neutral, and versatile enough to last from baby through school age. Real colors from all major brands.",
    type: "article",
    url: CANONICAL_URL,
  },
};

const BRAND_SLUGS = [
  "sherwin-williams",
  "benjamin-moore",
  "behr",
  "valspar",
  "ppg",
];

export default async function BestNurseryPaintColorsPage() {
  const [softGreens, warmWhites, mutedBlues] = await Promise.all([
    getGuideColors({
      colorFamilies: ["green"],
      lrvMin: 45,
      lrvMax: 75,
      undertones: ["warm", "neutral", "warm-yellow"],
      brandSlugs: BRAND_SLUGS,
      limit: 8,
    }),
    getGuideColors({
      colorFamilies: ["white", "off-white"],
      lrvMin: 70,
      lrvMax: 90,
      undertones: ["warm", "warm-yellow"],
      brandSlugs: BRAND_SLUGS,
      limit: 8,
    }),
    getGuideColors({
      colorFamilies: ["blue"],
      lrvMin: 45,
      lrvMax: 70,
      brandSlugs: BRAND_SLUGS,
      limit: 8,
    }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Best Nursery Paint Colors - Safe, Calming Colors That Grow With Your Child",
    description:
      "Skip the stereotypes. These nursery paint colors are calming, gender-neutral, and versatile enough to last from baby through school age. Real colors from all major brands.",
    datePublished: "2026-03-10",
    url: CANONICAL_URL,
    author: {
      "@type": "Organization",
      name: "Paint Color HQ",
      url: "https://www.paintcolorhq.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Paint Color HQ",
      url: "https://www.paintcolorhq.com",
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/guides" className="hover:text-gray-700">
              Guides
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Nursery Paint Colors</span>
          </nav>

          {/* H1 + Intro */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Best Nursery Paint Colors
          </h1>
          <p className="mt-4 max-w-3xl text-gray-700 leading-relaxed">
            The best nursery colors are calming, versatile, and won&apos;t need
            repainting when your child turns three. Focus on soft, muted tones
            with warm undertones &mdash; they create a soothing environment
            while looking good for years.
          </p>

          {/* What Makes a Good Nursery Color */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              What Makes a Good Nursery Color
            </h2>
            <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-gray-700 leading-relaxed">
              <li>
                <strong>Calming, muted tones</strong> &mdash; avoid overly
                saturated colors
              </li>
              <li>
                <strong>LRV 55&ndash;80</strong> &mdash; bright enough for a
                cheerful room, not so bright it&apos;s stimulating
              </li>
              <li>
                <strong>Warm or neutral undertones</strong> &mdash; creates a
                cozy, comforting space
              </li>
              <li>
                <strong>Gender-neutral options</strong> &mdash; soft greens,
                warm grays, creamy whites, muted blues
              </li>
              <li>
                <strong>Avoid:</strong> bright primary colors, pure white
                (institutional feeling), dark colors (makes the room feel small)
              </li>
            </ul>
          </section>

          {/* Soft Greens & Sage */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Soft Greens &amp; Sage
            </h2>
            <p className="mt-2 max-w-3xl text-gray-700 leading-relaxed">
              Soft greens are the most popular nursery color choice &mdash;
              they&apos;re calming, gender-neutral, and pair beautifully with
              natural wood furniture.
            </p>
            {softGreens.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {softGreens.map((color) => (
                  <ColorCard
                    key={color.id}
                    name={color.name}
                    hex={color.hex}
                    brandName={color.brand.name}
                    brandSlug={color.brand.slug}
                    colorSlug={color.slug}
                    colorNumber={color.color_number}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Warm Whites & Creams */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Warm Whites &amp; Creams
            </h2>
            <p className="mt-2 max-w-3xl text-gray-700 leading-relaxed">
              Warm whites create a bright, airy nursery without the clinical
              feel of pure white. Pair with colorful accents that you can swap
              as your child grows.
            </p>
            {warmWhites.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {warmWhites.map((color) => (
                  <ColorCard
                    key={color.id}
                    name={color.name}
                    hex={color.hex}
                    brandName={color.brand.name}
                    brandSlug={color.brand.slug}
                    colorSlug={color.slug}
                    colorNumber={color.color_number}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Muted Blues */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Muted Blues</h2>
            <p className="mt-2 max-w-3xl text-gray-700 leading-relaxed">
              Soft, dusty blues are timeless nursery colors. Look for muted
              tones with gray or green undertones rather than bright primary
              blues.
            </p>
            {mutedBlues.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {mutedBlues.map((color) => (
                  <ColorCard
                    key={color.id}
                    name={color.name}
                    hex={color.hex}
                    brandName={color.brand.name}
                    brandSlug={color.brand.slug}
                    colorSlug={color.slug}
                    colorNumber={color.color_number}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Safety Note */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Safety Note</h2>
            <p className="mt-2 max-w-3xl text-gray-700 leading-relaxed">
              Use zero-VOC or low-VOC paint in nurseries. Paint at least 2
              weeks before the baby arrives to allow off-gassing. All major
              brands (Sherwin-Williams Harmony, Benjamin Moore Natura, Behr
              Premium Plus) offer zero-VOC formulas.
            </p>
          </section>

          {/* CTA */}
          <section className="mt-12">
            <Link
              href="/tools/room-visualizer"
              className="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Preview these colors in a room
              <span className="ml-2" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </section>

          {/* Related Guides */}
          <section className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Related Guides
            </h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/guides/best-bedroom-paint-colors"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Best Bedroom Paint Colors
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/best-living-room-paint-colors"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Best Living Room Paint Colors
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/best-kitchen-paint-colors"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Best Kitchen Paint Colors
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

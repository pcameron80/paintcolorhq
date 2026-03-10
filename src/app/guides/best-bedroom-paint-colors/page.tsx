import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getGuideColors } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best Bedroom Paint Colors for Restful Sleep (2026 Guide)",
  description:
    "The best bedroom paint colors promote relaxation and restful sleep. Browse calming colors from Sherwin-Williams, Benjamin Moore, Behr, and more — with real hex codes and LRV data.",
  alternates: {
    canonical:
      "https://www.paintcolorhq.com/guides/best-bedroom-paint-colors",
  },
  openGraph: {
    title: "Best Bedroom Paint Colors for Restful Sleep (2026 Guide)",
    description:
      "The best bedroom paint colors promote relaxation and restful sleep. Browse calming colors from Sherwin-Williams, Benjamin Moore, Behr, and more — with real hex codes and LRV data.",
    type: "article",
    url: "https://www.paintcolorhq.com/guides/best-bedroom-paint-colors",
  },
};

const BRAND_SLUGS = [
  "sherwin-williams",
  "benjamin-moore",
  "behr",
  "valspar",
  "ppg",
];

export default async function BestBedroomPaintColorsPage() {
  const [calmingBlues, soothingGreens, warmNeutrals] = await Promise.all([
    getGuideColors({
      colorFamilies: ["blue"],
      lrvMin: 35,
      lrvMax: 65,
      undertones: ["cool", "neutral"],
      brandSlugs: BRAND_SLUGS,
      limit: 8,
    }),
    getGuideColors({
      colorFamilies: ["green"],
      lrvMin: 30,
      lrvMax: 60,
      undertones: ["cool", "neutral", "warm"],
      brandSlugs: BRAND_SLUGS,
      limit: 8,
    }),
    getGuideColors({
      colorFamilies: ["gray", "beige"],
      lrvMin: 40,
      lrvMax: 65,
      undertones: ["warm", "neutral"],
      brandSlugs: BRAND_SLUGS,
      limit: 8,
    }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Best Bedroom Paint Colors for Restful Sleep",
    description:
      "The best bedroom paint colors promote relaxation and restful sleep. Browse calming colors from Sherwin-Williams, Benjamin Moore, Behr, and more — with real hex codes and LRV data.",
    datePublished: "2026-03-10",
    url: "https://www.paintcolorhq.com/guides/best-bedroom-paint-colors",
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
            <span className="text-gray-900">Bedroom Paint Colors</span>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Best Bedroom Paint Colors for Restful Sleep
          </h1>

          {/* Intro */}
          <p className="mt-6 text-gray-700 leading-relaxed">
            Your bedroom color directly affects sleep quality. Research shows
            cool, muted tones promote relaxation, while bright or warm colors
            can be stimulating. The best bedroom colors have a calming undertone
            and an LRV between 40 and 70 — dark enough to feel cozy, light
            enough to not feel oppressive.
          </p>

          {/* What Science Says */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              What Science Says About Bedroom Colors
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700 leading-relaxed">
              <li>
                Blues and greens reduce heart rate and blood pressure, making
                them ideal for winding down before sleep
              </li>
              <li>
                Muted, desaturated colors are more calming than saturated ones —
                think dusty blue rather than royal blue
              </li>
              <li>
                An LRV between 40 and 65 creates a &quot;cocoon&quot; effect
                without making the room feel dark or cave-like
              </li>
              <li>
                Avoid reds and bright yellows in bedrooms — they&apos;re
                energizing colors that can raise alertness
              </li>
            </ul>
          </section>

          {/* Calming Blues */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Calming Blues</h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              Blue is the number one bedroom color choice for a reason. These
              muted, restful blues work with both warm and cool bedroom decor.
            </p>
            {calmingBlues.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {calmingBlues.map((color) => (
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
            ) : (
              <p className="mt-6 text-gray-500">
                No matching colors found. Check back soon as we expand our
                database.
              </p>
            )}
          </section>

          {/* Soothing Greens */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Soothing Greens
            </h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              Sage greens and muted olive tones bring nature indoors. They pair
              beautifully with linen, wood, and warm metallics.
            </p>
            {soothingGreens.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {soothingGreens.map((color) => (
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
            ) : (
              <p className="mt-6 text-gray-500">
                No matching colors found. Check back soon as we expand our
                database.
              </p>
            )}
          </section>

          {/* Warm Neutrals */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Warm Neutrals
            </h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              For a cozy, enveloping bedroom that works year-round, warm grays
              and soft beiges are hard to beat.
            </p>
            {warmNeutrals.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {warmNeutrals.map((color) => (
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
            ) : (
              <p className="mt-6 text-gray-500">
                No matching colors found. Check back soon as we expand our
                database.
              </p>
            )}
          </section>

          {/* Master Bedroom vs Guest Bedroom */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Master Bedroom vs Guest Bedroom
            </h2>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Master bedrooms benefit from deeper, moodier tones in the LRV
              30-50 range. These create an intimate, restful atmosphere
              that&apos;s perfect for your personal retreat. Guest bedrooms
              should be lighter and more neutral (LRV 55-70) since
              guests&apos; preferences vary — a soft warm white or pale gray
              feels welcoming without being polarizing.
            </p>
          </section>

          {/* Sheen Recommendation */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Sheen Recommendation
            </h2>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Use eggshell or matte finish in bedrooms. Higher sheens reflect
              light and can feel clinical, especially under overhead lighting.
              Matte hides wall imperfections and creates a softer, more relaxed
              appearance that suits a sleeping space.
            </p>
          </section>

          {/* CTA */}
          <section className="mt-16">
            <Link
              href="/tools/palette-generator"
              className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Build a bedroom palette
            </Link>
          </section>

          {/* Related Guides */}
          <section className="mt-16 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Related Guides
            </h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/guides/best-nursery-paint-colors"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Nursery Paint Colors
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/best-living-room-paint-colors"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Living Room Paint Colors
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/best-paint-colors-north-facing-rooms"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Paint Colors for North-Facing Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/paint-sheen-guide"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Paint Sheen Guide
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

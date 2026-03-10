import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getGuideColors } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best Paint Colors for North-Facing Rooms (2026 Guide)",
  description:
    "North-facing rooms get cool, indirect light all day. Choose warm paint colors with high LRV to brighten the space without fighting the natural light.",
  alternates: {
    canonical:
      "https://www.paintcolorhq.com/guides/best-paint-colors-north-facing-rooms",
  },
  openGraph: {
    title: "Best Paint Colors for North-Facing Rooms (2026 Guide)",
    description:
      "North-facing rooms get cool, indirect light all day. Choose warm paint colors with high LRV to brighten the space without fighting the natural light.",
    type: "article",
    url: "https://www.paintcolorhq.com/guides/best-paint-colors-north-facing-rooms",
  },
};

export default async function NorthFacingRoomsGuidePage() {
  const colors = await getGuideColors({
    lrvMin: 55,
    lrvMax: 85,
    undertones: ["warm", "warm-yellow"],
    brandSlugs: [
      "sherwin-williams",
      "benjamin-moore",
      "behr",
      "valspar",
      "ppg",
    ],
    limit: 15,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Best Paint Colors for North-Facing Rooms",
    description:
      "North-facing rooms get cool, indirect light all day. Choose warm paint colors with high LRV to brighten the space without fighting the natural light.",
    datePublished: "2026-03-10",
    url: "https://www.paintcolorhq.com/guides/best-paint-colors-north-facing-rooms",
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
            <span className="text-gray-900">North-Facing Rooms</span>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Best Paint Colors for North-Facing Rooms
          </h1>

          {/* Intro */}
          <p className="mt-6 text-gray-700 leading-relaxed">
            North-facing rooms receive cool, indirect light throughout the day.
            This blue-tinted light makes cool colors look colder and warm colors
            look muddy if you choose the wrong shade. The key is selecting
            warm-undertone colors with a high LRV to compensate for the lack of
            direct sunlight.
          </p>

          {/* What to Look For */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              What to Look For
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700 leading-relaxed">
              <li>
                <strong>Warm undertones</strong> (yellow, gold, cream) to
                counteract the cool natural light
              </li>
              <li>
                <strong>High LRV (55+)</strong> to maximize brightness in a room
                that never gets direct sun
              </li>
              <li>
                <strong>Avoid pure whites</strong> — they&apos;ll look blue/gray.
                Choose creamy off-whites instead
              </li>
              <li>
                <strong>Warm grays</strong> with yellow/pink undertones work;
                cool grays will look depressing
              </li>
            </ul>
          </section>

          {/* Our Top Picks */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">Our Top Picks</h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              These colors have warm undertones and an LRV between 55 and 85,
              making them ideal for brightening north-facing spaces without
              washing out.
            </p>
            {colors.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {colors.map((color) => (
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

          {/* Colors to Avoid */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">
              Colors to Avoid
            </h2>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Cool grays, blues, and bright whites will feel sterile in a
              north-facing room. Even &quot;warm gray&quot; colors with a blue
              undertone will look cold. Test everything on the north wall before
              committing to a full room.
            </p>
          </section>

          {/* Pro Tip */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">
              Pro Tip: The 10 AM Test
            </h2>
            <p className="mt-4 text-gray-700 leading-relaxed">
              North light is most consistent around 10 AM. Paint a large sample
              (at least 2 feet square) on the wall and check it at 10 AM on a
              cloudy day. That is the baseline light your room will get for most
              of the day. If the color looks good under those conditions, it will
              work year-round.
            </p>
          </section>

          {/* CTA */}
          <section className="mt-16">
            <Link
              href="/tools/room-visualizer"
              className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Visualize these colors in your room
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
                  href="/guides/best-paint-colors-east-facing-rooms"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Paint Colors for East-Facing Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/best-paint-colors-south-facing-rooms"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Paint Colors for South-Facing Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/best-paint-colors-west-facing-rooms"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Paint Colors for West-Facing Rooms
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

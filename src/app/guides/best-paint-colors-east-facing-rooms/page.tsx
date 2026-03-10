import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getGuideColors } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best Paint Colors for East-Facing Rooms (2026 Guide)",
  description:
    "East-facing rooms get warm morning light and cool afternoon shadows. These warm-toned paint colors with the right LRV keep your room balanced all day.",
  alternates: {
    canonical:
      "https://www.paintcolorhq.com/guides/best-paint-colors-east-facing-rooms",
  },
  openGraph: {
    title: "Best Paint Colors for East-Facing Rooms (2026 Guide)",
    description:
      "East-facing rooms get warm morning light and cool afternoon shadows. These warm-toned paint colors with the right LRV keep your room balanced all day.",
    url: "https://www.paintcolorhq.com/guides/best-paint-colors-east-facing-rooms",
  },
};

export default async function EastFacingRoomsGuidePage() {
  const colors = await getGuideColors({
    lrvMin: 50,
    lrvMax: 75,
    undertones: ["warm", "warm-yellow", "warm-red"],
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
    headline: "Best Paint Colors for East-Facing Rooms (2026 Guide)",
    description:
      "East-facing rooms get warm morning light and cool afternoon shadows. These warm-toned paint colors with the right LRV keep your room balanced all day.",
    datePublished: "2026-03-10",
    publisher: {
      "@type": "Organization",
      name: "Paint Color HQ",
      url: "https://www.paintcolorhq.com",
    },
  };

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
          <Link href="/guides" className="hover:text-gray-900">
            Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">East-Facing Rooms</span>
        </nav>

        {/* H1 + Intro */}
        <h1 className="text-3xl font-bold text-gray-900">
          Best Paint Colors for East-Facing Rooms
        </h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          East-facing rooms get warm golden light in the morning and cooler,
          bluer light in the afternoon. The right paint color balances this
          shift — warm undertones prevent the afternoon &ldquo;cold&rdquo;
          feeling, while an LRV of 50&ndash;75 keeps the room bright without
          washing out in morning sun.
        </p>

        {/* What to Look For */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            What to Look For
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700 leading-relaxed">
            <li>
              <strong>Warm undertones</strong> (yellow, gold, peach) to
              counteract cool afternoon light
            </li>
            <li>
              <strong>LRV between 50&ndash;75</strong> — bright enough for
              afternoon, not blinding in morning
            </li>
            <li>
              <strong>Avoid cool blues and grays</strong> — they&rsquo;ll look
              icy after noon
            </li>
          </ul>
        </section>

        {/* Our Top Picks */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">Our Top Picks</h2>
          <p className="mt-2 text-gray-600">
            Real paint colors with warm undertones and an LRV of 50&ndash;75,
            ideal for east-facing rooms.
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
              No matching colors found. Check back soon.
            </p>
          )}
        </section>

        {/* Colors to Avoid */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">
            Colors to Avoid
          </h2>
          <p className="mt-4 text-gray-700 leading-relaxed">
            Cool grays, pure whites, and blues tend to look harsh and icy in
            east-facing rooms once the morning sun moves on. Without warm light
            to balance them, these cooler tones amplify the blue cast of
            afternoon shade, making the space feel cold and uninviting. If you
            love gray, opt for a greige (gray-beige) with a visible warm
            undertone instead.
          </p>
        </section>

        {/* Tips for Testing */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">
            Tips for Testing
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700 leading-relaxed">
            <li>
              Paint a large swatch (at least 2 ft x 2 ft) on the wall that
              receives the most direct morning light.
            </li>
            <li>
              Check the color at <strong>10 AM</strong> (peak warm light) and
              again at <strong>3 PM</strong> (cool afternoon shade) to see the
              full range.
            </li>
            <li>
              View samples on multiple walls — the east wall will look warmest
              in the morning, while the opposite wall stays cooler all day.
            </li>
            <li>
              Live with your samples for at least two full days before deciding.
              Overcast mornings will change the look significantly.
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-16">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              See These Colors in Your Room
            </h2>
            <p className="mt-2 text-gray-600">
              Upload a photo and preview any of these colors on your walls
              before you buy.
            </p>
            <Link
              href="/tools/room-visualizer"
              className="mt-4 inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Try the Room Visualizer
            </Link>
          </div>
        </section>

        {/* Related Guides */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">Related Guides</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Link
              href="/guides/best-paint-colors-north-facing-rooms"
              className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
            >
              <p className="font-medium text-gray-900">North-Facing Rooms</p>
              <p className="mt-1 text-sm text-gray-500">
                Colors that add warmth to low-light spaces.
              </p>
            </Link>
            <Link
              href="/guides/best-paint-colors-south-facing-rooms"
              className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
            >
              <p className="font-medium text-gray-900">South-Facing Rooms</p>
              <p className="mt-1 text-sm text-gray-500">
                Colors that handle bright, consistent light all day.
              </p>
            </Link>
            <Link
              href="/guides/best-paint-colors-west-facing-rooms"
              className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
            >
              <p className="font-medium text-gray-900">West-Facing Rooms</p>
              <p className="mt-1 text-sm text-gray-500">
                Colors that balance intense afternoon sun.
              </p>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

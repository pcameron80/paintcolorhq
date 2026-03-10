import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Paint Guides - Expert Tips for Choosing Paint Colors",
  description:
    "Data-driven paint guides to help you choose the right colors for every room. Real color recommendations from Sherwin-Williams, Benjamin Moore, Behr, and more.",
  alternates: { canonical: "https://www.paintcolorhq.com/guides" },
  openGraph: {
    title: "Paint Guides - Expert Tips for Choosing Paint Colors",
    description:
      "Data-driven paint guides to help you choose the right colors for every room.",
    url: "https://www.paintcolorhq.com/guides",
  },
};

const guides = [
  {
    title: "Best Paint Colors for North-Facing Rooms",
    description:
      "Warm-toned colors with high LRV to brighten rooms with cool, indirect light.",
    slug: "best-paint-colors-north-facing-rooms",
    icon: "🧭",
  },
  {
    title: "Best Paint Colors for East-Facing Rooms",
    description:
      "Colors that balance warm morning light and cool afternoon shadows.",
    slug: "best-paint-colors-east-facing-rooms",
    icon: "🌅",
  },
  {
    title: "Best Nursery Paint Colors",
    description:
      "Safe, calming colors that grow with your child — from baby through school age.",
    slug: "best-nursery-paint-colors",
    icon: "🍼",
  },
  {
    title: "Best Bedroom Paint Colors",
    description:
      "Calming blues, greens, and neutrals that promote restful sleep.",
    slug: "best-bedroom-paint-colors",
    icon: "🛏️",
  },
  {
    title: "Best Home Office Paint Colors",
    description:
      "Colors proven to boost focus, reduce eye fatigue, and look great on video calls.",
    slug: "best-home-office-paint-colors",
    icon: "💻",
  },
  {
    title: "Paint Sheen Guide",
    description:
      "Flat vs eggshell vs satin vs semi-gloss — which finish for which room.",
    slug: "paint-sheen-guide",
    icon: "✨",
  },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Guides</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">Paint Guides</h1>
        <p className="mt-3 text-lg text-gray-600">
          Data-driven guides with real color recommendations from all major
          brands. Every color pick includes hex codes, LRV, undertone, and
          cross-brand matches.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-lg"
            >
              <span className="text-3xl">{guide.icon}</span>
              <h2 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-brand-blue">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {guide.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-blue-900">
            Looking for a specific color?
          </h2>
          <p className="mt-2 text-sm text-blue-700">
            Search our database of 25,000+ colors from 14 paint brands.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search Colors
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

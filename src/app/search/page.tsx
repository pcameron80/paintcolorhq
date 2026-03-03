import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SearchResults } from "./search-results";

export const metadata: Metadata = {
  title: "Search Paint Colors",
  description:
    "Search 25,000+ paint colors by name, number, or hex code across all major brands.",
  alternates: { canonical: "https://www.paintcolorhq.com/search" },
  openGraph: {
    title: "Search Paint Colors",
    description:
      "Search 25,000+ paint colors by name, number, or hex code across all major brands.",
    url: "https://www.paintcolorhq.com/search",
  },
};

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Search Paint Colors
        </h1>
        <p className="mt-2 text-gray-600">
          Find colors by name, number, or hex code.
        </p>

        <Suspense>
          <SearchResults />
        </Suspense>

        {/* Educational content for SEO */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            How to Search for Paint Colors
          </h2>
          <div className="mt-6 space-y-6 text-base leading-relaxed text-gray-700">
            <p>
              Paint Color HQ indexes over 25,000 paint colors from 14 major
              brands including Sherwin-Williams, Benjamin Moore, Behr, Farrow
              &amp; Ball, and more. You can search in several ways to find
              exactly the color you need.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold text-gray-900">Search by Name</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Type the color name directly, like &ldquo;Agreeable
                  Gray&rdquo; or &ldquo;Hale Navy.&rdquo; Partial names work
                  too — searching &ldquo;sage&rdquo; returns all sage-toned
                  colors across every brand.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Search by Color Number
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Every paint brand assigns a unique code to each color. Search
                  &ldquo;SW 7029&rdquo; or &ldquo;OC-17&rdquo; to jump straight
                  to that specific color.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Search by Hex Code
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Found a color online and have the hex code? Search
                  &ldquo;#D6D0C4&rdquo; to find the closest real paint colors
                  that match that digital value.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse by Category</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Prefer to explore? Browse all colors by{" "}
                  <Link
                    href="/brands"
                    className="text-brand-blue hover:underline"
                  >
                    brand
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/colors"
                    className="text-brand-blue hover:underline"
                  >
                    color family
                  </Link>
                  , or use the{" "}
                  <Link
                    href="/tools/color-identifier"
                    className="text-brand-blue hover:underline"
                  >
                    Photo Color Identifier
                  </Link>{" "}
                  to match a color from any image.
                </p>
              </div>
            </div>
            <p>
              Each color page includes hex, RGB, and LRV values, undertone
              analysis, cross-brand matches from all 14 brands, color harmonies,
              curated room palettes, and links to buy from verified retailers.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

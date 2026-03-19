import { Suspense } from "react";
import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { SearchResults } from "./search-results";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const hasQuery = !!params.q;

  return {
    title: "Search Paint Colors",
    description:
      "Search 25,000+ paint colors by name, number, or hex code across all major brands.",
    alternates: { canonical: "https://www.paintcolorhq.com/search" },
    // Noindex parameterized search result URLs to prevent index bloat
    ...(hasQuery && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Search Paint Colors",
      description:
        "Search 25,000+ paint colors by name, number, or hex code across all major brands.",
      url: "https://www.paintcolorhq.com/search",
    },
  };
}

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
        <p className="mt-2 text-sm text-gray-500">
          Explore our database of 25,000+ colors from Sherwin-Williams, Benjamin
          Moore, Behr, and 11 more brands. Each color page shows cross-brand
          matches, undertone details, and coordinating palettes.
        </p>

        <Suspense>
          <SearchResults />
        </Suspense>

      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

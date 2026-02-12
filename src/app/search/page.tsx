import { Suspense } from "react";
import { Metadata } from "next";
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
      </main>

      <Footer />
    </div>
  );
}

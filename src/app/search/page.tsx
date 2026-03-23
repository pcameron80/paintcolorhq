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
    ...(hasQuery && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Search Paint Colors",
      description: "Search 25,000+ paint colors by name, number, or hex code across all major brands.",
      url: "https://www.paintcolorhq.com/search",
    },
  };
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Search</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Find Your Color
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Search 25,000+ colors by name, number, or hex code across 14 brands.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-7xl mx-auto">
          <Suspense>
            <SearchResults />
          </Suspense>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

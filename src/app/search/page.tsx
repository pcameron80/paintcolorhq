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

      <section className="py-16 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-3xl mx-auto text-on-surface-variant leading-relaxed">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">Search tips</h2>
          <p className="mb-4"><strong>By name</strong> — partial names work. Typing &ldquo;agreeable&rdquo; returns Agreeable Gray; &ldquo;chantilly&rdquo; returns Chantilly Lace. Brand prefixes are ignored, so you don&apos;t need to know who makes the color.</p>
          <p className="mb-4"><strong>By color number</strong> — brand codes work directly. &ldquo;7029&rdquo; pulls Agreeable Gray (Sherwin-Williams) and any other color ending in 7029 across brands. Dashes are optional: &ldquo;HDC-NT-11&rdquo; and &ldquo;hdcnt11&rdquo; both match.</p>
          <p className="mb-4"><strong>By hex code</strong> — paste a six-digit hex (with or without the #) to find the closest paint colors across all brands. This is useful when a designer hands you a screen color rather than a paint name, or when you&apos;re matching a fabric or tile.</p>
          <p>Benjamin Moore colors are indexed under their full name — &ldquo;Nile Green,&rdquo; not &ldquo;Nile&rdquo; — because BM names are frequently truncated in online references. If a search seems to miss a BM color, try the CC or OC number instead.</p>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

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
      "Search 26,000+ paint colors by name, number, or hex code across all major brands.",
    alternates: { canonical: "https://www.paintcolorhq.com/search" },
    ...(hasQuery && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Search Paint Colors",
      description: "Search 26,000+ paint colors by name, number, or hex code across all major brands.",
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
            Search 26,000+ colors by name, number, or hex code across 13 brands.
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
          <p className="mb-4"><strong>By name.</strong> Partial names work: &ldquo;agreeable&rdquo; finds Agreeable Gray and &ldquo;chantilly&rdquo; finds Chantilly Lace. &ldquo;Grey&rdquo; and &ldquo;gray&rdquo; are the same search. Add a brand to narrow the results, as in &ldquo;Behr Swiss Coffee&rdquo; or &ldquo;Sherwin Williams Alabaster&rdquo;. If that brand has no match, you see every brand&apos;s matches instead.</p>
          <p className="mb-4"><strong>By color number.</strong> Type the number the way it appears on the chip or the can. &ldquo;SW 7029&rdquo;, &ldquo;SW7029&rdquo; and &ldquo;7029&rdquo; all find Agreeable Gray. Spaces and dashes are optional, so &ldquo;OC17&rdquo;, &ldquo;OC 17&rdquo; and &ldquo;OC-17&rdquo; all find White Dove, and &ldquo;hdcnt11&rdquo; finds Behr HDC-NT-11. Benjamin Moore&apos;s OC and PM numbers work alongside the four-digit numbers, so &ldquo;OC-117&rdquo; finds Simply White (2143-70).</p>
          <p className="mb-4"><strong>By hex or RGB.</strong> Paste a six-digit hex code, with or without the #, or an RGB value such as &ldquo;rgb(240, 236, 228)&rdquo;. If no paint is that exact color, you get the closest paint colors across all brands. This helps when a designer hands you a screen color rather than a paint name, or when you are matching a fabric or tile.</p>
          <p>Search one color at a time. In a list separated by commas, only the first color is searched.</p>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

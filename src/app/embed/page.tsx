import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CopySnippet } from "./copy-snippet";

export const metadata: Metadata = {
  title: "Free Cross-Brand Paint Color Match Widget | Embed on Your Site",
  description:
    "Add a free cross-brand paint color matcher to your blog or site. Visitors pick a color and see the closest match across 13 brands, powered by CIEDE2000. One line of HTML.",
  alternates: { canonical: "https://www.paintcolorhq.com/embed" },
  openGraph: {
    title: "Free Cross-Brand Paint Color Match Widget",
    description:
      "Embed a cross-brand paint matcher in one line of HTML. Visitors pick a color and see the closest match across 13 brands.",
    type: "website",
    url: "https://www.paintcolorhq.com/embed",
  },
};

// JSON-LD helper - server-generated from trusted static values.
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const EMBED_SNIPPET = `<iframe src="https://www.paintcolorhq.com/embed/match"
  width="100%" height="480" loading="lazy"
  style="border:0;border-radius:12px;max-width:600px"
  title="Cross-brand paint color matcher"></iframe>
<p style="font:13px/1.4 sans-serif;color:#666">Cross-brand paint matching by
  <a href="https://www.paintcolorhq.com">PaintColorHQ</a></p>`;

export default function EmbedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Cross-Brand Paint Color Match Widget",
        url: "https://www.paintcolorhq.com/embed",
        applicationCategory: "DesignApplication",
        operatingSystem: "Any (web)",
        description:
          "A free embeddable widget that finds the closest cross-brand paint color match for any color, across 13 brands, using the CIEDE2000 color-difference standard.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        isAccessibleForFree: true,
        publisher: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Embed Widget", item: "https://www.paintcolorhq.com/embed" },
        ],
      }} />

      <main className="flex-1">
        <section className="px-6 md:px-12 pt-24 pb-12">
          <div className="mx-auto max-w-5xl">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Free widget</span>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface leading-[0.95] mt-2 mb-4">
              Add a cross-brand paint matcher to your site
            </h1>
            <p className="max-w-2xl text-lg text-on-surface-variant">
              Drop in one line of HTML. Your visitors pick any color and instantly see the closest match across 13 paint brands — Sherwin-Williams, Benjamin Moore, Behr, and more — ranked by the CIEDE2000 color-difference standard. Free, no signup, no API key.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 pb-16">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
            {/* Live preview */}
            <div>
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-4">Live preview</h2>
              <iframe
                src="/embed/match"
                width="100%"
                height={480}
                loading="lazy"
                title="Cross-brand paint color matcher preview"
                className="w-full rounded-xl border border-outline-variant/15 shadow-sm"
              />
            </div>

            {/* Snippet + steps */}
            <div>
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-4">Copy the embed code</h2>
              <CopySnippet code={EMBED_SNIPPET} />
              <p className="mt-3 text-sm text-on-surface-variant">
                Paste it anywhere in your page&apos;s HTML — a blog post, a sidebar, a resources page. Keep the credit line so your readers (and you) can find the full tool. That&apos;s the only condition: the widget is free.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-on-surface">
                <li className="flex gap-3"><span className="font-bold text-primary">1.</span> Copy the snippet above.</li>
                <li className="flex gap-3"><span className="font-bold text-primary">2.</span> Paste it into your site&apos;s HTML where you want the matcher to appear.</li>
                <li className="flex gap-3"><span className="font-bold text-primary">3.</span> Done — it loads on demand and updates itself as our color data grows.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-12 pb-20">
          <div className="mx-auto max-w-5xl rounded-2xl bg-surface-container-low p-8 md:p-10">
            <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-4">How the matching works</h2>
            <p className="max-w-3xl text-on-surface-variant">
              Every color is converted to CIE LAB color space, and the widget computes the CIEDE2000 Delta E — a perceptual color-difference standard used in paint and coatings manufacturing — between your color and our 26,000+ colors, then returns the closest match in each brand. The verdict labels (&ldquo;Near-identical,&rdquo; &ldquo;Very similar,&rdquo; &ldquo;Visible difference&rdquo;) map to standard Delta E thresholds. Full details on the{" "}
              <Link href="/methodology" className="text-primary underline-offset-4 hover:underline">methodology page</Link>.
            </p>
            <p className="mt-4 text-sm text-on-surface-variant">
              A perfect on-screen match can still read differently on a wall under your lighting — always confirm with a physical sample. Prefer to match by hand? Try the{" "}
              <Link href="/compare" className="text-primary underline-offset-4 hover:underline">Compare tool</Link> or the{" "}
              <Link href="/tools/color-identifier" className="text-primary underline-offset-4 hover:underline">photo color identifier</Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

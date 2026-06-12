import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "Methodology: How Paint Color HQ Matches Colors Across Brands",
  description:
    "How Paint Color HQ uses the CIEDE2000 color difference standard to match 27,000+ paint colors across 14 brands. The pipeline, data sources, Delta E thresholds, and known limitations.",
  alternates: { canonical: "https://www.paintcolorhq.com/methodology" },
  openGraph: {
    title: "How We Match Paint Colors Across Brands",
    description:
      "The CIEDE2000-based pipeline behind 27,000+ cross-brand paint color matches.",
    type: "article",
    url: "https://www.paintcolorhq.com/methodology",
  },
};

const techArticleJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "How Paint Color HQ Matches Colors Across Brands",
  description:
    "Methodology behind 27,000+ cross-brand paint color matches: CIEDE2000 color science, the matching pipeline, data sources, Delta E thresholds, and known limitations.",
  url: "https://www.paintcolorhq.com/methodology",
  author: {
    "@type": "Person",
    name: "Philip Cameron",
    url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff",
    jobTitle: "Founder, Paint Color HQ",
  },
  publisher: {
    "@type": "Organization",
    name: "Paint Color HQ",
    url: "https://www.paintcolorhq.com",
    logo: { "@type": "ImageObject", url: "https://www.paintcolorhq.com/logo.webp", width: 600, height: 60 },
  },
  proficiencyLevel: "Expert",
  keywords: ["CIEDE2000", "Delta E", "paint color matching", "color science", "color difference"],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
    { "@type": "ListItem", position: 2, name: "Methodology", item: "https://www.paintcolorhq.com/methodology" },
  ],
};

export default function MethodologyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <script type="application/ld+json">{JSON.stringify(techArticleJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>

      <main className="flex-1">
        <section className="relative pt-24 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <nav className="mb-6 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2 text-outline">/</span>
              <span className="text-on-surface">Methodology</span>
            </nav>
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Reference</span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-6">
              How we match paint colors across brands
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
              Paint Color HQ has 27,000+ paint colors from 14 brands and over a million pre-computed cross-brand matches. This page documents how those matches are calculated, what Delta E scores mean, and where the methodology has limits.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 py-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <p className="text-base text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Short version:</strong> every color in our database has a hex code, RGB triplet, and (when available) an LRV value. To find cross-brand matches we compute the CIEDE2000 Delta E score between two colors — a perceptual color-difference standard published by the{" "}
              <a
                href="https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-4"
              >
                International Commission on Illumination in 2001 (CIE Publication 142)
              </a>{" "}
              and widely used in paint, fabric, and ink manufacturing for quality control. Pairs with Delta E under 2.0 are virtually identical on a finished wall. Pairs under 5.0 are visibly similar but distinguishable. Pairs above 5.0 are visibly different.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">The matching pipeline</h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              Computing CIEDE2000 across the full database in real time would be prohibitively expensive (~250 million comparisons for a single color), so the pipeline runs offline and stores results in a cross-brand matches table.
            </p>
            <ol className="space-y-6 text-on-surface-variant leading-relaxed">
              <li><strong className="text-on-surface">1. RGB pre-filter.</strong> For each source color, candidates are narrowed to colors whose RGB channels fall within ±30 of the source. This Euclidean filter is cheap and runs on indexed columns; it eliminates 99%+ of the database before any Delta E math is performed.</li>
              <li><strong className="text-on-surface">2. LAB conversion.</strong> The pre-filtered candidates are converted from sRGB to CIE LAB color space — the perceptual color space CIEDE2000 operates on. LAB is designed so that equal distances correspond (approximately) to equal perceived differences, unlike RGB where two visually distinct colors can be numerically close.</li>
              <li><strong className="text-on-surface">3. CIEDE2000 calculation.</strong> The{" "}
                <a
                  href="https://onlinelibrary.wiley.com/doi/10.1002/col.1049"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline underline-offset-4"
                >
                  2001 CIE formula (Luo, Cui, Rigg)
                </a>{" "}
                computes Delta E using LAB lightness, chroma, and hue with chroma-dependent weighting. We use the standard implementation with kL=kC=kH=1, which is the default for surface coatings (paint, fabric, ink) per ISO 11664-6:2008.</li>
              <li><strong className="text-on-surface">4. Ranking and storage.</strong> For each source color we keep the top 50 matches per target brand, ordered by Delta E ascending. These pre-computed matches are what the color detail and match listing pages read at runtime, so the cross-brand pages serve from the cache rather than re-computing.</li>
            </ol>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">What Delta E thresholds mean on a wall</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              The plain-language verdict labels you see on color and match pages come from this table. The thresholds are calibrated against published CIE guidance for surface-coating color tolerance.
            </p>
            <div className="overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant/10">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-widest text-outline">
                  <tr>
                    <th className="text-left px-6 py-4 w-32">Delta E</th>
                    <th className="text-left px-6 py-4">Verdict</th>
                    <th className="text-left px-6 py-4">What you see on the wall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface-variant">
                  <tr><td className="px-6 py-4 font-mono text-on-surface">&lt; 1.0</td><td className="px-6 py-4 font-headline font-bold text-on-surface">Virtually identical</td><td className="px-6 py-4">Imperceptible to the human eye even side-by-side under controlled light.</td></tr>
                  <tr><td className="px-6 py-4 font-mono text-on-surface">1.0–2.0</td><td className="px-6 py-4 font-headline font-bold text-on-surface">Near-identical</td><td className="px-6 py-4">Indistinguishable on a finished wall. A trained color professional may detect a difference under direct comparison.</td></tr>
                  <tr><td className="px-6 py-4 font-mono text-on-surface">2.0–5.0</td><td className="px-6 py-4 font-headline font-bold text-on-surface">Close match / Same family</td><td className="px-6 py-4">Visible but small difference. Most viewers wouldn&apos;t notice unless the colors were placed next to each other.</td></tr>
                  <tr><td className="px-6 py-4 font-mono text-on-surface">&gt; 5.0</td><td className="px-6 py-4 font-headline font-bold text-on-surface">Visible difference</td><td className="px-6 py-4">Distinguishable side-by-side even without training. Useful as an &ldquo;in the same neighborhood&rdquo; reference but not as a swap.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Data sources</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              The 27,000+ colors in our database come from each manufacturer&apos;s published color chip data: name, color number, hex code, and (where the brand publishes it) LRV. We do not measure paint chips ourselves — the source-of-truth is whatever the brand has chosen to publish. Color names and product codes are trademarks of their respective brands.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Undertone and color-family classifications are derived from each color&apos;s LAB position relative to family centroids. The classifier sometimes diverges from a human eye on borderline colors — a famously-warm gray with LAB a* and b* close to neutral may classify as neutral rather than gray. We acknowledge this and use the brand&apos;s own family label (when set) before falling back to the classifier output.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              The matches table is recomputed whenever the underlying color set changes — new brand imports, color additions, or LAB recalibrations. Match records carry no expiration date because color chip data is essentially immutable; if a brand discontinues a color we mark the row but keep the match results for historical lookup.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Known limitations</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              CIEDE2000 measures perceived color difference under standardized viewing conditions. Real walls don&apos;t live in standardized viewing conditions, so a Delta E match always carries caveats:
            </p>
            <ul className="space-y-3 text-on-surface-variant leading-relaxed list-disc pl-6">
              <li><strong className="text-on-surface">Sheen and finish.</strong> A flat and a satin in the same hex code will not look identical on a wall. Sheen affects light reflection and apparent value — we recommend matching sheen across rooms before comparing colors.</li>
              <li><strong className="text-on-surface">Base coat.</strong> Paint over a tinted base reads differently than paint over a pure white primer, especially for thin or transparent pigments. Most differences disappear by the second coat, but the first coat can be misleading.</li>
              <li><strong className="text-on-surface">Lighting.</strong> A color sampled under 2700K warm bulbs looks meaningfully different from the same color under 4000K daylight bulbs. Two colors with Delta E 0.5 under one light source can read as Delta E 3 under another. Always sample in your room&apos;s actual lighting, at multiple times of day.</li>
              <li><strong className="text-on-surface">Manufacturer batch variation.</strong> Published hex codes are nominal — actual mixed paint has tolerances. The CIE recommends Delta E &lt; 1 as the acceptance threshold for production batches in coatings manufacturing, which is why we treat &lt; 1 as &ldquo;virtually identical.&rdquo;</li>
              <li><strong className="text-on-surface">Mineral pigments and complex formulations.</strong> Brands like Farrow &amp; Ball use mineral pigments and proprietary base structures that produce a finish character (chalky depth, color shift through the day) that can&apos;t be captured by a single hex code. A perfect Delta E match between an F&amp;B color and a standard latex color can still look different on a wall.</li>
            </ul>
            <p className="text-on-surface-variant leading-relaxed mt-6">
              The recommendation across all of these limitations is the same: always sample physically before committing to a full room, at minimum 4×4 inches, on the actual wall, viewed at multiple times of day.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Independence</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Paint Color HQ is independent of every paint brand listed on the site. No brand pays for placement, ranking, or favorable mention. Color matches are derived from published data and calculated mathematically — they don&apos;t reflect editorial or commercial judgment.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              The site is run by{" "}
              <Link href="/authors/paint-color-hq-staff" className="text-primary hover:underline underline-offset-4">Philip Cameron</Link>, a homeowner-builder who hit the cross-brand matching problem during a personal renovation. Read more about the origin in the{" "}
              <Link href="/about" className="text-primary hover:underline underline-offset-4">about page</Link>.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Related reading</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Link href="/blog/understanding-paint-color-undertones" className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all">
                <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Color theory</p>
                <p className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">Understanding paint color undertones</p>
                <p className="mt-2 text-sm text-on-surface-variant">Why a perfect Delta E match can still look wrong on the wall — and how to read undertones before you commit.</p>
              </Link>
              <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all">
                <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Guide</p>
                <p className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">How to find the perfect color match across brands</p>
                <p className="mt-2 text-sm text-on-surface-variant">A walkthrough of the matching tool, what the verdict labels mean, and how to sanity-check a match before buying.</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

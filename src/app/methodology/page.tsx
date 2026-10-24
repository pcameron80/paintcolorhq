import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { FOUNDER_PERSON, ORG_REF } from "@/lib/entity-schema";
import { ogDefaults } from "@/lib/og";
import { BRAND_COUNT } from "@/lib/site-facts";

export const metadata: Metadata = {
  title: "Methodology: How Paint Color HQ Matches Colors Across Brands",
  description:
    `How Paint Color HQ matches 26,000+ paint colors across ${BRAND_COUNT} brands with CIEDE2000: the pipeline, data sources, closeness thresholds and known limitations.`,
  alternates: { canonical: "https://www.paintcolorhq.com/methodology" },
  openGraph: {
    ...ogDefaults,
    title: "How We Match Paint Colors Across Brands",
    description:
      "The CIEDE2000-based pipeline behind 26,000+ cross-brand paint color matches.",
    type: "article",
    url: "https://www.paintcolorhq.com/methodology",
  },
};

const METHODOLOGY_PUBLISHED = "2026-05-20";
// Bump when the pipeline or data-source description changes.
const METHODOLOGY_UPDATED = "2026-10-24";
const METHODOLOGY_UPDATED_LABEL = new Date(`${METHODOLOGY_UPDATED}T12:00:00Z`).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const techArticleJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "How Paint Color HQ Matches Colors Across Brands",
  description:
    "Methodology behind 26,000+ cross-brand paint color matches: CIEDE2000 color science, the matching pipeline, data sources, Delta E thresholds, and known limitations.",
  url: "https://www.paintcolorhq.com/methodology",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://www.paintcolorhq.com/methodology" },
  image: { "@type": "ImageObject", url: "https://www.paintcolorhq.com/og-image.webp", width: 1200, height: 630 },
  datePublished: METHODOLOGY_PUBLISHED,
  dateModified: METHODOLOGY_UPDATED,
  author: FOUNDER_PERSON,
  publisher: {
    ...ORG_REF,
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
              Paint Color HQ has 26,000+ paint colors from 13 brands and over a million pre-computed cross-brand matches. This page documents how those matches are calculated, what the closeness labels mean, and where the methodology has limits.
            </p>
            <p className="mt-4 text-sm text-on-surface-variant">
              Last updated <time dateTime={METHODOLOGY_UPDATED}>{METHODOLOGY_UPDATED_LABEL}</time>
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 py-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <p className="text-base text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Short version:</strong> every color in our database has a hex code, RGB triplet, and (when available) an LRV value. To find cross-brand matches we compute the CIEDE2000 Delta E score between two colors, a perceptual color-difference standard published by the{" "}
              <a
                href="https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-4"
              >
                International Commission on Illumination in 2001 (CIE Publication 142)
              </a>{" "}
              and widely used in paint, fabric, and ink manufacturing for quality control. Lower scores indicate closer digital colors. They do not guarantee that two paints will match on a finished wall or work for touch-ups. Compare physical samples in the intended finish and lighting.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">The matching pipeline</h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              Comparing one color with the catalog requires at most one comparison per candidate color. Comparing every color with every other color is much larger, so we pre-compute cross-brand candidates for the color and match pages.
            </p>
            <ol className="space-y-6 text-on-surface-variant leading-relaxed">
              <li><strong className="text-on-surface">1. Exhaustive scoring.</strong> For each source color we score every current color of each other brand with CIEDE2000, without narrowing the candidates first, and keep that brand&apos;s five closest. Archived colors can be sources but are never recommended. The stored shortlist is a digital comparison, not a physical paint test.</li>
              <li><strong className="text-on-surface">2. LAB conversion.</strong> Each color&apos;s stored sRGB hex is converted once to CIE LAB, the perceptual color space CIEDE2000 operates on, and the LAB values are stored with the color. LAB is designed so that equal distances correspond (approximately) to equal perceived differences, unlike RGB, where two visually distinct colors can be numerically close.</li>
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
              <li><strong className="text-on-surface">4. Ranking and storage.</strong> For each source color we store the five closest colors from each other brand (60 per color), ordered by Delta E ascending. These pre-computed matches are what the color detail and match listing pages read at runtime, so the cross-brand pages serve from the cache rather than re-computing.</li>
            </ol>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">How we label digital similarity</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              The plain-language verdict labels you see on color and match pages come from this table. These are shortlist labels for digital values, not certified paint tolerances.
            </p>
            <div className="overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant/10">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-widest text-outline">
                  <tr>
                    <th className="text-left px-6 py-4 w-32">Delta E</th>
                    <th className="text-left px-6 py-4">Verdict</th>
                    <th className="text-left px-6 py-4">How to use the digital result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface-variant">
                  <tr><td className="px-6 py-4 font-mono text-on-surface">&lt; 2</td><td className="px-6 py-4 font-headline font-bold text-on-surface">Nearly identical</td><td className="px-6 py-4">The difference is hard to spot, even side by side. Still a digital result, so confirm with a physical sample.</td></tr>
                  <tr><td className="px-6 py-4 font-mono text-on-surface">2 to &lt; 5</td><td className="px-6 py-4 font-headline font-bold text-on-surface">Very similar</td><td className="px-6 py-4">Close, but you may notice a difference side by side. Compare hue and lightness before sampling.</td></tr>
                  <tr><td className="px-6 py-4 font-mono text-on-surface">&ge; 5</td><td className="px-6 py-4 font-headline font-bold text-on-surface">Visible difference</td><td className="px-6 py-4">The colors are clearly different. Treat it as an alternative to evaluate, not a substitute.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Data sources</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Names, numbers and hex values were first imported from a public color dataset and checked against each manufacturer&apos;s live palette on 2026-10-11, when 4,647 hex values were corrected. Benjamin Moore and Behr LRVs are the manufacturers&apos; published values; other brands&apos; LRVs are calculated from the hex. We do not measure paint chips ourselves, so check the manufacturer reference for current specifications. Color names and product codes are trademarks of their respective brands.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Undertones are computed from each color&apos;s CIELAB values with a rule-based classifier; treat the label as a guide and confirm with a physical sample. Color families start from the imported family and are checked with rules on CIELAB lightness, chroma and hue, so a very light, low-chroma color is filed as white or off-white rather than yellow. Both can disagree with a human eye on borderline colors: a gray with a slight warm cast can still be labeled neutral.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              The matches table is recomputed whenever the underlying color set changes: new brand imports, color additions, or hex corrections. When a brand discontinues a color we mark it archived. Its page still lists the closest current equivalents, but it is never recommended as a match for another color.
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
              <li><strong className="text-on-surface">Sheen and finish.</strong> A flat and a satin in the same hex code will not look identical on a wall. Sheen affects light reflection and apparent value, so we recommend matching sheen across rooms before comparing colors.</li>
              <li><strong className="text-on-surface">Base coat.</strong> Paint over a tinted base reads differently than paint over a pure white primer, especially for thin or transparent pigments. Most differences disappear by the second coat, but the first coat can be misleading.</li>
              <li><strong className="text-on-surface">Lighting.</strong> A color sampled under 2700K warm bulbs looks meaningfully different from the same color under 4000K daylight bulbs. Two colors that look nearly identical under one light source can show a visible difference under another. Always sample in your room&apos;s actual lighting, at multiple times of day.</li>
              <li><strong className="text-on-surface">Manufacturer batch variation.</strong> Published hex codes are nominal; actual mixed paint has tolerances. Even a nearly identical digital result is a shortlist entry, not a guarantee, because the same tolerances apply when a brand mixes its own batches.</li>
              <li><strong className="text-on-surface">Mineral pigments and complex formulations.</strong> Brands like Farrow &amp; Ball use mineral pigments and proprietary base structures that produce a finish character (chalky depth, color shift through the day) that can&apos;t be captured by a single hex code. A nearly identical digital match between an F&amp;B color and a standard latex color can still look different on a wall.</li>
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
              Paint Color HQ is independent of every paint brand listed on the site. No brand pays for placement, ranking, or favorable mention. Color matches are derived from the color data described above and calculated mathematically. They don&apos;t reflect editorial or commercial judgment.
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
                <p className="mt-2 text-sm text-on-surface-variant">Why a nearly identical match can still look wrong on the wall, and how to read undertones before you commit.</p>
              </Link>
              <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all">
                <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Guide</p>
                <p className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">How to find the equivalent of a paint color in another brand</p>
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

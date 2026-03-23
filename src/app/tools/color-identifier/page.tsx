import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorIdentifier } from "./identifier";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";

export const metadata: Metadata = {
  title: "Photo Color Identifier - Find Paint Colors from Photos",
  description:
    "Upload a photo and click any spot to find matching paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more. Free, instant, cross-brand results.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/color-identifier",
  },
};

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function ColorIdentifierPage() {
  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "HowTo",
        name: "Find Paint Colors from a Photo",
        description: "Upload a photo, click any spot, and instantly find matching paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more.",
        step: [
          { "@type": "HowToStep", name: "Upload a photo", text: "Upload a photo from your device or snap one with your camera. Any image format works." },
          { "@type": "HowToStep", name: "Click a spot", text: "Click a spot on the image to sample the color. The tool reads the exact pixel color at that point." },
          { "@type": "HowToStep", name: "Get matches", text: "Instantly see the closest matching paint colors from 25,000+ colors across 14 major brands, matched using the Delta E 2000 formula." },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Photo Color Identifier — Find Paint Colors from Any Photo",
        description: "Upload any photo and click a pixel to match it against 25,000+ paint colors from 14 brands (Sherwin-Williams, Benjamin Moore, Behr, Valspar, PPG, Dunn-Edwards, Farrow & Ball) using the CIEDE2000 Delta E 2000 color difference formula.",
        url: "https://www.paintcolorhq.com/tools/color-identifier",
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "How does photo color identification work?", acceptedAnswer: { "@type": "Answer", text: "Upload a photo, then click any spot on the image. The tool reads the exact pixel color at that point, converts it to CIELAB color space, and compares it against 25,000+ paint colors from 14 brands using the CIEDE2000 Delta E formula. Results are ranked by perceptual closeness so the top match is always the most visually accurate." } },
          { "@type": "Question", name: "What is Delta E in paint matching?", acceptedAnswer: { "@type": "Answer", text: "Delta E is a measure of perceptual color difference. A Delta E below 1 means colors are visually identical; 1-2 is barely perceptible; 2-5 is noticeable at a glance but still a close match; above 5 means clearly different shades. Paint Color HQ uses the CIEDE2000 formula, the international standard used in paint manufacturing quality control." } },
          { "@type": "Question", name: "What photo formats are supported?", acceptedAnswer: { "@type": "Answer", text: "The Photo Color Identifier supports JPEG, PNG, WebP, and any standard image format your browser can display. You can upload a photo from your device or snap one with your camera. For the most accurate results, photograph the surface in natural daylight without flash." } },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
          { "@type": "ListItem", position: 3, name: "Photo Color Identifier", item: "https://www.paintcolorhq.com/tools/color-identifier" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Photo Color Identifier
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Upload any photo and click a spot to find the closest matching paint
            color from <strong className="text-on-surface">25,000+ colors across 14 brands</strong> —
            including Sherwin-Williams, Benjamin Moore, Behr, Valspar, PPG,
            Dunn-Edwards, and Farrow &amp; Ball. Results are ranked by how close
            each match looks to the human eye, so the top suggestion is always
            the most visually accurate option you can buy.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <ColorIdentifier />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How It Works — 3 Steps
          </h2>
          <div className="space-y-8 text-on-surface-variant leading-relaxed">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <ol className="list-inside list-decimal space-y-4">
                <li>
                  <strong className="text-on-surface">Upload a photo</strong> — JPEG, PNG, WebP, or any
                  standard image format. Use your camera or select an existing
                  photo from your device.
                </li>
                <li>
                  <strong className="text-on-surface">Click any pixel</strong> — the tool reads the exact RGB
                  value at that point and converts it to CIELAB color space for
                  perceptual comparison.
                </li>
                <li>
                  <strong className="text-on-surface">Get ranked matches instantly</strong> — your sampled
                  color is compared against 25,000+ paint colors from 14 brands
                  using the CIEDE2000 Delta E formula. Results are ranked by
                  perceptual closeness: Delta E &lt; 1 = imperceptible difference;
                  Delta E 1–2 = only visible under close inspection; Delta E 2–5 =
                  noticeable at a glance.
                </li>
              </ol>
            </div>
            <p className="text-xs text-outline">
              <strong>Important:</strong> Screen colors differ from physical
              paint due to display calibration and ambient lighting. Always
              order a peel-and-stick swatch or brush-out sample before buying
              full gallons.
            </p>
          </div>
        </div>
      </section>

      {/* CIEDE2000 Explained */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            The Color Matching Algorithm — CIEDE2000 Explained
          </h2>
          <div className="space-y-6 text-on-surface-variant leading-relaxed">
            <p>
              <strong className="text-on-surface">Paint Color HQ uses the CIEDE2000 (Delta E 2000) color
              difference formula</strong> — the same standard adopted by the
              International Commission on Illumination (CIE) and used in paint
              manufacturing quality control by Sherwin-Williams, Benjamin Moore,
              and Behr. Unlike simple RGB or hex comparison, CIEDE2000 converts
              colors to CIELAB color space and measures perceptual difference
              the way the human eye actually sees it.
            </p>
            <p>
              <strong className="text-on-surface">Why this matters:</strong> Two colors can have very
              different RGB values but look nearly identical to the eye, and
              vice versa. The CIEDE2000 formula accounts for non-linear
              perception across hue, chroma, and lightness — producing Delta E
              scores that directly correspond to visible difference:
            </p>
            <div className="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-6">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface">
                    <th className="py-3 pr-4 font-semibold">Delta E Score</th>
                    <th className="py-3 pr-4 font-semibold">What It Means</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface-variant">
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-3 pr-4 font-semibold text-on-surface">&lt; 1.0</td>
                    <td className="py-3 pr-4">Imperceptible — colors are visually identical</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-3 pr-4 font-semibold text-on-surface">1.0 – 2.0</td>
                    <td className="py-3 pr-4">Barely perceptible — only visible under close inspection</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-3 pr-4 font-semibold text-on-surface">2.0 – 5.0</td>
                    <td className="py-3 pr-4">Noticeable at a glance — still a close match</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-3 pr-4 font-semibold text-on-surface">5.0 – 10.0</td>
                    <td className="py-3 pr-4">Clearly different — same color family but distinct shade</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-on-surface">&gt; 10.0</td>
                    <td className="py-3 pr-4">Different colors entirely</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Each match links to a full color detail page with hex code, RGB
              values, LRV (Light Reflectance Value), undertone classification,
              coordinating colors, and cross-brand alternatives with their own
              Delta E scores.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Tips */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How to Take Photos for Accurate Color Matching
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <ol className="list-inside list-decimal space-y-3 pl-2">
              <li>
                <strong className="text-on-surface">Use natural daylight (5000–6500K).</strong> Incandescent
                bulbs (2700K) add yellow; fluorescent lights (4000K) add green.
                Photograph the surface during daytime near a north-facing window
                for the most color-neutral illumination. Never use flash.
              </li>
              <li>
                <strong className="text-on-surface">Eliminate shadows and glare.</strong> Shadows shift the
                sampled pixel 2–3 shades darker. Glossy reflections create
                white hotspots that read as near-white regardless of the actual
                color. Angle your camera 5–10 degrees to avoid specular
                reflection.
              </li>
              <li>
                <strong className="text-on-surface">Photograph the actual surface, not a screen.</strong>{" "}
                Screens add their own color profile (sRGB, P3, or Adobe RGB)
                and backlight temperature, which distorts the captured color by
                Delta E 5–15 or more.
              </li>
              <li>
                <strong className="text-on-surface">Click the center of a uniform area.</strong> Avoid edges,
                corners, or transitions between colors. Sample at least 50
                pixels away from any color boundary for the most reliable match.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* What to Do After */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            What to Do After You Find Your Color
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              After identifying a color, use these free Paint Color HQ tools to
              confirm your choice before buying:
            </p>
            <ol className="list-inside list-decimal space-y-3 pl-2">
              <li>
                <strong className="text-on-surface">Preview it on walls</strong> — open the{" "}
                <Link href="/tools/room-visualizer" className="text-primary underline hover:text-primary/80">
                  Room Visualizer
                </Link>{" "}
                to see your matched Sherwin-Williams, Benjamin Moore, or Behr
                color on walls, trim, and accents in a realistic room scene.
              </li>
              <li>
                <strong className="text-on-surface">Compare cross-brand matches</strong> — the{" "}
                <Link href="/compare" className="text-primary underline hover:text-primary/80">
                  Color Comparison tool
                </Link>{" "}
                displays colors side by side with hex codes, LRV values, and
                Delta E difference scores so you can see exactly how close (or
                far apart) two colors really are.
              </li>
              <li>
                <strong className="text-on-surface">Calculate how much paint to buy</strong> — enter your
                room dimensions in the{" "}
                <Link href="/tools/paint-calculator" className="text-primary underline hover:text-primary/80">
                  Paint Calculator
                </Link>{" "}
                to get an exact gallon count based on the industry-standard 350
                sq ft/gallon coverage rate.
              </li>
              <li>
                <strong className="text-on-surface">Understand undertones</strong> — a gray with a Delta E
                of 2 from another gray can still have completely different
                undertones (warm pink vs. cool blue). Our guide on{" "}
                <Link href="/blog/understanding-paint-color-undertones" className="text-primary underline hover:text-primary/80">
                  understanding paint color undertones
                </Link>{" "}
                explains how undertones shift under north-facing vs.
                south-facing light and how to test with physical swatches.
              </li>
              <li>
                <strong className="text-on-surface">Build a full palette</strong> — use the{" "}
                <Link href="/tools/palette-generator" className="text-primary underline hover:text-primary/80">
                  Palette Generator
                </Link>{" "}
                to create coordinating schemes from your identified color
                across all 14 supported brands.
              </li>
            </ol>
          </div>

          <div className="mt-12">
            <ToolCrossSell exclude="color-identifier" />
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorIdentifier } from "./identifier";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { SamplizeOffer } from "@/components/samplize-offer";

export const metadata: Metadata = {
  title: "Photo Color Identifier: Match to 13 Brands",
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
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Photo Color Identifier — Find Paint Colors from Any Photo",
        description: "Upload any photo and click a pixel to match it against 26,000+ paint colors from 13 brands (Sherwin-Williams, Benjamin Moore, Behr, Valspar, PPG, Dunn-Edwards, Farrow & Ball) using the CIEDE2000 Delta E 2000 color difference formula.",
        url: "https://www.paintcolorhq.com/tools/color-identifier",
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "How does photo color identification work?", acceptedAnswer: { "@type": "Answer", text: "Upload a photo, then click any spot on the image. The tool reads the exact pixel color at that point, converts it to CIELAB color space, and compares it against 26,000+ paint colors from 13 brands using the CIEDE2000 Delta E formula. Results are ranked by perceptual closeness so the top match is always the most visually accurate." } },
          { "@type": "Question", name: "What is Delta E in paint matching?", acceptedAnswer: { "@type": "Answer", text: "Delta E is a measure of perceptual color difference. A Delta E below 1 means colors are visually identical; 1-2 is barely perceptible; 2-5 is noticeable at a glance but still a close match; above 5 means clearly different shades. Paint Color HQ uses the CIEDE2000 formula, the international standard used in paint manufacturing quality control." } },
          { "@type": "Question", name: "What photo formats are supported?", acceptedAnswer: { "@type": "Answer", text: "The Photo Color Identifier supports JPEG, PNG, WebP, and any standard image format your browser can display. You can upload a photo from your device or snap one with your camera. For the most accurate results, photograph the surface in natural daylight without flash." } },
          { "@type": "Question", name: "How accurate is paint matching from a photo?", acceptedAnswer: { "@type": "Answer", text: "The color math is exact — the same CIEDE2000 standard paint manufacturers use for quality control. The variable is your photo: lighting, camera white balance, and shadows shift the pixel colors the tool reads. Shoot in indirect daylight without flash, sample several spots, and treat the top matches as a shortlist to confirm with a physical sample — not a final answer." } },
          { "@type": "Question", name: "Why does the matched paint look different on my wall?", acceptedAnswer: { "@type": "Answer", text: "The pixel you clicked reflects the lighting in the photo, not the paint under your lighting. Bulb temperature, north- vs south-facing windows, sheen, and the colors around a wall all change how the same paint reads. That's why the last step is always a physical sample on your actual wall, checked in morning and evening light." } },
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
            Photo Color Identifier <span className="text-primary">— Match Across 13 Brands</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Upload any photo and click a spot to find the closest matching paint
            color from <strong className="text-on-surface">26,000+ colors across 13 brands</strong> —
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
          <SamplizeOffer
            sid="color-identifier"
            intro="Found your match?"
            className="mt-10 max-w-2xl"
          />
        </div>
      </section>

      {/* How it works — the guide behind the tool */}
      <section className="py-16 px-6 md:px-12 bg-surface-container-low/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
            How Photo Paint Matching Works — and How to Get an Accurate Match
          </h2>
          <div className="space-y-10 text-on-surface-variant leading-relaxed">
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                What happens when you click a pixel
              </h3>
              <p>
                When you click a spot on your photo, the tool reads the exact color of that
                pixel — its red, green, and blue values. That number alone isn&apos;t enough to
                find a paint match, because RGB describes what a screen displays, not what a
                human eye perceives. So the tool converts the pixel to{" "}
                <strong className="text-on-surface">CIELAB color space</strong>, a model built
                to mirror how people see color differences, and then compares it
                against all 26,000+ paint colors in our database using the{" "}
                <strong className="text-on-surface">CIEDE2000 (Delta E) formula</strong> — the
                same standard paint manufacturers use on the factory line to decide whether a
                batch matches the master formula.
              </p>
              <p className="mt-3">
                Every result you see is ranked by that perceptual distance. &ldquo;Near-identical&rdquo;
                means the difference would be hard to spot even with the two colors side by
                side; &ldquo;very similar&rdquo; means a close match that most people wouldn&apos;t question
                on a wall; &ldquo;visible difference&rdquo; means you&apos;d notice. The full pipeline —
                conversion math, thresholds, and its limits — is documented on our{" "}
                <Link href="/methodology" className="text-primary underline hover:text-primary/80">
                  methodology page
                </Link>.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Why photos lie about color — and how to outsmart yours
              </h3>
              <p>
                The math is exact. The photo usually isn&apos;t. Your camera makes judgment calls
                before you ever see the image: auto white balance shifts the whole photo warmer
                or cooler, indoor bulbs tint everything yellow or blue, shadows read darker and
                cooler than the surface itself, and glossy paint bounces highlights that
                sample as a lighter color than the wall. Two photos of the same wall, taken an
                hour apart, can produce noticeably different pixels.
              </p>
              <p className="mt-3">A few habits fix most of it:</p>
              <ul className="mt-3 list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong className="text-on-surface">Shoot in indirect daylight</strong> —
                  midday light from a window, not direct sun and not evening bulbs. Skip the
                  flash; it flattens color and adds a blue cast.
                </li>
                <li>
                  <strong className="text-on-surface">Face the surface square-on</strong> and
                  avoid shiny hot spots — sample a spot with even, diffuse light.
                </li>
                <li>
                  <strong className="text-on-surface">Stay out of shadow edges.</strong> A
                  pixel half in shadow reads as a darker, cooler color than the paint.
                </li>
                <li>
                  <strong className="text-on-surface">Click several spots</strong> — use
                  &ldquo;Pick another spot&rdquo; and sample three or four places on the same surface. If
                  the same paint colors keep coming up top, trust the shortlist. If every spot
                  returns something different, the lighting is uneven; reshoot.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Reading your results
              </h3>
              <p>
                Treat the results as a ranked shortlist, not a verdict. Closeness measures the
                overall color distance — it can&apos;t tell you about{" "}
                <strong className="text-on-surface">undertones</strong>, which is how two grays
                that measure near-identical can still pull in different directions on your wall:
                one leans pink next to oak floors, the other leans green next to cool light.
                Open a match&apos;s color page to check its undertone tag and LRV (how much light it
                reflects), and see its closest equivalents in other brands. Our guide to{" "}
                <Link href="/blog/understanding-paint-color-undertones" className="text-primary underline hover:text-primary/80">
                  understanding paint undertones
                </Link>{" "}
                covers how to test for this in your own lighting.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                From screen to wall: always sample before you buy
              </h3>
              <p>
                No screen — phone, laptop, or the paint brand&apos;s own website — shows you what a
                gallon of paint will look like in your room. Paint changes with bulb temperature,
                window direction, sheen, and the colors around it; a match that&apos;s perfect in the
                photo can read differently at 7&nbsp;a.m. than at 7&nbsp;p.m. on the same wall.
              </p>
              <p className="mt-3">
                The reliable last step is physical: get samples of your top two or three matches
                on the actual wall and look at them across a full day. Peel-and-stick samples
                (made with real paint) skip the mess of sample pots, or a quart and a brush works
                the same way. Then use the{" "}
                <Link href="/compare" className="text-primary underline hover:text-primary/80">
                  compare tool
                </Link>{" "}
                to double-check how close your finalists are to each other before you
                commit to gallons.
              </p>
            </div>
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

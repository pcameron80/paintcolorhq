import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaletteGenerator } from "./generator";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { SamplizeOffer } from "@/components/samplize-offer";
import { getAllBrands } from "@/lib/queries";
import { CATALOG_BRANDS, BRAND_COUNT } from "@/lib/catalog-stats";

export const revalidate = 86400;

// The filter lists the brands in this order first, then the rest by size.
const BRAND_ORDER = [
  "sherwin-williams",
  "benjamin-moore",
  "behr",
  "ppg",
  "valspar",
  "dunn-edwards",
  "farrow-ball",
];

/**
 * Brands for the filter, straight from the catalog so the list can never
 * offer a brand with no colors (which turned every swatch into "No match").
 * Falls back to the build-time catalog snapshot if Supabase is unreachable.
 */
async function filterBrands(): Promise<Array<{ name: string; slug: string }>> {
  let brands: Array<{ name: string; slug: string }>;
  try {
    brands = (await getAllBrands()).map((b) => ({ name: b.name, slug: b.slug }));
  } catch {
    brands = [];
  }
  if (brands.length === 0) brands = CATALOG_BRANDS.map((b) => ({ name: b.name, slug: b.slug }));
  const rank = (slug: string) => {
    const i = BRAND_ORDER.indexOf(slug);
    return i === -1 ? BRAND_ORDER.length : i;
  };
  // Array.prototype.sort is stable, so brands outside BRAND_ORDER keep the
  // color_count order getAllBrands returns.
  return [...brands].sort((a, b) => rank(a.slug) - rank(b.slug));
}

export const metadata: Metadata = {
  title: "Paint Color Palette Generator - Build a Coordinated Color Scheme",
  description:
    `Generate coordinated paint palettes from any starting color. Walls, Trim, Accent, and Pop roles matched to Sherwin-Williams, Benjamin Moore, Behr, and ${BRAND_COUNT - 3} more.`,
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/palette-generator",
  },
};

// The five templates in generator.tsx, described from what the code does.
const TEMPLATE_NOTES = [
  { name: "Warm & Inviting", text: "pulls your hue 40 percent of the way toward orange, then shifts the Accent slightly toward yellow and the Pop slightly toward red." },
  { name: "Cool & Calm", text: "pulls your hue 40 percent of the way toward blue, with a deeper cool Accent and a Pop from the opposite side of the wheel." },
  { name: "Bold Contrast", text: "keeps Walls and Trim on your own hue and builds the Pop from its complement, the color directly opposite on the wheel, with a deeper Accent 30 degrees short of it." },
  { name: "Analogous Harmony", text: "uses close neighbors: Walls and Trim 30 degrees one way around the wheel, the Accent 30 degrees the other way, and the Pop 60 degrees out." },
  { name: "Earthy Naturals", text: "pulls your hue 60 percent of the way toward tan and terracotta at fixed, muted saturation, with a cool, muted Accent from across the wheel for contrast." },
];

const HOW_TEMPLATES =
  "The generator makes five palettes from your starting color: Warm & Inviting (hue pulled toward orange), Cool & Calm (hue pulled toward blue), Bold Contrast (Accent and Pop from the complementary color), Analogous Harmony (neighboring hues 30 to 60 degrees away) and Earthy Naturals (muted tan and terracotta with a cool, muted Accent). Each palette has Walls, Trim, Accent and Pop colors.";

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function PaletteGeneratorPage() {
  const brands = await filterBrands();
  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Paint Palette Generator",
        description: "Build coordinated paint palettes from any starting color. Generates five schemes (Warm & Inviting, Cool & Calm, Bold Contrast, Analogous Harmony and Earthy Naturals), each with Walls, Trim, Accent and Pop colors matched to real paint.",
        url: "https://www.paintcolorhq.com/tools/palette-generator",
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What palette types does the palette generator make?", acceptedAnswer: { "@type": "Answer", text: HOW_TEMPLATES } },
          { "@type": "Question", name: "Are the palette colors matched to real paint?", acceptedAnswer: { "@type": "Answer", text: `Yes. Every swatch is matched to the closest real paint color from our database of more than 26,000 colors across ${brands.length} brands, including Sherwin-Williams, Benjamin Moore, Behr, Valspar and PPG. You can also hold the results to a single brand with the brand filter.` } },
          { "@type": "Question", name: "What are the palette roles?", acceptedAnswer: { "@type": "Answer", text: "Each palette assigns colors to four room roles: Walls (the main color covering the most area), Trim (baseboards, crown molding, door frames), Accent (a feature wall or large furniture piece), and Pop (used sparingly on throw pillows, art, or statement pieces for energy)." } },
          { "@type": "Question", name: "How do I use a generated palette in a real room?", acceptedAnswer: { "@type": "Answer", text: "Give each color a job using the 60-30-10 rule: the Walls color covers about 60 percent of the room as the dominant surface, the Trim and Accent colors carry roughly 30 percent on woodwork and a feature wall, and the Pop color appears in about 10 percent on pillows, art, or a single door. Send any scheme to the room visualizer to preview those proportions on a real room photo before you paint." } },
          { "@type": "Question", name: "What makes the colors in a palette go together?", acceptedAnswer: { "@type": "Answer", text: "Two things: a color-wheel relationship (warm, cool, high-contrast complementary, close analogous neighbors, or grounded earth tones) that sets the overall direction, and consistent undertones so the colors don't quietly clash. A palette reads as settled when its colors share an undertone family (warm with warm, cool with cool) or use a contrast you chose on purpose. Confirm the final combination with physical samples in your own light before buying." } },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
          { "@type": "ListItem", position: 3, name: "Palette Generator", item: "https://www.paintcolorhq.com/tools/palette-generator" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Paint Color Palette Generator
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Pick a color and generate coordinated paint palettes matched to real
            colors.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <Suspense>
            <PaletteGenerator brands={brands} />
          </Suspense>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-3xl mx-auto text-on-surface-variant leading-relaxed">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">How the palettes are built</h2>
          <p className="mb-4">The generator starts from your chosen color and builds five palettes from it. Each one shifts the hue a different way:</p>
          {TEMPLATE_NOTES.map((t) => (
            <p key={t.name} className="mb-4"><strong className="text-on-surface">{t.name}</strong>: {t.text}</p>
          ))}
          <p className="mb-4">The four roles are set by lightness and saturation, not by the palette type. Trim is mixed near-white, Walls light and muted, Accent deep and moderately saturated, and Pop mid-light and the most saturated of the four. Your own color takes the role it already fits: very light colors become Trim, light colors Walls, strong mid-tone colors Pop, and everything else Accent.</p>
          <p>Each mixed color is then matched to the closest real paint in the catalog, ranked by perceptual color difference, so every palette is something you can buy.</p>
        </div>
      </section>

      {/* Using a palette — the guide behind the tool */}
      <section className="py-16 px-6 md:px-12 bg-surface-container-low/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
            Turning a Generated Palette Into a Painted Room
          </h2>
          <div className="space-y-10 text-on-surface-variant leading-relaxed">
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                What the generator hands you — and how to read it
              </h3>
              <p>
                You start with one color. Pick it from the swatch, type a hex code, or arrive
                here from any color page with that color already loaded — the tool reads a
                starting color straight from the address bar. From that single point, the
                generator builds several coordinated schemes at once: some warmer, some cooler,
                one built on high-contrast opposite colors, one on close neighbors, one on
                grounded earth tones. Seeing the directions side by side beats guessing which
                one your room wants.
              </p>
              <p className="mt-3">
                Each scheme splits into four room roles — Walls, Trim, Accent, and Pop — and
                those roles aren&apos;t arbitrary. Each role is mixed to its own target: Trim
                comes out near-white, Walls light and muted, Accent deeper and richer, and Pop
                the most saturated of the four. Then every swatch is matched to the nearest
                real paint you can buy, drawn from more than 26,000 colors across 13 brands
                including Sherwin-Williams, Benjamin Moore, and Behr. That match is ranked by
                perceptual color distance — the same color-difference method the rest of the
                site uses — so the paint named under each swatch is the closest buyable version
                of the color the math produced, not a rough guess. Hold results to a single
                brand with the brand filter, or leave it open across all of them. Found a scheme
                worth keeping? Save it to a project so your top options stay in one place while
                you compare them.
              </p>
              <p className="mt-3">
                One honest caveat: color-wheel relationships are a dependable starting point,
                not a rule you have to obey. A generated scheme is a first draft to react to. If
                a combination looks right to you but breaks a &ldquo;rule,&rdquo; trust your eye and the
                room. The math behind the paint matching is documented on our{" "}
                <Link href="/methodology" className="text-primary underline hover:text-primary/80">
                  methodology page
                </Link>.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                The 60-30-10 rule: give every color a job
              </h3>
              <p>
                A palette works in a room when each color has a clear amount of space, not equal
                thirds. The old decorator shorthand is 60-30-10: about 60 percent of the room is
                one dominant color, 30 percent is a secondary color, and 10 percent is an accent.
                The generator&apos;s four roles map onto that split.
              </p>
              <p className="mt-3">
                Walls is your 60 — the largest surface and the color you see most, usually the
                lightest or most neutral of the set so the room doesn&apos;t feel closed in. Trim
                carries part of the secondary weight on baseboards, crown molding, and door
                casings, where a crisp near-white keeps edges clean. Accent takes the rest of
                that middle band — a feature wall, built-ins, or a run of cabinets — where a
                deeper color adds depth without taking over. Pop is the 10: the most saturated
                color, used in small doses on pillows, art, a lampshade, or a single door, where
                a stronger note earns its place because there is so little of it.
              </p>
              <p className="mt-3">
                Reversing those amounts is the quickest way to make a good palette feel wrong —
                the Pop color on all four walls overwhelms a room that the same color flatters on
                a chair. To judge the split before you paint, send any scheme to the{" "}
                <Link href="/tools/room-visualizer" className="text-primary underline hover:text-primary/80">
                  room visualizer
                </Link>{" "}
                with the Visualize button; it carries the Walls, Trim, Accent, and Pop colors
                into a real room photo so you weigh the proportions, not just the swatches.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Keeping undertones consistent across the palette
              </h3>
              <p>
                Two colors can sit at a pleasing distance on the wheel and still fight on the
                wall, because color-wheel math doesn&apos;t account for{" "}
                <strong className="text-on-surface">undertones</strong> — the quiet secondary
                cast underneath a color. A greige with a green undertone and a greige with a pink
                undertone can read as the same tan on screen, then clash the moment they share a
                room. Undertones are what separate a palette that feels settled from one that
                feels slightly off for reasons no one can name.
              </p>
              <p className="mt-3">
                When you weigh a generated scheme, open each color&apos;s page and check its undertone
                tag and its LRV — the measure of how much light it reflects, which tells you how
                a color reads on a full wall versus a small chip. Aim for undertones that agree:
                warm with warm, cool with cool, or a contrast you chose on purpose. A palette
                built from colors that all lean warm feels coherent even when the hues differ;
                pair a cool-gray wall with warm-beige trim by accident and the trim can look
                dingy. Our guide to{" "}
                <Link href="/blog/understanding-paint-color-undertones" className="text-primary underline hover:text-primary/80">
                  understanding paint color undertones
                </Link>{" "}
                covers how to spot an undertone before it surprises you, and how the same color
                shifts under north-facing versus south-facing light. The safest schemes keep the
                walls and trim in the same temperature and let the accent or pop color carry the
                contrast, so one deliberate color does the work instead of two that quietly
                disagree.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                From palette to purchase: sample before you commit
              </h3>
              <p>
                Every swatch on this page is a screen color, and no screen shows you what a
                gallon looks like on your wall. Monitor calibration, the brightness you&apos;re
                reading at, and your room&apos;s own light all shift what you see here. The generated
                palette narrows thousands of options down to a handful worth testing — that is
                its job — but the last step happens off the screen.
              </p>
              <p className="mt-3">
                Get physical samples of your top one or two schemes and live with them for a
                day. Paint a large swatch, or use a peel-and-stick sample made with real paint,
                and look at it in morning light, afternoon light, and under your bulbs at night;
                the same color can shift a good deal across those. Set the sample next to your
                floors, your largest piece of furniture, and your trim, since a color never
                appears in isolation.
              </p>
              <p className="mt-3">
                When you are down to two finalists that look close, the{" "}
                <Link href="/compare" className="text-primary underline hover:text-primary/80">
                  compare tool
                </Link>{" "}
                puts them side by side with their hex codes and LRV so you can see where they
                differ before you buy. Once you have committed, the{" "}
                <Link href="/tools/paint-calculator" className="text-primary underline hover:text-primary/80">
                  paint calculator
                </Link>{" "}
                turns your room dimensions into a gallon count so you buy the right amount in one
                trip.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <SamplizeOffer sid="palette-generator" intro="Like this palette?" />
          <div className="mt-12">
            <ToolCrossSell exclude="palette-generator" />
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RoomVisualizer } from "./visualizer";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { SamplizeOffer } from "@/components/samplize-offer";

export const metadata: Metadata = {
  title: "Room Color Visualizer - Preview Paint Colors in a Room",
  description:
    "Preview paint colors in a room before you buy. Works with Sherwin-Williams, Benjamin Moore, Behr, PPG, and 10 more brands. Choose walls, ceiling, trim, accent.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/room-visualizer",
  },
};

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RoomVisualizerPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  // Build initial colors from URL params (e.g. ?walls=D6D0C4,E5DDD0&trim=FFFFFF&accent=5B7FA5)
  const paramMap: Record<string, string> = {
    walls: "walls",
    trim: "trim",
    accent: "accentWall",
    floor: "floor",
  };
  const hexRe = /^[0-9a-fA-F]{6}$/;
  const initialColors: Record<string, string> = {};
  const colorOptions: Record<string, string[]> = {};
  for (const [param, region] of Object.entries(paramMap)) {
    const val = sp[param];
    if (typeof val !== "string") continue;
    const parts = val.split(",").filter((h) => hexRe.test(h));
    if (parts.length > 0) {
      initialColors[region] = `#${parts[0]}`;
    }
    if (parts.length > 1) {
      colorOptions[region] = parts.map((h) => `#${h}`);
    }
  }
  // Parse pop colors separately (shown on walls + accent wall)
  const popRaw = sp.pop;
  const popColors =
    typeof popRaw === "string"
      ? popRaw.split(",").filter((h) => hexRe.test(h)).map((h) => `#${h}`)
      : [];

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Room Color Visualizer",
        description: "Preview paint colors on walls, ceiling, trim, and more in a realistic room scene. Free tool from Paint Color HQ.",
        url: "https://www.paintcolorhq.com/tools/room-visualizer",
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What is a room color visualizer?", acceptedAnswer: { "@type": "Answer", text: "A room color visualizer is a free online tool that lets you preview paint colors on walls, ceiling, trim, accent wall, and floor in a realistic room scene before you buy paint. Paint Color HQ's visualizer updates instantly as you pick colors and supports all major paint brands." } },
          { "@type": "Question", name: "Can I match visualizer colors to real paint?", acceptedAnswer: { "@type": "Answer", text: "Yes. After choosing a color in the visualizer, use the \"Find Paint Match\" feature to see which real-world paints from 14 major brands — including Sherwin-Williams, Benjamin Moore, Behr, Valspar, and PPG — are the closest match. Every suggestion links to its full color detail page." } },
          { "@type": "Question", name: "Is the room visualizer free?", acceptedAnswer: { "@type": "Answer", text: "Yes. The Paint Color HQ Room Visualizer is completely free with no sign-up required. You can preview unlimited color combinations on walls, trim, accent walls, and floors." } },
          { "@type": "Question", name: "Why does paint look different on my wall than in the room visualizer?", acceptedAnswer: { "@type": "Answer", text: "The preview paints your color over one photo's fixed lighting, while your room has its own. Three things move between screen and wall: your monitor or phone's brightness and calibration, your room's light (warm 2700K bulbs push a color yellower, cool 4000K bulbs push it bluer, and north-facing windows run cooler than south-facing ones), and sheen — flat, eggshell, and semi-gloss all reflect light differently. Use the visualizer to narrow your choices, then confirm the winner with a physical sample on the actual wall, viewed in both morning and evening light." } },
          { "@type": "Question", name: "How do I pick a trim color to go with my wall color?", acceptedAnswer: { "@type": "Answer", text: "Trim usually contrasts the wall — a clean white or off-white frames a colored wall and makes molding and window casings stand out. The wider the gap in lightness (LRV) between wall and trim, the crisper the edges look; a narrow gap reads soft and understated. Keep the wall and trim in the same undertone family so they don't clash: two grays can look near-identical yet pull in opposite directions, one warm toward pink and the other cool toward green. Check the undertone tag on each color's page before you buy." } },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
          { "@type": "ListItem", position: 3, name: "Room Visualizer", item: "https://www.paintcolorhq.com/tools/room-visualizer" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Room Color Visualizer
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Preview paint colors on walls, ceiling, trim, and more. Click a region
            or select it below, then pick a color to see it applied instantly.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <RoomVisualizer
            initialColors={
              Object.keys(initialColors).length > 0 ? initialColors : undefined
            }
            colorOptions={
              Object.keys(colorOptions).length > 0 ? colorOptions : undefined
            }
            popColors={popColors.length > 0 ? popColors : undefined}
          />
        </div>
      </section>

      {/* How it works — the guide behind the tool */}
      <section className="py-16 px-6 md:px-12 bg-surface-container-low/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
            How the Room Visualizer Works — and How to Choose Wall Colors That Hold Up in Real Light
          </h2>
          <div className="space-y-10 text-on-surface-variant leading-relaxed">
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                How the preview is built: one real photo, three paintable regions
              </h3>
              <p>
                The visualizer starts from a photograph of an actual room, not a flat
                illustration or a blank template. Three areas are traced over that photo as
                paintable regions:{" "}
                <strong className="text-on-surface">Main</strong> — the largest wall, the field
                color that fills most of your view;{" "}
                <strong className="text-on-surface">Accent</strong> — a secondary wall used for
                contrast; and <strong className="text-on-surface">Trim</strong> — the crown
                molding, baseboards, and window frames. Select any region by clicking it directly
                on the room photo or using the Main, Accent, and Trim buttons, then pick a color
                with the picker or type in a six-digit hex code. The room repaints instantly, so
                you can try a shade, change your mind, and try another in seconds. The Main region
                is the color you would buy the most of, so it is worth settling first.
              </p>
              <p className="mt-3">
                The color is not pasted on flat. It is blended into the photo&apos;s own light and
                shadow, so the same paint reads darker in the corners and where furniture casts
                shade, and lighter where the window falls across the wall. A swatch card hides that
                variation; a real wall shows it, and so does the preview. Painting the color over
                the photo&apos;s lighting instead of covering it is what makes the result closer to
                a finished wall than a solid block of color would be. When a shade looks right,
                select &ldquo;Find Paint Match&rdquo; to pull the closest real paints from 13
                brands — each result links to its full color page, where you can read its undertone
                and see cross-brand equivalents.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Use LRV to match a wall color to your room&apos;s light
              </h3>
              <p>
                LRV, or Light Reflectance Value, is a 0-to-100 measure of how much light a color
                bounces back into the room. Black sits near 0, pure white near 100, and most wall
                colors fall somewhere between — a soft greige around 55 to 65, a mid-tone blue
                closer to 30. Every color page on Paint Color HQ lists the LRV, which is the
                fastest way to judge whether a shade will lift a room or weigh it down. Once the
                visualizer hands you a match, open its page and check that number before you commit.
                A mid-range LRV, roughly 45 to 60, is the most forgiving starting point if
                you are unsure — it holds its color in shade without darkening the room, which is
                why so many popular greiges and soft sages land there.
              </p>
              <p className="mt-3">
                A dark or north-facing room gets cool, indirect light for most of the day, so it
                usually wants a wall color with a higher LRV to keep it from reading gloomy; a
                brighter wall also makes a small room feel larger. A bright, south-facing room can
                carry a lower-LRV color — a deep green, a charcoal, a saturated navy — without
                feeling closed in, because there is more daylight for the color to work with. The
                Main wall drives the room&apos;s overall brightness because it covers the most
                surface, so choose it first by LRV, then build the accent and trim around it. Grays
                are where this matters most: two grays that look alike on a chip can behave
                differently on the wall once one reflects more light than the other. The{" "}
                <Link href="/colors/family/gray" className="text-primary underline hover:text-primary/80">
                  gray family page
                </Link>{" "}
                groups them by shade, and the{" "}
                <Link href="/methodology" className="text-primary underline hover:text-primary/80">
                  methodology page
                </Link>{" "}
                explains where the color data behind each page comes from.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Why the on-screen preview will not match your painted wall exactly
              </h3>
              <p>
                The preview is a starting point, not a guarantee. A screen builds color out of
                emitted light; a wall builds it out of reflected light, and several things shift
                between the two:
              </p>
              <ul className="mt-3 list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong className="text-on-surface">Your device.</strong> Your monitor or phone
                  has its own brightness and color calibration, so the same hex code looks slightly
                  different on every screen.
                </li>
                <li>
                  <strong className="text-on-surface">Your room&apos;s light.</strong> The preview
                  uses one photo&apos;s fixed lighting, while your room has its own — warm 2700K
                  bulbs push a color yellower, cool 4000K bulbs push it bluer, a north-facing
                  window runs cool and a south-facing window runs warm.
                </li>
                <li>
                  <strong className="text-on-surface">Sheen.</strong> The same color in flat,
                  eggshell, and semi-gloss reflects light differently, and a glossier finish looks
                  lighter and shinier than the preview suggests.
                </li>
              </ul>
              <p className="mt-3">
                The fix is physical. Get samples of your top one or two colors, paint a patch on
                the actual wall, and look at it in both morning and evening light before you buy
                gallons. Peel-and-stick samples made from real paint or a small sample pot both do
                the job. The visualizer&apos;s value is speed — it narrows a wall of options down
                to a short list in minutes — but a sample on your own wall is what confirms the
                winner.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Build a wall, trim, and accent scheme that works together
              </h3>
              <p>
                Main, Accent, and Trim are not just three color slots — they are the structure of a
                real scheme. Trim usually contrasts the wall: a clean white or off-white frames a
                colored wall and makes molding and window casings stand out. The wider the gap in
                lightness between wall and trim, the crisper and more defined those edges look; a
                narrow gap reads soft and understated. For an accent wall, a deeper version of the
                main color anchors the room without competing with it.
              </p>
              <p className="mt-3">
                What holds a scheme together is undertone, not raw hue. Two grays can read as
                near-identical and still pull in opposite directions once they are on the wall —
                one warm toward pink, the other cool toward green — which is how a wall and its trim
                end up clashing even when both are called &ldquo;gray.&rdquo; Keep the main wall,
                accent, and trim in the same undertone family, and check the undertone tag on each
                color page before you buy. Our guide to{" "}
                <Link href="/blog/understanding-paint-color-undertones" className="text-primary underline hover:text-primary/80">
                  understanding paint color undertones
                </Link>{" "}
                covers how to tell which way a color leans, and the{" "}
                <Link href="/compare" className="text-primary underline hover:text-primary/80">
                  compare tool
                </Link>{" "}
                puts two finalists side by side so you can see the difference before it reaches your
                walls.
              </p>
              <p className="mt-3">
                A simple proportion keeps a three-color scheme balanced: let the main wall color
                dominate, give the accent roughly a third of the visible color, and keep trim as the
                smallest, sharpest share. You do not have to follow it to the letter, but if a room
                feels busy in the preview, it is usually because the accent is doing too much. Pull
                it back toward the main color&apos;s family and the scheme settles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How to Use
          </h2>
          <div className="space-y-8 text-on-surface-variant leading-relaxed">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <ol className="list-inside list-decimal space-y-4">
                <li>
                  <strong className="text-on-surface">Select a region</strong> by clicking directly on the
                  room image or using the buttons below it.
                </li>
                <li>
                  <strong className="text-on-surface">Pick a color</strong> using the color picker or type a
                  hex code. The room updates instantly.
                </li>
                <li>
                  <strong className="text-on-surface">Find paint matches</strong> to discover which real paint
                  colors from Sherwin-Williams, Benjamin Moore, Behr, and other
                  brands are closest to your selection.
                </li>
              </ol>
            </div>
            <p className="text-xs text-outline">
              Screen colors differ from physical paint. Always verify with a
              swatch or sample before purchasing.
            </p>
          </div>
        </div>
      </section>

      {/* What the Visualizer Does */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            What the Room Visualizer Does
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              The Paint Color HQ Room Visualizer lets you preview paint colors on
              every surface in a room before you commit to a single can of paint.
              Click on any region — walls, ceiling, trim, accent wall, or floor —
              to select it, then choose a color from the picker or type in a
              specific hex code. The room updates instantly so you can experiment
              freely without any waiting.
            </p>
            <p>
              Once you find a color you love, use the &quot;Find Paint
              Match&quot; feature to see which real-world paints from 14 major
              brands — including Sherwin-Williams, Benjamin Moore, Behr, Valspar,
              PPG, Dunn-Edwards, and Farrow &amp; Ball — are the closest match.
              Every suggestion links to its full color detail page so you can
              explore undertones, coordinating colors, and cross-brand
              alternatives.
            </p>
          </div>
        </div>
      </section>

      {/* Why Preview */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Why Preview Before You Paint
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              Paint always looks different on a full wall than it does on a tiny
              swatch card at the store. Lighting conditions, room dimensions, and
              the colors surrounding a surface all change how a shade is
              perceived. A warm beige can read pink under cool fluorescent light,
              and a soft gray can shift blue next to certain wood tones.
              Previewing colors in a room context helps you catch these surprises
              before they become expensive mistakes.
            </p>
            <p>
              Testing digitally also saves real money. Instead of buying three or
              four sample pots at $5 to $8 each, you can narrow your choices down
              to a single front-runner in minutes. This is especially valuable
              when you are planning a whole-room color scheme with coordinated
              walls, trim, and an accent wall — getting that balance right on
              screen first means fewer trips back to the paint counter.
            </p>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Tips for Getting the Most Out of the Visualizer
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              <strong className="text-on-surface">Start with the wall color.</strong> Walls cover the most
              surface area, so they set the overall tone for the room. Pick your
              wall shade first, then build the rest of the palette around it.
            </p>
            <p>
              <strong className="text-on-surface">Use contrasting trim.</strong> White or off-white trim
              against colored walls is a timeless combination that makes
              architectural details pop. Try it in the visualizer to see how much
              definition trim color adds.
            </p>
            <p>
              <strong className="text-on-surface">Experiment with the accent wall.</strong> A single bold wall
              can anchor a space without overwhelming it. The accent wall region
              lets you test dramatic colors in a contained way before committing
              to an entire room.
            </p>
            <p>
              <strong className="text-on-surface">Convert custom colors to real paint.</strong> Any color you
              pick — even a custom hex — can be matched to a real product from
              major brands using the &quot;Find Paint Match&quot; button. This
              bridges the gap between inspiration and a trip to the store.
            </p>
            <p>
              <strong className="text-on-surface">Use our other tools alongside the visualizer.</strong> Once
              you have colors you like, open the{" "}
              <Link href="/compare" className="text-primary underline hover:text-primary/80">
                Color Comparison tool
              </Link>{" "}
              to see them side by side, or try the{" "}
              <Link href="/tools/palette-generator" className="text-primary underline hover:text-primary/80">
                Palette Generator
              </Link>{" "}
              to build a fully coordinated scheme. If you are unsure whether a
              color runs warm or cool, our guide on{" "}
              <Link href="/blog/understanding-paint-color-undertones" className="text-primary underline hover:text-primary/80">
                understanding paint color undertones
              </Link>{" "}
              breaks down what to look for.
            </p>
          </div>

          <div className="mt-12">
            <SamplizeOffer sid="room-visualizer" intro="Found a color you love on the wall?" />
          </div>

          <div className="mt-12">
            <ToolCrossSell exclude="room-visualizer" />
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

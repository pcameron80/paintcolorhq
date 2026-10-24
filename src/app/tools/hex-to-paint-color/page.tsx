import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { findNearestPerBrand } from "@/lib/hex-nearest";
import { parseColorInput } from "@/lib/color-input";
import { HexToPaint } from "./hex-to-paint";

const PAGE_URL = "https://www.paintcolorhq.com/tools/hex-to-paint-color";
const TITLE = "Hex to Paint Color: Match a Hex or RGB Code to 13 Paint Brands";
const DESCRIPTION =
  "Enter a hex or RGB code and get the closest current paint color from Sherwin-Williams, Benjamin Moore, Behr and 10 more brands, with closeness and LRV.";

// The server-rendered example: a warm mid-gray, the kind of screen color a
// designer hands over for a wall.
const DEFAULT_HEX = "#a8a29a";

type Props = { searchParams: Promise<{ hex?: string | string[] }> };

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  // Any query string is a per-color view: keep it out of the index, follow its
  // links, and point the canonical at the tool.
  const hasParams = Object.keys(params).length > 0;
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    ...(hasParams && { robots: { index: false, follow: true } }),
    openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL },
  };
}

const FAQ = [
  {
    q: "How do I convert a hex code to a paint color?",
    a: "Enter the hex code (for example #A8A29A) and the tool compares it with more than 26,000 paint colors from 13 brands. For each brand it returns the current color that looks closest, measured with the CIEDE2000 color difference formula, so you get one named, buyable paint per brand instead of a single guess.",
  },
  {
    q: "Can I use an RGB value instead of a hex code?",
    a: "Yes. Type the three channel values, such as 168, 162, 154 or rgb(168, 162, 154). The tool converts RGB to hex and matches it the same way. Short hex codes like #ABC also work.",
  },
  {
    q: "Why is there no exact paint match for my hex code?",
    a: "A hex code can describe about 16.7 million colors, and each paint brand sells a few hundred to several thousand. Most screen colors fall between two paint chips. The closeness label tells you how far off the nearest one is: Nearly identical means the difference is hard to spot side by side, Very similar means close but noticeable side by side, and Visible difference means the brand has nothing close.",
  },
  {
    q: "Does the paint look the same as the hex color on my screen?",
    a: "Not exactly. Screens emit light and paint reflects it, so the same color reads differently under bulbs, daylight and different sheens. A hex match is a digital match. Order a sample of the closest one or two colors and check them on your wall before buying gallons.",
  },
  {
    q: "What does the LRV column mean?",
    a: "LRV, or light reflectance value, is the share of light a paint reflects, from 0 for black to 100 for pure white. It tells you how light the color will feel in a room. Values marked Published come from the manufacturer; values marked Estimated are calculated from the color's hex value.",
  },
  {
    q: "Are retired colors included?",
    a: "No. The tool returns only colors each brand currently sells, so every result can be ordered by name. Retired colors still have their own pages on Paint Color HQ, listed on the discontinued colors page.",
  },
];

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function HexToPaintColorPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = firstParam(params.hex);
  const parsed = raw ? parseColorInput(raw) : null;
  const hex = parsed ?? DEFAULT_HEX;
  const initialError = raw && !parsed ? `"${raw.slice(0, 40)}" is not a hex or RGB code, so this shows the example color instead.` : null;
  const results = await findNearestPerBrand(hex);

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Hex to Paint Color",
        description: "Match any hex or RGB color code to the closest current paint color from 13 brands, using the CIEDE2000 color difference formula.",
        url: PAGE_URL,
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
          { "@type": "ListItem", position: 3, name: "Hex to Paint Color", item: PAGE_URL },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-4 sm:px-6 md:px-12 py-12">
        <div className="max-w-5xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.95] mt-2 mb-4">
            Hex to Paint Color
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Enter a hex or RGB code and see the closest color each brand sells today, from
            Sherwin-Williams, Benjamin Moore and Behr to Farrow &amp; Ball. Every result is a
            current color you can order by name, with how close it is and its LRV.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-12 pb-16">
        <div className="max-w-5xl mx-auto">
          <HexToPaint initialHex={hex} initialResults={results} initialError={initialError} />
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 md:px-12 bg-surface-container-low/40">
        <div className="max-w-3xl mx-auto space-y-10 text-on-surface-variant leading-relaxed">
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-4">
              How the hex match works
            </h2>
            <p>
              A hex code is three numbers, the red, green and blue a screen mixes. The tool converts
              them to CIELAB, a color space built around how people see differences, and measures the
              distance to every current color in each brand with the{" "}
              <strong className="text-on-surface">CIEDE2000</strong> formula, the standard paint makers
              use to check a batch against its master color. The nearest color in each brand goes in the
              table, so you can compare what Sherwin-Williams, Benjamin Moore and Behr each offer for
              the same screen color.
            </p>
            <p className="mt-3">
              The closeness label is the honest part. Nearly identical means the two would be hard to
              tell apart side by side. Very similar means close, but you may notice it side by side.
              Visible difference means that brand has nothing close, which is common with saturated
              screen colors that no paint line carries. The full method is on the{" "}
              <Link href="/methodology" className="text-primary underline hover:text-primary/80">methodology page</Link>.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-4">
              Where hex codes come from, and the next step
            </h2>
            <p>
              Hex codes usually arrive from a brand style guide, a website, a mood board or a
              designer&apos;s file. If you have a photo instead, the{" "}
              <Link href="/tools/color-identifier" className="text-primary underline hover:text-primary/80">photo color identifier</Link>{" "}
              samples a spot for you. If you already know the paint and want its equivalents, open its
              color page or use the{" "}
              <Link href="/match" className="text-primary underline hover:text-primary/80">cross-brand match pages</Link>.
              To check two finalists against each other, use the{" "}
              <Link href="/compare" className="text-primary underline hover:text-primary/80">compare tool</Link>,
              and to sort colors by how much light they reflect, use the{" "}
              <Link href="/tools/lrv-finder" className="text-primary underline hover:text-primary/80">LRV finder</Link>.
            </p>
            <p className="mt-3">
              Developers can get the same per-brand result as JSON from{" "}
              <code className="font-mono text-sm">/api/hex-nearest?hex=A8A29A</code>; the{" "}
              <Link href="/api" className="text-primary underline hover:text-primary/80">API page</Link>{" "}
              has the terms.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">
              Questions
            </h2>
            <div className="space-y-6">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          <ToolCrossSell exclude="hex-to-paint-color" />
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

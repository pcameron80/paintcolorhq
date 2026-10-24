import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "Free Paint Color Tools — Visualizer & Calculator",
  description:
    "Free paint tools: palette generator, room visualizer, photo color identifier, and paint calculator. Preview colors, match from photos, and estimate coverage across all major brands.",
  alternates: { canonical: "https://www.paintcolorhq.com/tools" },
};

const tools = [
  {
    title: "Paint Calculator",
    description:
      "Find out exactly how many gallons of paint you need for your room. Enter dimensions, doors, and windows for an instant estimate.",
    href: "/tools/paint-calculator",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm2.25-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H12.75v-.008Zm0 2.25h.008v.008H12.75v-.008Zm2.25-2.25h.008v.008H15v-.008Zm0 2.25h.008v.008H15v-.008ZM5.25 6.75h13.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 .75-.75ZM6 3v3.75M18 3v3.75"
        />
      </svg>
    ),
  },
  {
    title: "Photo Color Identifier",
    description:
      "Upload a photo and pick any pixel to find the closest matching paint colors from all major brands.",
    href: "/tools/color-identifier",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
        />
      </svg>
    ),
  },
  {
    title: "Room Color Visualizer",
    description:
      "Preview paint colors on walls, ceiling, accent wall, trim, and floor in a realistic room scene.",
    href: "/tools/room-visualizer",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819"
        />
      </svg>
    ),
  },
  {
    title: "Palette Generator",
    description:
      "Pick a starting color and generate coordinated paint palettes with walls, trim, accent, and pop roles.",
    href: "/tools/palette-generator",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z"
        />
      </svg>
    ),
  },
  {
    title: "Compare Paint Colors",
    description:
      "Put any two paint colors side by side with hex, RGB and LRV, plus a plain-language verdict on how close they are. Works across brands.",
    href: "/compare",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
    ),
  },
  {
    title: "Embed the Match Widget",
    description:
      "Run a site or blog? Drop our free cross-brand paint matcher into your page with one line of HTML, and your readers can match any color across 13 brands.",
    href: "/embed",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
        />
      </svg>
    ),
  },
];

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "ItemList",
        name: "Paint Tools",
        description: "Free paint tools: palette generator, room color visualizer, photo color identifier, paint calculator, and side-by-side color comparison.",
        numberOfItems: 6,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Paint Calculator", url: "https://www.paintcolorhq.com/tools/paint-calculator" },
          { "@type": "ListItem", position: 2, name: "Photo Color Identifier", url: "https://www.paintcolorhq.com/tools/color-identifier" },
          { "@type": "ListItem", position: 3, name: "Room Color Visualizer", url: "https://www.paintcolorhq.com/tools/room-visualizer" },
          { "@type": "ListItem", position: 4, name: "Paint Color Palette Generator", url: "https://www.paintcolorhq.com/tools/palette-generator" },
          { "@type": "ListItem", position: 5, name: "Compare Paint Colors", url: "https://www.paintcolorhq.com/compare" },
          { "@type": "ListItem", position: 6, name: "Embed the Match Widget", url: "https://www.paintcolorhq.com/embed" },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tools</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Paint Tools
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Free tools to help you plan your next paint project.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-8 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4">{tool.icon}</div>
              <h2 className="font-headline text-xl font-bold text-on-surface group-hover:text-primary">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-3xl mx-auto text-on-surface-variant leading-relaxed">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">When to use each tool</h2>
          <p className="mb-4"><strong>Paint Calculator</strong>: before ordering. A gallon of interior wall paint covers about 350 to 450 sq ft per coat on primed drywall, depending on the product&apos;s data sheet. Two coats is standard for a color change, and darker colors often need a tinted primer plus two topcoats. The calculator subtracts doors and windows and also handles ceilings, doors, cabinets and exteriors.</p>
          <p className="mb-4"><strong>Photo Color Identifier</strong>: when you already have a color you love but don&apos;t know its name. Works best on interior walls photographed in natural light. Results are ranked by Delta E distance, so the top match is the closest, not necessarily the one you expected.</p>
          <p className="mb-4"><strong>Room Color Visualizer</strong>: for testing combinations before buying samples. Tests walls, an accent wall, trim and window frames in 10 reference rooms. Useful for catching clashes before committing to a $60 quart you won&apos;t end up using.</p>
          <p className="mb-4"><strong>Palette Generator</strong>: when you&apos;re starting from a single color you already like. Builds five palettes (warm, cool, complementary contrast, analogous and earthy), each with Walls, Trim, Accent and Pop colors matched to real paint, not abstract hex values.</p>
          <p className="mb-4"><strong>Compare Paint Colors</strong>: when you are down to two candidates, or want to know whether a cheaper brand&apos;s color is a stand-in for the one you picked. It shows both swatches with hex, RGB and LRV and gives one verdict (nearly identical, very similar or visible difference), then links to a room preview of the pair.</p>
          <p>None of these replace physical samples. Paint chips under store lighting read differently than they will on your wall, and any screen preview is limited by your monitor&apos;s calibration. Use these to narrow options, then order actual sample pots before deciding.</p>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

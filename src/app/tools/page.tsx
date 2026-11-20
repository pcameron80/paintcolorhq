import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ogDefaults } from "@/lib/og";
import { BRAND_COUNT } from "@/lib/site-facts";
import { HOME_MATCH_SETS } from "@/lib/home-matches";
import { inspirationPalettes } from "@/lib/palettes";
import { urbanist } from "@/lib/redesign-font";
import "../redesign.css";

const TITLE = "Free Paint Color Tools: Visualizer & Calculator";
const DESCRIPTION =
  "Free paint tools: palette generator, room visualizer, photo color identifier and paint calculator. Preview colors, match photos, estimate how much to buy.";
const URL = "https://www.paintcolorhq.com/tools";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { ...ogDefaults, title: TITLE, description: DESCRIPTION, url: URL },
};

const tools = [
  {
    title: "Paint Calculator",
    art: "calc",
    description:
      "Find out exactly how many gallons of paint you need for your room. Enter dimensions, doors, and windows for an instant estimate.",
    href: "/tools/paint-calculator",
  },
  {
    title: "Photo Color Identifier",
    art: "identifier",
    description:
      `Upload a photo and click a spot, or type a hex code, to find the closest paint colors among 26,000+ colors from ${BRAND_COUNT} brands.`,
    href: "/tools/color-identifier",
  },
  {
    title: "Room Color Visualizer",
    art: "room",
    description:
      "Preview paint colors on walls, an accent wall, trim, window frames and kitchen cabinets in 10 photorealistic rooms, then see the closest real paints.",
    href: "/tools/room-visualizer",
  },
  {
    title: "Palette Generator",
    art: "palette",
    description:
      "Pick a starting color and generate coordinated paint palettes with walls, trim, accent, and pop roles.",
    href: "/tools/palette-generator",
  },
  {
    title: "Compare Paint Colors",
    art: "compare",
    description:
      "Put any two paint colors side by side with hex, RGB and LRV, plus a plain-language verdict on how close they are. Works across brands.",
    href: "/compare",
  },
  {
    title: "Embed the Match Widget",
    art: "embed",
    description:
      "Run a site or blog? Drop our free cross-brand paint matcher into your page with one line of HTML, and your readers can match any color across 13 brands.",
    href: "/embed",
  },
];

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}


function ToolArt({ kind }: { kind: string }) {
  const set = HOME_MATCH_SETS[0];
  const pair = HOME_MATCH_SETS[1];
  const farm = inspirationPalettes[0].colors;
  if (kind === "calc") {
    return (
      <div className="pch-art" role="img" aria-label="The paint calculator inputs: room size, doors and windows, coats" style={{ display: "flex", gap: 8, padding: 12, minHeight: 112 }}>
        {["Room size", "Doors and windows", "Coats"].map((l) => (
          <span key={l} style={{ flex: 1, display: "grid", alignContent: "center", padding: "0 8px", border: "1px solid rgb(22 25 53 / 0.22)", borderRadius: 8, fontSize: 14, lineHeight: 1.25, color: "var(--muted)" }}>{l}</span>
        ))}
      </div>
    );
  }
  if (kind === "identifier") {
    return (
      <div className="pch-art" role="img" aria-label={`A color picked from a photo, matched to ${set.source.name} and ${set.matches[0].name}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 112 }}>
        <div style={{ backgroundColor: set.source.hex }} />
        <div style={{ display: "grid", alignContent: "center", gap: 2, padding: 12, fontSize: 14, lineHeight: 1.3 }}>
          <b style={{ fontWeight: 500 }}>{set.source.name}</b>
          <span style={{ color: "var(--muted)" }}>{set.source.brand}</span>
          <span className="mono">{set.source.hex}</span>
        </div>
      </div>
    );
  }
  if (kind === "room") {
    return (
      <div className="pch-art" aria-hidden="true" style={{ aspectRatio: "16 / 7", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rooms/living-1/base-800.6f903c9beb.webp" alt="" width={800} height={450} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  if (kind === "palette") {
    return (
      <div className="pch-art" role="img" aria-label="Palette roles: walls, trim, accent and pop" style={{ minHeight: 112, display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {["Walls", "Trim", "Accent", "Pop"].map((role, i) => (
          <div key={role} style={{ backgroundColor: farm[i], display: "grid", alignContent: "end", padding: 8, fontSize: 13, color: i === 2 ? "#fff" : "#161935" }}>{role}</div>
        ))}
      </div>
    );
  }
  if (kind === "compare") {
    return (
      <div className="pch-art" role="img" aria-label={`${pair.source.name} beside ${pair.matches[2].name}, ${pair.matches[2].label.toLowerCase()}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 80 }}>
          <div style={{ backgroundColor: pair.source.hex }} />
          <div style={{ backgroundColor: pair.matches[2].hex }} />
        </div>
        <div style={{ padding: "8px 12px", fontSize: 14 }}><span className="pch-chip">{pair.matches[2].label}</span></div>
      </div>
    );
  }
  return (
    <div className="pch-art" role="img" aria-label="A match widget listing nearest colors in other brands" style={{ display: "grid" }}>
      {set.matches.slice(0, 2).map((m) => (
        <div className="pch-ui__row" key={m.name} style={{ borderTop: 0 }}>
          <b className="pch-dot" style={{ backgroundColor: m.hex }} />
          <span><b>{m.name}</b><small>{m.brand}</small></span>
          <span className="pch-chip">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ToolsPage() {
  const set = HOME_MATCH_SETS[0];
  return (
    <div className={`min-h-screen bg-surface ${urbanist.variable}`}>
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
      <main id="main-content" className="pch-page">

      <section className="pch-pagehead">
        <div className="wrap pch-wrap pch-grid pch-pagehead__grid">
          <div className="pch-pagehead__text">
            <span className="pch-eyebrow">Tools</span>
            <h1 style={{ maxWidth: "none" }}>Paint Tools</h1>
            <p className="pch-pagehead__lead">
              Five free tools for planning a paint job, plus a match widget for your own site. The
              photo identifier, room visualizer and palette generator match any color against{" "}
              <strong style={{ fontWeight: 500 }}>26,000+ paint colors from {BRAND_COUNT} brands</strong>{" "}
              using the CIEDE2000 color-difference formula, and the compare tool rates two colors with
              the same formula. The paint calculator uses spread rates from manufacturer data sheets.
              All of them run in your browser with no sign-up.
            </p>
          </div>
          <div className="pch-pagehead__art">
            <div className="pch-ui" role="img" aria-label={`${set.source.name} from ${set.source.brand} with its nearest matches in other brands`}>
              <div className="pch-ui__bar">Compare alternatives to {set.source.name}</div>
              {set.matches.map((m) => (
                <div className="pch-ui__row" key={m.name}>
                  <b className="pch-dot" style={{ backgroundColor: m.hex }} />
                  <span><b>{m.name}</b><small>{m.brand}</small></span>
                  <span className="pch-chip">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pch-block pch-block--surface">
        <div className="wrap pch-wrap">
          <div className="pch-cards">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="pch-card pch-cardlink" style={{ padding: "var(--s-4)", gap: "var(--s-4)" }}>
                <ToolArt kind={tool.art} />
                <div style={{ display: "grid", gap: "var(--s-2)", padding: "0 var(--s-2) var(--s-2)" }}>
                  <h2>{tool.title}</h2>
                  <p>{tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pch-block">
        <div className="wrap pch-wrap pch-split">
          <div>
            <h2>When to use each tool</h2>
          </div>
          <div className="pch-prose">
            <p><strong>Paint Calculator</strong>: before ordering. A gallon of interior wall paint covers about 350 to 450 sq ft per coat on primed drywall, depending on the product&apos;s data sheet. Two coats is standard for a color change, and darker colors often need a tinted primer plus two topcoats. The calculator subtracts doors and windows and also handles ceilings, doors, cabinets and exteriors.</p>
            <p><strong>Photo Color Identifier</strong>: when you already have a color you love but don&apos;t know its name. Works best on interior walls photographed in natural light. Results are ranked by Delta E distance, so the top match is the closest, not necessarily the one you expected.</p>
            <p><strong>Room Color Visualizer</strong>: for testing combinations before buying samples. Tests walls, an accent wall, trim and window frames in 10 reference rooms. Useful for catching clashes before committing to a $60 quart you won&apos;t end up using.</p>
            <p><strong>Palette Generator</strong>: when you&apos;re starting from a single color you already like. Builds five palettes (warm, cool, complementary contrast, analogous and earthy), each with Walls, Trim, Accent and Pop colors matched to real paint, not abstract hex values.</p>
            <p><strong>Compare Paint Colors</strong>: when you are down to two candidates, or want to know whether a cheaper brand&apos;s color is a stand-in for the one you picked. It shows both swatches with hex, RGB and LRV and gives one verdict (nearly identical, very similar or visible difference), then links to a room preview of the pair.</p>
            <p>None of these replace physical samples. Paint chips under store lighting read differently than they will on your wall, and any screen preview is limited by your monitor&apos;s calibration. Use these to narrow options, then order actual sample pots before deciding.</p>
          </div>
        </div>
      </section>

      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}

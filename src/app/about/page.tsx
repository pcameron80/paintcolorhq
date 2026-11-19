import { CATALOG_BRANDS, BRAND_COUNT } from "@/lib/catalog-stats";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { FOUNDER_PERSON, ORG_REF, ORG_SAME_AS } from "@/lib/entity-schema";
import { ogDefaults } from "@/lib/og";
import { urbanist } from "@/lib/redesign-font";
import { HOME_MATCH_SETS } from "@/lib/home-matches";
import { closenessLabel } from "@/lib/closeness";
import { deltaE2000, hexToRgb, rgbToLab } from "@/lib/color-utils";
import "../redesign.css";

export const metadata: Metadata = {
  title: "About Paint Color HQ | Our Color Science Methodology",
  description:
    "Learn how Paint Color HQ uses CIEDE2000 color science to match 26,000+ colors across our paint catalog. Independent, data-driven paint color tools.",
  alternates: { canonical: "https://www.paintcolorhq.com/about" },
  openGraph: {
    ...ogDefaults,
    title: "About Paint Color HQ | Our Color Science Methodology",
    description:
      "Learn how Paint Color HQ uses CIEDE2000 color science to match 26,000+ colors across our paint catalog. Independent, data-driven paint color tools.",
    url: "https://www.paintcolorhq.com/about",
  },
};

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function labFor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToLab(r, g, b);
}

// One real pair per closeness label, labeled by the same function every color page uses.
const EXAMPLES = (() => {
  const near = { a: HOME_MATCH_SETS[0].source, b: HOME_MATCH_SETS[0].matches[0] };
  const similar = { a: HOME_MATCH_SETS[1].source, b: HOME_MATCH_SETS[1].matches[2] };
  const far = { a: HOME_MATCH_SETS[1].source, b: HOME_MATCH_SETS[0].source };
  return [near, similar, far].map((pair) => ({ ...pair, label: closenessLabel(deltaE2000(labFor(pair.a.hex), labFor(pair.b.hex))) }));
})();

export default function AboutPage() {
  return (
    <div className={`flex min-h-screen flex-col bg-surface ${urbanist.variable}`}>
      <Header />

      <JsonLd data={{
        "@context": "https://schema.org", ...ORG_REF,
        logo: "https://www.paintcolorhq.com/logo.webp",
        description: "Paint Color HQ is an independent paint color discovery and cross-brand matching platform. We use CIEDE2000 color science to help homeowners and professionals choose paint colors with confidence.",
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: "https://www.paintcolorhq.com/contact", email: "support@paintcolorhq.com" },
        sameAs: ORG_SAME_AS,
        founder: FOUNDER_PERSON,
        knowsAbout: ["Paint color matching", "CIEDE2000 color difference", "Cross-brand paint color comparison", "Color science", "Interior paint selection"],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AboutPage",
        name: "About Paint Color HQ",
        description: "Learn how Paint Color HQ uses CIEDE2000 color science to match 26,000+ paint colors across our paint catalog.",
        url: "https://www.paintcolorhq.com/about",
        mainEntity: ORG_REF,
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "About", item: "https://www.paintcolorhq.com/about" },
        ],
      }} />

      <main id="main-content" className="flex-1 pch-page">
        <section className="pch-pagehead">
          <div className="wrap pch-wrap pch-grid pch-pagehead__grid">
            <div className="pch-pagehead__text">
              <span className="pch-eyebrow">About</span>
              <h1 style={{ maxWidth: "none" }}>About Paint Color HQ</h1>
            </div>
            <div className="pch-pagehead__art" style={{ gridColumn: "8 / span 5" }}>
              <div className="pch-ui" role="img" aria-label="The three closeness labels, each shown with a real pair of paint colors">
                {EXAMPLES.map((e) => (
                  <div className="pch-ui__row" key={e.label} style={{ gridTemplateColumns: "auto 1fr" }}>
                    <span style={{ display: "flex" }}>
                      <b className="pch-dot" style={{ backgroundColor: e.a.hex, width: 32, height: 32 }} />
                      <b className="pch-dot" style={{ backgroundColor: e.b.hex, width: 32, height: 32, marginLeft: -8 }} />
                    </span>
                    <span><b>{e.label}</b><small>{e.a.name} and {e.b.name}</small></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What is Paint Color HQ? */}
        <section className="pch-block pch-block--surface">
          <div className="wrap pch-wrap pch-readable">
            <h2>
              What is Paint Color HQ?
            </h2>
            <div className="pch-prose">
              <p>
                Paint Color HQ is a paint color discovery and cross-brand
                matching platform. We catalog{" "}
                <strong>over 26,000 colors across {BRAND_COUNT} paint brands</strong>{" "}
                and provide free tools that help homeowners, interior designers,
                and painting professionals choose paint colors with confidence.
              </p>
              <p>
                Our mission is straightforward: eliminate the guesswork from
                choosing paint colors. Instead of buying dozens of sample pots or
                wondering whether a Sherwin-Williams shade has a Benjamin Moore
                equivalent, you can find answers instantly with data you can
                trust.
              </p>
              <p>
                Built by{" "}
                <a href="https://pcameron.co/" className="pch-text-link">
                  Philip Cameron
                </a>
                , who started the site after a renovation ran into the
                cross-brand matching problem. His{" "}
                <Link href="/authors/paint-color-hq-staff" className="pch-text-link">
                  author page
                </Link>{" "}
                has the full story. He also builds websites for local
                businesses through{" "}
                <a href="https://clinchriverweb.com/" className="pch-text-link">
                  Clinch River Web
                </a>
                .
              </p>
            </div>

            <div style={{ marginTop: "var(--s-7)", display: "grid", gap: "var(--s-3)" }}>
              <h3>
                Free Tools
              </h3>
              <p className="pch-note" style={{ marginBottom: "var(--s-4)" }}>
                Every tool on Paint Color HQ is free to use, with no account required.
              </p>
              <div className="pch-cards pch-cards--2" style={{ gap: 12 }}>
                {[
                  { href: "/tools/room-visualizer", name: "Room Visualizer", desc: "Preview colors on walls, trim and window frames in 10 photorealistic rooms." },
                  { href: "/tools/color-identifier", name: "Color Identifier", desc: "Upload a photo, click any spot, and find matching paint colors." },
                  { href: "/tools/palette-generator", name: "Palette Generator", desc: "Build coordinated palettes using color harmony rules mapped to real paints." },
                  { href: "/tools/paint-calculator", name: "Paint Calculator", desc: "Estimate gallons needed based on room dimensions, doors, and windows." },
                  { href: "/compare", name: "Compare Tool", desc: "Place two or more colors side by side with a plain-language closeness verdict." },
                  { href: "/search", name: "Color Search", desc: "Search by name, code, hex value, or browse by color family and brand." },
                ].map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="pch-card pch-cardlink" style={{ padding: "var(--s-4)", background: "var(--bg)", gap: 4 }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {tool.name}
                    </span>
                    <p>{tool.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Color Science Methodology */}
        <section className="pch-block">
          <div className="wrap pch-wrap pch-readable">
            <h2>
              Our Color Science Methodology
            </h2>
            <div className="pch-prose">
              <p>
                Color matching on Paint Color HQ is powered by{" "}
                <strong>CIEDE2000</strong>, the latest international standard for
                measuring perceptual color difference. Unlike older formulas
                (CIE76, CIE94), CIEDE2000 accounts for how the human eye
                actually perceives differences in lightness, chroma, and hue,
                making it the most accurate method available for comparing paint
                colors digitally.
              </p>
              <p>
                For every color in our database, we compute the perceptual
                distance (called <strong>Delta E</strong>) to every color from
                every other brand. We turn that distance into one of three
                labels that describe how close two colors look to the human eye:
              </p>
            </div>

            <div style={{ marginTop: "var(--s-5)", overflowX: "auto" }}>
              <table className="pch-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>What It Means</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nearly identical</td>
                    <td>The difference is hard to spot, even side by side</td>
                  </tr>
                  <tr>
                    <td>Very similar</td>
                    <td>Close, but you may notice a slight difference side by side</td>
                  </tr>
                  <tr>
                    <td>Visible difference</td>
                    <td>Clearly distinguishable to most observers</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "var(--s-7)", display: "grid", gap: "var(--s-3)" }}>
              <h3>
                Color Data We Provide
              </h3>
              <p className="pch-prose">Every color page on Paint Color HQ includes:</p>
              <ul className="pch-prose" style={{ marginTop: "var(--s-3)", fontSize: 16 }}>
                {[
                  { bold: "Hex and RGB values", text: "the exact digital color representation" },
                  { bold: "LRV (Light Reflectance Value)", text: "how much light a color reflects, useful for choosing colors for different room sizes and lighting conditions" },
                  { bold: "Undertone classification", text: "whether a color reads warm, cool, or neutral, which affects how it pairs with other elements in your space" },
                  { bold: "Cross-brand matches", text: "the closest equivalent colors from every other brand, ranked from closest to farthest" },
                ].map((item) => (
                  <li key={item.bold} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span className="pch-dot" style={{ width: 8, height: 8, marginTop: 10, background: "var(--accent)" }} />
                    <span><strong>{item.bold}</strong>: {item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How We're Different */}
        <section className="pch-block pch-block--surface">
          <div className="wrap pch-wrap pch-readable">
            <h2>
              How We&apos;re Different
            </h2>
            <p className="pch-prose" style={{ marginBottom: "var(--s-6)" }}>
              Paint Color HQ is not a paint store. We don&apos;t sell paint,
              and no paint manufacturer owns or runs this site.
              We&apos;re an{" "}
              <strong>independent reference tool</strong> built to help you
              make informed decisions about paint colors before you visit the
              store.
            </p>

            <div className="pch-steps">
              {[
                { num: "1", title: "Cross-Brand Matching", desc: "Paint brands don't publish cross-references to each other's colors. We compute matches across the catalogued brands using CIEDE2000, so you can find an equivalent color no matter which brand your local store carries." },
                { num: "2", title: "Data-Driven, Not Opinion-Based", desc: "Every color recommendation on this site is backed by color science. When we say two colors are close, we label how close it is: nearly identical, very similar, or a visible difference. No subjective \"these look similar\" guesses." },
                { num: "3", title: "Completely Free", desc: "All tools, color data, and matching results are free to use with no account or sign-up required. We believe paint color information should be accessible to everyone." },
                { num: "4", title: "Accuracy Transparency", desc: "All color data is based on digital hex and RGB values published by each manufacturer. We update our database regularly and always recommend verifying with physical paint samples, because real paint looks different depending on finish, lighting, coats, and primer." },
              ].map((item) => (
                <div key={item.num}>
                  <div className="n">{item.num}</div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: "var(--s-7)", marginBottom: "var(--s-3)" }}>
              How Paint Color HQ Makes Money
            </h3>
            <div className="pch-prose">
              <p>
                Some links on color pages and in the paint calculator&apos;s
                supplies list go to Amazon. Paint Color HQ is an Amazon
                Associate and earns a commission on qualifying purchases made
                through those links, at no extra cost to you. Links to ECOS
                Paints, on color pages and in the nursery color guide, are
                affiliate links through Awin, and Paint Color HQ earns a
                commission on purchases made through them, also at no extra
                cost to you. Other links to paint brands and paint stores are
                not affiliate links.
              </p>
              <p>
                No paint brand pays for placement in match results. Match
                rankings come from the color data alone, and a brand cannot buy
                a higher position. ECOS Paints is not in our color catalog, so
                it does not appear in those rankings.
              </p>
            </div>
          </div>
        </section>

        {/* Brands We Cover */}
        <section className="pch-block">
          <div className="wrap pch-wrap pch-readable">
            <h2>
              Brands We Cover
            </h2>
            <p className="pch-prose">
              Our database includes colors from {BRAND_COUNT} paint brands
              available in North America and internationally:
            </p>
            <ul className="pch-dots" style={{ marginTop: "var(--s-4)" }}>
              {CATALOG_BRANDS.map((item) => item.name).map((brand) => (
                <li key={brand}>
                  <span className="pch-dot" />
                  {brand}
                </li>
              ))}
            </ul>
            <p className="pch-note" style={{ marginTop: "var(--s-4)" }}>
              We add new brands and update existing color data regularly. If
              you notice a missing color or incorrect data, please{" "}
              <Link href="/contact" className="pch-text-link">
                let us know
              </Link>.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="pch-block pch-block--surface">
          <div className="wrap pch-wrap pch-readable">
            <h2>
              Contact Us
            </h2>
            <p className="pch-prose">
              Have a question, found inaccurate data, or want to suggest a
              feature? We&apos;d like to hear from you.
            </p>
            <p className="pch-prose" style={{ marginTop: "var(--s-3)" }}>
              Visit our{" "}
              <Link href="/contact" className="pch-text-link">
                contact page
              </Link>{" "}
              for general inquiries, corrections, and feedback, or email{" "}
              <a href="mailto:support@paintcolorhq.com" className="pch-text-link">
                support@paintcolorhq.com
              </a>.
            </p>
          </div>
        </section>
      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}

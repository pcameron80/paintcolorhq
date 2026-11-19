import { Metadata } from "next";
import { Urbanist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { InspirationSection } from "@/components/inspiration-section";
import { TrackPage } from "@/components/track-page";
import { AdSenseScript } from "@/components/adsense-script";
import { getAllPosts } from "@/lib/blog-posts";
import { ORG_ID, FOUNDER_PERSON, ORG_SAME_AS } from "@/lib/entity-schema";
import { ogDefaults } from "@/lib/og";
import { BRAND_COUNT } from "@/lib/site-facts";
import { CURRENT_COTY } from "@/lib/color-of-the-year";
import { NAV_BRANDS, NAV_HUES } from "@/lib/site-nav";
import { HOME_MATCH_SETS } from "@/lib/home-matches";
import { HeroCollage } from "@/components/home/hero-collage";
import { MomentsLoader } from "@/components/home/moments-loader";
import "./home.css";

const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", display: "swap" });

const HOME_URL = "https://www.paintcolorhq.com/";
const HOME_TITLE = `Find & Compare Paint Colors Across ${BRAND_COUNT} Brands | Paint Color HQ`;
const HOME_DESCRIPTION = `Find paint colors you love from 26,000+ shades across ${BRAND_COUNT} brands, preview them on a wall, and get your color in the brand you can buy. Free, no signup.`;

export const metadata: Metadata = {
  // absolute: the root page is not wrapped by the layout's title template.
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: HOME_URL },
  openGraph: { ...ogDefaults, title: HOME_TITLE, description: HOME_DESCRIPTION, url: HOME_URL },
};

const colorFamilies = [
  { name: "White", slug: "white", color: "#FFFFFF", border: true },
  { name: "Off-White", slug: "off-white", color: "#F5F0E8", border: true },
  { name: "Gray", slug: "gray", color: "#9CA3AF" },
  { name: "Beige", slug: "beige", color: "#D4C5A9" },
  { name: "Brown", slug: "brown", color: "#8B6914" },
  { name: "Red", slug: "red", color: "#DC2626" },
  { name: "Orange", slug: "orange", color: "#EA580C" },
  { name: "Yellow", slug: "yellow", color: "#EAB308" },
  { name: "Green", slug: "green", color: "#16A34A" },
  { name: "Blue", slug: "blue", color: "#2563EB" },
  { name: "Purple", slug: "purple", color: "#9333EA" },
  { name: "Pink", slug: "pink", color: "#EC4899" },
  { name: "Black", slug: "black", color: "#1F2937" },
];

// Swatch tints for the hue-page chips (approximate band centers, decoration only).
const HUE_SWATCH: Record<string, string> = {
  "/colors/hue/blue-gray": "#6E8296",
  "/colors/hue/blue-green": "#2F8A8C",
  "/colors/hue/rust": "#A4532F",
};

// Ordered discover-first: find a color, expand it, see it on a wall, refine,
// find it in a buyable brand (the closer), then calculate how much.
const tools = [
  {
    name: "Photo Color Identifier",
    description: "Upload a photo of a color you like and get the closest paints.",
    href: "/tools/color-identifier",
    cta: "Upload a photo",
    art: "identifier",
  },
  {
    name: "Palette Generator",
    description: "Start from one color and get a palette mapped to paints you can buy.",
    href: "/tools/palette-generator",
    cta: "Build a palette",
    art: "palette",
  },
  {
    name: "Room Visualizer",
    description: "Preview a color on walls, an accent wall and trim before you buy a sample.",
    href: "/tools/room-visualizer",
    cta: "Try it free",
    art: "room",
  },
  {
    name: "Undertone Analysis",
    description: "Every color is tagged warm, cool or neutral, so it will not clash with your trim.",
    href: "/colors",
    cta: "Browse colors",
    art: "undertone",
  },
  {
    name: "Cross-Brand Matching",
    description: "Find the closest Sherwin-Williams, Behr, PPG or Benjamin Moore color to the one you love.",
    href: "/search",
    cta: "Find a match",
    art: "match",
  },
  {
    name: "Paint Calculator",
    description: "Enter your room size and get the gallons you need, with doors, windows and coats.",
    href: "/tools/paint-calculator",
    cta: "Calculate now",
    art: "calc",
  },
];

export const revalidate = 604800; // 7d — static index page

const faqItems = [
  {
    question: "How does cross-brand color matching work?",
    answer:
      "We use CIEDE2000 to compare digital color values across brands. A lower score means closer digital values. Paint formulas, finishes, and room lighting can change the result, so always test physical samples.",
  },
  {
    question: "How much paint do I need?",
    answer:
      "The Paint Calculator computes an estimate of the gallons needed based on your room dimensions, number of coats, and door/window cutouts. One gallon of paint covers approximately 350–400 square feet.",
  },
  {
    question: "What are paint color undertones?",
    answer:
      "Every color has a hidden tint, warm (yellow/pink), cool (blue/gray), or neutral, that shows up under different lighting. All 26,000+ colors in our database are tagged so you can filter by undertone and avoid clashing with your existing trim, flooring, or cabinets.",
  },
];

function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}


const FARMHOUSE = ["#d6d0c4", "#f0ece2", "#4a4a48", "#7a8c6e", "#b8a99a"];

function ToolArt({ kind }: { kind: string }) {
  const set = HOME_MATCH_SETS[0];
  if (kind === "identifier") {
    return (
      <div className="pch-tool__art" aria-hidden="true">
        {FARMHOUSE.map((hex) => (
          <i key={hex} style={{ backgroundColor: hex }} />
        ))}
      </div>
    );
  }
  if (kind === "palette") {
    return (
      <div className="pch-tool__art" aria-hidden="true">
        {["#cdd2ca", "#d1c7b8", "#444c57", "#d0d6ce", "#cac6bd"].map((hex) => (
          <i key={hex} style={{ backgroundColor: hex }} />
        ))}
      </div>
    );
  }
  if (kind === "room") {
    return (
      <div className="pch-tool__art pch-tool__art--room" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rooms/living-1/base-800.6f903c9beb.webp" alt="" width={800} height={450} loading="lazy" decoding="async" />
      </div>
    );
  }
  if (kind === "undertone") {
    return (
      <div className="pch-tool__art pch-tool__art--rows" aria-hidden="true">
        {[["Warm", "#e8d5b7"], ["Cool", "#c9d6e3"], ["Neutral", "#d9d9d6"]].map(([label, hex]) => (
          <span key={label}>
            <b className="pch-dot" style={{ backgroundColor: hex }} />
            {label}
          </span>
        ))}
      </div>
    );
  }
  if (kind === "match") {
    return (
      <div className="pch-tool__art pch-tool__art--rows" aria-hidden="true">
        {[set.source, set.matches[0]].map((c) => (
          <span key={c.name}>
            <b className="pch-dot" style={{ backgroundColor: c.hex }} />
            {c.name}, {c.brand}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="pch-tool__art pch-tool__art--fields" aria-hidden="true">
      <span>Room size</span>
      <span>Coats</span>
      <span>Doors and windows</span>
    </div>
  );
}

export default async function Home() {
  const set = HOME_MATCH_SETS[0];
  const best = set.matches[0];
  const posts = getAllPosts().slice(0, 3);
  return (
    <div className={`min-h-screen bg-surface ${urbanist.variable}`}>
      <Header />
      <main id="main-content" className="pch-home">

      {/* Hero: triptych. Words and search on the sides, real cross-brand matches in the middle. */}
      <section className="hero pch-hero" data-enter aria-labelledby="home-hero-h" style={{ ["--h" as string]: 1 }}>
        <div className="wrap pch-wrap pch-grid pch-hero__grid">
          <div className="pch-hero__text">
            <h1 id="home-hero-h">Find a paint color you love in any brand</h1>
            <p className="pch-hero__lead">
              Search 26,000+ colors from {BRAND_COUNT} brands, then get the nearest match in the brand you can buy. Free, no signup.
            </p>
          </div>

          <HeroCollage label="Three real cross-brand matches from the site" sets={HOME_MATCH_SETS.map((s, i) => (
              <div key={s.source.name} className={`pch-set${i === 0 ? " is-on" : ""}`} data-set>
                <Link href={s.source.href} className="pch-piece pch-piece--a" tabIndex={i === 0 ? undefined : -1}>
                  <div className="pch-src__swatch" style={{ backgroundColor: s.source.hex }} />
                  <div className="pch-src__body">
                    <span className="k">Your color</span>
                    <b>{s.source.name}</b>
                    <span>{s.source.brand}</span>
                    <span className="mono">{s.source.code} · {s.source.hex}</span>
                  </div>
                </Link>
                <div className="pch-piece pch-piece--b pch-list">
                  <div className="pch-list__head">Nearest to {s.source.name} in other brands</div>
                  {s.matches.map((m) => (
                    <Link key={m.name} href={m.href} tabIndex={i === 0 ? undefined : -1}>
                      <b className="pch-dot" style={{ backgroundColor: m.hex }} />
                      <span><b>{m.name}</b><br /><small>{m.brand}</small></span>
                      <span className="pch-chip">{m.label}</span>
                    </Link>
                  ))}
                </div>
                <div className="pch-piece pch-piece--c">
                  <div className="pch-vs">
                    <div style={{ backgroundColor: s.source.hex }} />
                    <div style={{ backgroundColor: s.matches[0].hex }} />
                  </div>
                  <div className="pch-vs__foot">
                    <span>{s.source.name} and {s.matches[0].name}: {s.matches[0].label.toLowerCase()}</span>
                    <span>Digital match. Confirm with a physical sample.</span>
                  </div>
                </div>
              </div>
          ))} />

          <div className="pch-hero__form">
            <form action="/search" role="search">
              <label htmlFor="home-color-search">Enter a paint name, number, or hex code</label>
              <input id="home-color-search" name="q" type="search" required maxLength={120} placeholder="Try Sea Salt or SW 6204" />
              <button type="submit" className="btn pch-btn pch-btn--solid">Find colors</button>
            </form>
          </div>
        </div>
      </section>

      {/* How a match works: the one dealt moment (pinned chapters). Static rows without script or on small screens. */}
      <section className="section pch-sec" id="how" data-moment="pinned-chapters" style={{ ["--h" as string]: 2, ["--hm" as string]: 2 }} aria-labelledby="home-how-h">
        <div className="wrap mo-pc__grid">
          <div className="mo-pc__text">
            <h2 id="home-how-h">How a color match works</h2>
            <ol className="mo-pc__steps">
              <li className="mo-pc__step">
                <h3>Search any color</h3>
                <p>Type a name, a number or a hex code. {set.source.name}, {set.source.code} and {set.source.hex} all find the same paint.</p>
                <figure className="mo-pc__visual mo-pc__visual--lit">
                  <div className="pch-ui" role="img" aria-label={`A search for ${set.source.name} with the ${set.source.brand} result, ${set.source.code}`}>
                    <div className="pch-ui__bar">Search colors</div>
                    <div className="pch-ui__field">{set.source.name}</div>
                    <div className="pch-ui__row">
                      <b className="pch-dot" style={{ backgroundColor: set.source.hex }} />
                      <span><b>{set.source.name}</b><small>{set.source.brand} · {set.source.code}</small></span>
                      <span className="mono">{set.source.hex}</span>
                    </div>
                  </div>
                </figure>
              </li>
              <li className="mo-pc__step">
                <h3>Compare it across {BRAND_COUNT} brands</h3>
                <p>CIEDE2000 scores how far apart two colors look on screen, against 26,000+ colors.</p>
                <figure className="mo-pc__visual mo-pc__visual--lit">
                  <div className="pch-ui" role="img" aria-label={`Matches for ${set.source.name} in ${set.matches.map((m) => m.brand).join(", ")}, each labeled ${set.matches[0].label.toLowerCase()}`}>
                    <div className="pch-ui__bar">Compare alternatives to {set.source.name}</div>
                    {set.matches.map((m) => (
                      <div className="pch-ui__row" key={m.name}>
                        <b className="pch-dot" style={{ backgroundColor: m.hex }} />
                        <span><b>{m.name}</b><small>{m.brand}</small></span>
                        <span className="pch-chip">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </figure>
              </li>
              <li className="mo-pc__step">
                <h3>Choose a match in your brand</h3>
                <p>Each match says how close it is in plain words. Order a sample before you buy a gallon.</p>
                <figure className="mo-pc__visual mo-pc__visual--lit">
                  <div className="pch-ui" role="img" aria-label={`${set.source.name} beside ${best.name}, labeled ${best.label.toLowerCase()}, with a note to confirm with a physical sample`}>
                    <div className="pch-ui__split">
                      <div style={{ backgroundColor: set.source.hex }} />
                      <div style={{ backgroundColor: best.hex }} />
                    </div>
                    <div className="pch-ui__foot">
                      <span>{set.source.name} and {best.name}: {best.label.toLowerCase()}</span>
                      <span>Digital match. Confirm with a physical sample.</span>
                    </div>
                  </div>
                </figure>
              </li>
            </ol>
            <div className="mo-pc__links">
              <Link href="/match" className="btn pch-btn">Find a match</Link>
              <Link href="/methodology" className="pch-link">How we calculate</Link>
            </div>
          </div>
          <div className="mo-pc__visuals frame"></div>
        </div>
      </section>

      {/* Tools */}
      <section className="section pch-sec" id="tools" aria-labelledby="home-tools-h" style={{ ["--hm" as string]: 2 }}>
        <div className="wrap pch-wrap">
          <div className="pch-head">
            <h2 id="home-tools-h" style={{ maxWidth: "none" }}>Six free tools for choosing a paint color</h2>
          </div>
          <div className="pch-tools">
            {tools.map((tool) => (
              <Link key={tool.href + tool.name} href={tool.href} className="pch-card pch-tool">
                <ToolArt kind={tool.art} />
                <div className="pch-tool__body">
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  <span className="pch-tool__cta">{tool.cta} &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brands and color families */}
      <section className="section pch-sec pch-sec--surface" id="brands" aria-labelledby="home-brands-h" style={{ ["--hm" as string]: 2 }}>
        <div className="wrap pch-wrap">
          <div className="pch-head pch-head--row">
            <div>
              <h2 id="home-brands-h">Browse by brand</h2>
            </div>
            <Link href="/brands" className="pch-link">All brands &rarr;</Link>
          </div>
          <div className="pch-brands">
            {NAV_BRANDS.map((brand) => (
              <Link key={brand.slug} href={`/brands/${brand.slug}`} className="pch-brand">
                {brand.name}
              </Link>
            ))}
          </div>
          <div className="pch-families">
            <div className="pch-families__head">
              <h3>Browse by color family</h3>
              <Link href="/colors" className="pch-link">Explore color families &rarr;</Link>
            </div>
            <ul>
              {colorFamilies.map((family) => (
                <li key={family.slug}>
                  <Link href={`/colors/family/${family.slug}`} className="pch-family">
                    <span className="pch-dot" style={{ backgroundColor: family.color }} />
                    {family.name}
                  </Link>
                </li>
              ))}
              {NAV_HUES.map((hue) => (
                <li key={hue.href}>
                  <Link href={hue.href} className="pch-family">
                    <span className="pch-dot" style={{ backgroundColor: HUE_SWATCH[hue.href] ?? "#9CA3AF" }} />
                    {hue.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p>
              <Link href="/color-of-the-year" className="pch-link">See the {CURRENT_COTY.year} Colors of the Year, matched across brands</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Inspiration (copy unchanged; edited in PR #362) */}
      <section className="section pch-sec" id="inspiration" aria-labelledby="home-inspo-h" style={{ ["--h" as string]: 1, ["--hm" as string]: 2 }}>
        <div className="wrap pch-wrap">
          <div className="pch-head">
            <span className="pch-text-link" style={{ textDecoration: "none", fontWeight: 500 }}>Inspiration</span>
            <h2 id="home-inspo-h" style={{ maxWidth: "none" }}>Color Palettes to Spark Your Next Project</h2>
          </div>
          <div className="pch-inspo">
            <InspirationSection />
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="section pch-sec pch-sec--surface" id="journal" aria-labelledby="home-blog-h" style={{ ["--hm" as string]: 2 }}>
        <div className="wrap pch-wrap">
          <div className="pch-head pch-head--row">
            <div>
              <h2 id="home-blog-h">The Color Journal</h2>
            </div>
            <Link href="/blog" className="pch-link">All articles &rarr;</Link>
          </div>
          <div className="pch-posts">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="pch-post">
                <div className="pch-post__img">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} width={600} height={400} sizes="(max-width: 1023px) 90vw, 400px" />
                  ) : (
                    <div style={{ backgroundColor: post.coverColor, width: "100%", height: "100%" }} />
                  )}
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Compare: the dark band */}
      <section className="section pch-sec pch-sec--inverse" id="compare" aria-labelledby="home-compare-h">
        <div className="wrap pch-wrap pch-grid pch-compare">
          <div className="pch-compare__text pch-span-6">
            <h2 id="home-compare-h" style={{ maxWidth: "14ch" }}>Side-by-side color comparison</h2>
            <p>See how any two colors look next to each other. Compare their digital values, then test physical samples in your own lighting.</p>
            <div>
              <Link href="/compare" className="btn pch-btn">Try the Compare Tool</Link>
            </div>
          </div>
          <div className="pch-compare__art pch-span-6" role="img" aria-label={`${set.source.name} from ${set.source.brand} beside ${best.name} from ${best.brand}, labeled ${best.label.toLowerCase()}`}>
            <div className="pch-compare__swatches">
              <div style={{ backgroundColor: set.source.hex }} />
              <div style={{ backgroundColor: best.hex }} />
            </div>
            <div className="pch-compare__meta">
              <div><b>{set.source.name}</b><small>{set.source.brand} · {set.source.code}</small></div>
              <div><b>{best.name}</b><small>{best.brand} · {best.code}</small></div>
            </div>
            <div className="pch-compare__foot">
              <span className="pch-chip">{best.label}</span>
              <span>Digital match. Confirm with a physical sample.</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section pch-sec pch-faq" id="faq" aria-labelledby="home-faq-h" style={{ ["--hm" as string]: 2 }}>
        <div className="wrap pch-wrap pch-grid">
          <div className="pch-faq__side pch-span-4">
            <h2 id="home-faq-h">Common questions</h2>
            <div>
              <Link href="/match" className="btn pch-btn">Find a match</Link>
            </div>
          </div>
          <div className="pch-span-6 pch-start-7">
            <div className="pch-faq__list">
              {faqItems.map((item) => (
                <div key={item.question} className="pch-faq__item">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>
            <p className="pch-faq__note">
              Color data is based on manufacturer-published digital values (hex, RGB). Actual
              pigments, finishes, and lighting conditions vary. Always verify with a physical
              paint sample before purchasing.
            </p>
          </div>
        </div>
      </section>

      <TrackPage eventName="page_view_enriched" params={{ page_type: "homepage" }} />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Paint Color HQ",
        url: "https://www.paintcolorhq.com",
        description: "Discover, preview, and compare 26,000+ paint colors across our paint catalog, find a color you love, see it on a wall, and get it in the brand you can buy. Cross-brand matches use CIEDE2000 Delta E. Free, no signup.",
        potentialAction: {
          "@type": "SearchAction",
          // Plain URL string is the current Sitelinks Searchbox spec — the
          // older `EntryPoint` object form still works but triggers a Rich
          // Results Test warning.
          target: "https://www.paintcolorhq.com/search?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      }} />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": ORG_ID,
        name: "Paint Color HQ",
        url: "https://www.paintcolorhq.com",
        logo: "https://www.paintcolorhq.com/logo.webp",
        description: "Paint Color HQ helps you discover, preview, and compare 26,000+ paint colors across our paint catalog, then find your color in the brand you can buy. Cross-brand matches use the CIEDE2000 Delta E formula. Free, no signup.",
        sameAs: ORG_SAME_AS,
        founder: FOUNDER_PERSON,
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: "https://www.paintcolorhq.com/contact" },
      }} />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }} />

      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Room Color Visualizer", url: "https://www.paintcolorhq.com/tools/room-visualizer", applicationCategory: "DesignApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Preview 26,000+ paint colors on main walls, accent walls, trim and window frames in 10 photorealistic rooms." },
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Photo Color Identifier", url: "https://www.paintcolorhq.com/tools/color-identifier", applicationCategory: "DesignApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Upload a photo and identify the closest matching paint colors from our catalog." },
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Palette Generator", url: "https://www.paintcolorhq.com/tools/palette-generator", applicationCategory: "DesignApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Generate coordinated color palettes mapped to real purchasable paint colors." },
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Paint Calculator", url: "https://www.paintcolorhq.com/tools/paint-calculator", applicationCategory: "UtilityApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Calculate how many gallons of paint you need based on room dimensions." },
      ]} />

      <MomentsLoader />
      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}

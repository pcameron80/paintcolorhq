import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "About Paint Color HQ | Our Color Science Methodology",
  description:
    "Learn how Paint Color HQ uses CIEDE2000 color science to match 25,000+ colors across 14 brands. Independent, data-driven paint color tools.",
  alternates: { canonical: "https://www.paintcolorhq.com/about" },
  openGraph: {
    title: "About Paint Color HQ | Our Color Science Methodology",
    description:
      "Learn how Paint Color HQ uses CIEDE2000 color science to match 25,000+ colors across 14 brands. Independent, data-driven paint color tools.",
    type: "website",
    url: "https://www.paintcolorhq.com/about",
  },
};

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Organization",
        name: "Paint Color HQ", url: "https://www.paintcolorhq.com",
        logo: "https://www.paintcolorhq.com/logo.webp",
        description: "Paint Color HQ is an independent paint color discovery and cross-brand matching platform. We use CIEDE2000 color science to help homeowners and professionals choose paint colors with confidence.",
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: "https://www.paintcolorhq.com/contact" },
        sameAs: [],
        knowsAbout: ["Paint color matching", "CIEDE2000 color difference", "Cross-brand paint color comparison", "Color science", "Interior paint selection"],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AboutPage",
        name: "About Paint Color HQ",
        description: "Learn how Paint Color HQ uses CIEDE2000 color science to match 25,000+ paint colors across 14 brands.",
        url: "https://www.paintcolorhq.com/about",
        mainEntity: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "About", item: "https://www.paintcolorhq.com/about" },
        ],
      }} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-24 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">About</span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
              About Paint Color HQ
            </h1>
          </div>
        </section>

        {/* What is Paint Color HQ? */}
        <section className="py-20 px-6 md:px-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
              What is Paint Color HQ?
            </h2>
            <div className="space-y-4 text-on-surface-variant leading-relaxed">
              <p>
                Paint Color HQ is a paint color discovery and cross-brand
                matching platform. We catalog{" "}
                <strong className="text-on-surface">over 25,000 colors across 14 major paint brands</strong>{" "}
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
            </div>

            <div className="mt-10">
              <h3 className="font-headline text-xl font-bold text-on-surface mb-2">
                Free Tools
              </h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Every tool on Paint Color HQ is free to use, with no account required.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { href: "/tools/room-visualizer", name: "Room Visualizer", desc: "Preview colors on walls, trim, and floors in a realistic room scene." },
                  { href: "/tools/color-identifier", name: "Color Identifier", desc: "Upload a photo, click any spot, and find matching paint colors." },
                  { href: "/tools/palette-generator", name: "Palette Generator", desc: "Build coordinated palettes using color harmony rules mapped to real paints." },
                  { href: "/tools/paint-calculator", name: "Paint Calculator", desc: "Estimate gallons needed based on room dimensions, doors, and windows." },
                  { href: "/compare", name: "Compare Tool", desc: "Place two or more colors side by side with Delta E scores." },
                  { href: "/search", name: "Color Search", desc: "Search by name, code, hex value, or browse by color family and brand." },
                ].map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 transition hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="font-semibold text-on-surface group-hover:text-primary">
                      {tool.name}
                    </span>
                    <p className="mt-1 text-sm text-on-surface-variant">{tool.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Color Science Methodology */}
        <section className="py-20 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
              Our Color Science Methodology
            </h2>
            <div className="space-y-4 text-on-surface-variant leading-relaxed">
              <p>
                Color matching on Paint Color HQ is powered by{" "}
                <strong className="text-on-surface">CIEDE2000</strong>, the latest international standard for
                measuring perceptual color difference. Unlike older formulas
                (CIE76, CIE94), CIEDE2000 accounts for how the human eye
                actually perceives differences in lightness, chroma, and hue,
                making it the most accurate method available for comparing paint
                colors digitally.
              </p>
              <p>
                For every color in our database, we compute the perceptual
                distance — called <strong className="text-on-surface">Delta E</strong> — to every color from
                every other brand. This score tells you exactly how close two
                colors are to the human eye:
              </p>
            </div>

            <div className="mt-6 overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="px-4 py-3 text-left font-semibold text-on-surface">Delta E Range</th>
                    <th className="px-4 py-3 text-left font-semibold text-on-surface">What It Means</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface-variant">
                  <tr className="border-b border-outline-variant/10">
                    <td className="px-4 py-3 font-semibold text-on-surface">&lt; 1.0</td>
                    <td className="px-4 py-3">Virtually identical — the difference is imperceptible to most people</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="px-4 py-3 font-semibold text-on-surface">1.0 &ndash; 2.0</td>
                    <td className="px-4 py-3">Very close — most people cannot tell them apart</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="px-4 py-3 font-semibold text-on-surface">2.0 &ndash; 3.0</td>
                    <td className="px-4 py-3">Close — a slight difference may be visible when placed side by side</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-on-surface">3.0 &ndash; 5.0</td>
                    <td className="px-4 py-3">Noticeable difference — clearly distinguishable to most observers</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-10">
              <h3 className="font-headline text-xl font-bold text-on-surface mb-4">
                Color Data We Provide
              </h3>
              <p className="text-on-surface-variant leading-relaxed">Every color page on Paint Color HQ includes:</p>
              <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
                {[
                  { bold: "Hex and RGB values", text: "the exact digital color representation" },
                  { bold: "LRV (Light Reflectance Value)", text: "how much light a color reflects, useful for choosing colors for different room sizes and lighting conditions" },
                  { bold: "Undertone classification", text: "whether a color reads warm, cool, or neutral, which affects how it pairs with other elements in your space" },
                  { bold: "Cross-brand matches", text: "the closest equivalent colors from every other brand, ranked by Delta E accuracy" },
                ].map((item) => (
                  <li key={item.bold} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span><strong className="text-on-surface">{item.bold}</strong> — {item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How We're Different */}
        <section className="py-20 px-6 md:px-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
              How We&apos;re Different
            </h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Paint Color HQ is not a paint store. We don&apos;t sell paint,
              and we&apos;re not affiliated with any paint manufacturer.
              We&apos;re an{" "}
              <strong className="text-on-surface">independent reference tool</strong> built to help you
              make informed decisions about paint colors before you visit the
              store.
            </p>

            <div className="space-y-5">
              {[
                { num: "1", title: "Cross-Brand Matching", desc: "Paint brands don't publish cross-references to each other's colors. We compute matches across all 14 brands using CIEDE2000, so you can find an equivalent color no matter which brand your local store carries." },
                { num: "2", title: "Data-Driven, Not Opinion-Based", desc: "Every color recommendation on this site is backed by color science. When we say two colors are close, we show you the Delta E score to prove it. No subjective \"these look similar\" guesses." },
                { num: "3", title: "Completely Free", desc: "All tools, color data, and matching results are free to use with no account or sign-up required. We believe paint color information should be accessible to everyone." },
                { num: "4", title: "Accuracy Transparency", desc: "All color data is based on digital hex and RGB values published by each manufacturer. We update our database regularly and always recommend verifying with physical paint samples, because real paint looks different depending on finish, lighting, coats, and primer." },
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-sm font-bold text-primary">
                    {item.num}
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-on-surface">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brands We Cover */}
        <section className="py-20 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
              Brands We Cover
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Our database includes colors from 14 major paint brands
              available in North America and internationally:
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-on-surface-variant sm:grid-cols-3">
              {[
                "Sherwin-Williams", "Benjamin Moore", "Behr", "PPG", "Valspar",
                "Dunn-Edwards", "Farrow & Ball", "Clark+Kensington", "Glidden",
                "Olympic", "Dutch Boy",
              ].map((brand) => (
                <li key={brand} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {brand}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-on-surface-variant">
              We add new brands and update existing color data regularly. If
              you notice a missing color or incorrect data, please{" "}
              <Link href="/contact" className="text-primary underline hover:text-primary/80">
                let us know
              </Link>.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="py-20 px-6 md:px-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-4">
              Contact Us
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Have a question, found inaccurate data, or want to suggest a
              feature? We&apos;d like to hear from you.
            </p>
            <p className="mt-3 text-on-surface-variant leading-relaxed">
              Visit our{" "}
              <Link href="/contact" className="text-primary underline hover:text-primary/80">
                contact page
              </Link>{" "}
              for general inquiries, corrections, and feedback.
            </p>
          </div>
        </section>
      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}

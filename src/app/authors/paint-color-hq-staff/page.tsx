import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllPosts } from "@/lib/blog-posts";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "Philip Cameron | Founder of Paint Color HQ",
  description:
    "Philip Cameron is the founder of Paint Color HQ. He built the site to solve a personal cross-brand paint color matching problem — and writes every guide grounded in CIEDE2000 color science, not opinion alone.",
  alternates: { canonical: "https://www.paintcolorhq.com/authors/paint-color-hq-staff" },
  openGraph: {
    title: "Philip Cameron | Founder of Paint Color HQ",
    description:
      "Philip Cameron is the founder of Paint Color HQ. He built the site to solve a personal cross-brand paint color matching problem.",
    type: "profile",
    url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff",
  },
};

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const expertiseAreas = [
  { title: "Color Science & Matching", description: "CIEDE2000 color difference analysis and cross-brand paint matching across 14+ brands." },
  { title: "Interior Design Trends", description: "Annual color-of-the-year coverage, seasonal palette trends, and style guidance." },
  { title: "Room-by-Room Guidance", description: "Evidence-based paint color recommendations for kitchens, bathrooms, bedrooms, and living spaces." },
  { title: "Paint Technology", description: "Coverage of paint finishes, undertones, LRV values, and how lighting affects color perception." },
  { title: "Home Improvement", description: "Practical advice on painting projects, prep work, and color selection for renovations." },
  { title: "Brand Comparisons", description: "In-depth reviews and comparisons of Sherwin-Williams, Benjamin Moore, Behr, and more." },
];

export default function PhilipCameronPage() {
  const authorPosts = getAllPosts().filter((p) => p.author === "Philip Cameron");

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Philip Cameron",
        url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff",
        jobTitle: "Founder, Paint Color HQ",
        worksFor: {
          "@type": "Organization",
          name: "Paint Color HQ",
          url: "https://www.paintcolorhq.com",
        },
        sameAs: [
          "https://www.linkedin.com/in/philip-a-cameron/",
          "https://github.com/pcameron80",
        ],
        description: "Philip Cameron is the founder of Paint Color HQ, an independent cross-brand paint color reference site grounded in CIEDE2000 color science. He built the site after a personal renovation project ran into the cross-brand matching problem most homeowners hit.",
        knowsAbout: [
          "Cross-brand paint color matching",
          "CIEDE2000 color difference",
          "Interior paint selection",
          "Paint color undertones",
          "LRV (Light Reflectance Value)",
          "Sherwin-Williams paint colors",
          "Benjamin Moore paint colors",
          "Behr paint colors",
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Authors", item: "https://www.paintcolorhq.com/authors" },
          { "@type": "ListItem", position: 3, name: "Philip Cameron", item: "https://www.paintcolorhq.com/authors/paint-color-hq-staff" },
        ],
      }} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-24 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <nav className="mb-8 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2 text-outline">/</span>
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <span className="mx-2 text-outline">/</span>
              <span className="text-on-surface">Philip Cameron</span>
            </nav>

            <div className="flex items-start gap-6">
              {/* Photo placeholder */}
              <div className="hidden sm:flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold">
                P
              </div>
              <div>
                <span className="text-primary font-bold text-xs uppercase tracking-widest">Author</span>
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface leading-[0.95] mt-1">
                  Philip Cameron
                </h1>
                <p className="mt-3 text-on-surface-variant leading-relaxed max-w-2xl">
                  Founder, Paint Color HQ
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bio */}
        <section className="py-16 px-6 md:px-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">About</h2>
            <div className="space-y-4 text-on-surface-variant leading-relaxed">
              <p>
                I&apos;m Philip Cameron, the founder of Paint Color HQ. I built this site after a personal renovation hit the same problem most homeowners run into: a designer specified a Sherwin-Williams color, the contractor only stocked Behr, and the cross-reference resources online were either incomplete, paywalled, or wrong. Paint Color HQ is the tool I wish had existed.
              </p>
              <p>
                I&apos;m not an interior designer or paint industry insider. I&apos;m a homeowner and software builder who got obsessed with the specific problem of matching paint colors accurately across brands. Every color recommendation on the site is grounded in the <strong className="text-on-surface">CIEDE2000 Delta E formula</strong> — the same color-science standard used by paint manufacturers&apos; quality-control labs — not personal opinion alone.
              </p>
              <p>
                Paint Color HQ is an independent project. It has no paid relationships with paint manufacturers and earns through standard display advertising. The site catalogs over 26,000 paint colors across 13 brands, cross-references each one with the closest matches from every other brand, and tags every color with hex, RGB, LRV, undertone, and family data. If you spot a match that looks off or a brand you&apos;d like to see added, the <Link href="/contact" className="text-primary hover:underline">contact page</Link> goes straight to me.
              </p>
            </div>
          </div>
        </section>

        {/* Areas of Expertise */}
        <section className="py-16 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">Areas of Expertise</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {expertiseAreas.map((area) => (
                <div key={area.title} className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6">
                  <h3 className="font-headline font-bold text-on-surface mb-2">{area.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Published Articles */}
        {authorPosts.length > 0 && (
          <section className="py-16 px-6 md:px-12 bg-surface-container-low">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">
                Published Articles ({authorPosts.length})
              </h2>
              <div className="space-y-4">
                {authorPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex items-baseline gap-4 rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-5 hover:shadow-md transition-all"
                  >
                    <time dateTime={post.date} className="shrink-0 text-xs text-outline tabular-nums">
                      {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </time>
                    <span className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                      {post.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}

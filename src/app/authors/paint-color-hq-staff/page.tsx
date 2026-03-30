import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllPosts } from "@/lib/blog-posts";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "Paint Color HQ Staff | Authors",
  description:
    "Meet the Paint Color HQ editorial team. Our staff writers specialize in paint color science, cross-brand matching, interior design trends, and home improvement guidance.",
  alternates: { canonical: "https://www.paintcolorhq.com/authors/paint-color-hq-staff" },
  openGraph: {
    title: "Paint Color HQ Staff | Authors",
    description:
      "Meet the Paint Color HQ editorial team. Our staff writers specialize in paint color science, cross-brand matching, interior design trends, and home improvement guidance.",
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

export default function PaintColorHqStaffPage() {
  const staffPosts = getAllPosts().filter((p) => p.author === "Paint Color HQ Staff");

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Paint Color HQ Staff",
        url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff",
        jobTitle: "Editorial Team",
        worksFor: {
          "@type": "Organization",
          name: "Paint Color HQ",
          url: "https://www.paintcolorhq.com",
        },
        description: "The Paint Color HQ editorial team writes expert guides on paint color selection, cross-brand matching, and interior design trends.",
        knowsAbout: [
          "Paint color matching",
          "CIEDE2000 color difference",
          "Interior paint selection",
          "Cross-brand paint comparison",
          "Color trends",
          "Home improvement",
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Authors", item: "https://www.paintcolorhq.com/authors" },
          { "@type": "ListItem", position: 3, name: "Paint Color HQ Staff", item: "https://www.paintcolorhq.com/authors/paint-color-hq-staff" },
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
              <span className="text-on-surface">Paint Color HQ Staff</span>
            </nav>

            <div className="flex items-start gap-6">
              {/* Photo placeholder */}
              <div className="hidden sm:flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold">
                P
              </div>
              <div>
                <span className="text-primary font-bold text-xs uppercase tracking-widest">Author</span>
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface leading-[0.95] mt-1">
                  Paint Color HQ Staff
                </h1>
                <p className="mt-3 text-on-surface-variant leading-relaxed max-w-2xl">
                  Editorial Team at Paint Color HQ
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
                The Paint Color HQ Staff is our in-house editorial team dedicated to helping homeowners, designers, and painting professionals make confident color choices. We combine hands-on paint industry experience with data-driven color science to produce practical, trustworthy guides.
              </p>
              <p>
                Our team uses the <strong className="text-on-surface">CIEDE2000 color difference algorithm</strong> to analyze and cross-reference over 25,000 paint colors across 14 major brands. Every recommendation we publish is grounded in measurable color data, not subjective opinion alone.
              </p>
              <p>
                From annual color-of-the-year roundups to room-by-room painting guides, our goal is to take the guesswork out of choosing paint colors. We regularly update our content as brands release new palettes and as design trends evolve.
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
        {staffPosts.length > 0 && (
          <section className="py-16 px-6 md:px-12 bg-surface-container-low">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">
                Published Articles ({staffPosts.length})
              </h2>
              <div className="space-y-4">
                {staffPosts.map((post) => (
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

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { getAllPosts } from "@/lib/blog-posts";
import { TagFilter } from "@/components/tag-filter";
import { urbanist } from "@/lib/redesign-font";
import "../redesign.css";

// ISR: re-render hourly so scheduled (future-dated) posts appear on their date
// without a redeploy. See src/lib/blog-publish.ts.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Paint Color Blog: Guides, Trends & Color Theory",
  description:
    "Expert guides on paint colors, cross-brand matching, color trends, and interior design tips. Learn how to choose the perfect paint color for every room.",
  alternates: { canonical: "https://www.paintcolorhq.com/blog" },
  openGraph: {
    title: "Blog | Paint Color HQ",
    description: "Expert guides on paint colors, cross-brand matching, color trends, and interior design tips.",
    type: "website",
    url: "https://www.paintcolorhq.com/blog",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// JSON-LD helper — content is server-generated from trusted static data only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

interface BlogPageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function BlogIndex({ searchParams }: BlogPageProps) {
  const { tag: activeTag } = await searchParams;
  const allPosts = getAllPosts();

  // Collect all unique tags sorted by frequency
  const tagCounts = new Map<string, number>();
  for (const post of allPosts) {
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const allTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  // Filter posts by tag if active
  const posts = activeTag
    ? allPosts.filter((p) => p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    : allPosts;

  const featured = !activeTag ? posts[0] : null;
  const gridPosts = featured ? posts.slice(1) : posts;

  return (
    <div className={`min-h-screen bg-surface ${urbanist.variable}`}>
      <Header />
      <main id="main-content" className="pch-page">
      <section className="pch-pagehead" style={{ paddingBottom: "var(--s-6)" }}>
        <div className="wrap pch-wrap">
          <nav className="pch-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>Blog</span>
          </nav>
          <span className="pch-eyebrow">Insights</span>
          <h1 style={{ maxWidth: "none" }}>The Color Journal</h1>
          <p className="pch-pagehead__lead" style={{ marginTop: "var(--s-4)" }}>
            Expert guides on paint colors, cross-brand matching, color trends, and interior design tips.
          </p>
        </div>
      </section>

      {featured && (
        <section className="pch-block" style={{ paddingTop: 0, paddingBottom: "var(--s-6)" }}>
          <div className="wrap pch-wrap">
            <Link href={`/blog/${featured.slug}`} className="pch-featured">
              <div className="pch-featured__img">
                {featured.coverImage ? (
                  <Image src={featured.coverImage} alt={featured.title} width={800} height={500} sizes="(max-width: 1023px) 100vw, 640px" priority />
                ) : (
                  <div style={{ backgroundColor: featured.coverColor, width: "100%", height: "100%", minHeight: 300 }} />
                )}
              </div>
              <div className="pch-featured__body">
                <div className="pch-tags">
                  {featured.tags.map((tag) => (
                    <span key={tag} className="pch-tag">{tag}</span>
                  ))}
                </div>
                <h2>{featured.title}</h2>
                <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6 }}>{featured.excerpt}</p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--s-3)" }}>
                  <time dateTime={featured.date} className="pch-post-meta">{formatDate(featured.date)}</time>
                  <span className="pch-cta" style={{ color: "var(--accent)", fontWeight: 500 }}>Read article &rarr;</span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section className="pch-block" style={{ paddingTop: "var(--s-5)", paddingBottom: "var(--s-5)" }}>
        <div className="wrap pch-wrap pch-filter">
          <span className="pch-note" style={{ display: "block", marginBottom: "var(--s-3)" }}>Filter by topic</span>
          <TagFilter tags={allTags} activeTag={activeTag} initialCount={5} />
        </div>
      </section>

      <section className="pch-block pch-block--surface">
        <div className="wrap pch-wrap">
          <div className="pch-posts-grid">
            {gridPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="pch-post">
                <div className="pch-post__img">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} width={600} height={375} sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 400px" />
                  ) : (
                    <div style={{ backgroundColor: post.coverColor, width: "100%", height: "100%" }} />
                  )}
                </div>
                <div className="pch-tags">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="pch-tag">{tag}</span>
                  ))}
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <time dateTime={post.date} className="pch-post-meta">{formatDate(post.date)}</time>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Blog",
        name: "Paint Color HQ Blog",
        description: "Expert guides on paint colors, cross-brand matching, color trends, and interior design tips.",
        url: "https://www.paintcolorhq.com/blog",
        publisher: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" },
        blogPost: allPosts.map((post) => ({
          "@type": "BlogPosting", headline: post.title, datePublished: post.date,
          url: `https://www.paintcolorhq.com/blog/${post.slug}`,
          ...(post.coverImage && { image: `https://www.paintcolorhq.com${post.coverImage}` }),
        })),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.paintcolorhq.com/blog" },
        ],
      }} />

      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}

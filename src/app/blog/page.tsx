import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { getAllPosts } from "@/lib/blog-posts";
import { TagFilter } from "@/components/tag-filter";

export const metadata: Metadata = {
  title: "Blog",
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
    <div className="min-h-screen bg-surface">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">Blog</span>
          </nav>
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Insights</span>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-6">
            The Color Journal
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Expert guides on paint colors, cross-brand matching, color trends, and interior design tips.
          </p>

        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="px-6 md:px-12 pb-16">
          <div className="max-w-7xl mx-auto">
            <Link href={`/blog/${featured.slug}`} className="group grid grid-cols-1 lg:grid-cols-2 gap-0 bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
              <div className="aspect-[16/10] lg:aspect-auto overflow-hidden">
                {featured.coverImage ? (
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    width={800}
                    height={500}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full min-h-[300px]" style={{ backgroundColor: featured.coverColor }} />
                )}
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex flex-wrap gap-2 mb-4">
                  {featured.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface leading-tight group-hover:text-primary transition-colors mb-4">
                  {featured.title}
                </h2>
                <p className="text-on-surface-variant leading-relaxed mb-6">{featured.excerpt}</p>
                <div className="flex items-center justify-between">
                  <time dateTime={featured.date} className="text-xs text-outline">{formatDate(featured.date)}</time>
                  <span className="text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read article <span>&rarr;</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Tag Filter */}
      <section className="px-6 md:px-12 py-10 bg-surface">
        <div className="max-w-7xl mx-auto">
          <span className="text-[10px] uppercase tracking-widest font-bold text-outline mb-4 block">Filter by topic</span>
          <TagFilter tags={allTags} activeTag={activeTag} initialCount={5} />
        </div>
      </section>

      {/* Post Grid — alternating bento layout */}
      <section className="px-6 md:px-12 py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          {(() => {
            // Pattern: [wide-left + 1] [3] [1 + wide-right] [3] repeat
            // Each "wide" row uses 2 posts, each "normal" row uses 3 posts
            // Cycle: 2, 3, 2, 3 = 10 posts per full cycle
            const rows: { posts: typeof gridPosts; wideIndex: number | null; wideRight: boolean }[] = [];
            let i = 0;
            let cycle = 0;

            while (i < gridPosts.length) {
              const step = cycle % 4;
              if (step === 0) {
                // Wide left: first post is wide, second is normal
                rows.push({ posts: gridPosts.slice(i, i + 2), wideIndex: 0, wideRight: false });
                i += 2;
              } else if (step === 1) {
                // 3 normal
                rows.push({ posts: gridPosts.slice(i, i + 3), wideIndex: null, wideRight: false });
                i += 3;
              } else if (step === 2) {
                // Wide right: first is normal, second is wide
                rows.push({ posts: gridPosts.slice(i, i + 2), wideIndex: 1, wideRight: true });
                i += 2;
              } else {
                // 3 normal
                rows.push({ posts: gridPosts.slice(i, i + 3), wideIndex: null, wideRight: false });
                i += 3;
              }
              cycle++;
            }

            return (
              <div className="space-y-12">
                {rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {row.posts.map((post, postIdx) => {
                      const isWide = row.wideIndex === postIdx;
                      return (
                        <Link
                          key={post.slug}
                          href={`/blog/${post.slug}`}
                          className={`group cursor-pointer ${isWide ? "lg:col-span-2" : ""}`}
                        >
                          <div className={`overflow-hidden rounded-lg mb-6 ${isWide ? "aspect-[2/1]" : "aspect-[16/10]"}`}>
                            {post.coverImage ? (
                              <Image src={post.coverImage} alt={post.title} width={isWide ? 900 : 600} height={isWide ? 450 : 375}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full" style={{ backgroundColor: post.coverColor }} />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded-full bg-surface-container-highest px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{tag}</span>
                            ))}
                          </div>
                          <h3 className={`font-headline font-bold mb-3 leading-tight group-hover:text-primary transition-colors text-on-surface ${isWide ? "text-2xl" : "text-xl"}`}>
                            {post.title}
                          </h3>
                          <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{post.excerpt}</p>
                          <time dateTime={post.date} className="text-xs text-outline">{formatDate(post.date)}</time>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}
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

      <AdSenseScript />
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllPosts, getPostBySlug, getAllBlogSlugs, getRelatedPosts } from "@/lib/blog-posts";
import { AdSenseScript } from "@/components/adsense-script";
import { TrackPage } from "@/components/track-page";
import { TableOfContents } from "@/components/table-of-contents";
import { ColorLinkEnhancer } from "@/components/color-link-enhancer";
import { PinterestSaveButton } from "@/components/pinterest-save-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  const url = `https://www.paintcolorhq.com/blog/${post.slug}`;
  return {
    title: `${post.title}`,
    description: post.excerpt,
    ...(post.noindex && { robots: { index: false, follow: true } }),
    alternates: { canonical: url },
    openGraph: {
      title: post.title, description: post.excerpt, type: "article",
      publishedTime: post.date, modifiedTime: post.modifiedDate ?? post.date, url, tags: post.tags,
      ...(post.coverImage && { images: [{ url: `https://www.paintcolorhq.com${post.coverImage}`, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image", title: post.title, description: post.excerpt,
      ...(post.coverImage && { images: [`https://www.paintcolorhq.com${post.coverImage}`] }),
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// JSON-LD helper — content is server-generated from trusted static data only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const relatedPosts = getRelatedPosts(slug, 3);
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  // Pinterest pin metadata — uses post.pinImage if provided (hand-designed
  // 1000×1500 vertical pin), otherwise auto-generates via /api/pin/blog.
  let blogPinImageUrl: string;
  if (post.pinImage) {
    blogPinImageUrl = `https://www.paintcolorhq.com${post.pinImage}`;
  } else {
    const pinParams = new URLSearchParams({ title: post.title });
    if (post.coverImage) pinParams.set("cover", post.coverImage);
    if (post.coverColor) pinParams.set("color", post.coverColor);
    if (post.tags[0]) pinParams.set("tag", post.tags[0]);
    blogPinImageUrl = `https://www.paintcolorhq.com/api/pin/blog?${pinParams.toString()}`;
  }
  const tagHashtags = post.tags
    .slice(0, 4)
    .map((t) => `#${t.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
    .filter(Boolean)
    .join(" ");
  const blogPinDescription = `${post.excerpt} Read at PaintColorHQ.com ${tagHashtags}`;

  return (
    <div className="min-h-screen bg-surface">
      {/* Pinterest pin trigger — hidden, picked up by the Save extension */}
      <img
        src={blogPinImageUrl}
        data-pin-media={blogPinImageUrl}
        data-pin-description={blogPinDescription}
        alt={post.title}
        width={1000}
        height={1500}
        loading="lazy"
        style={{ position: "absolute", left: "-99999px", width: 1, height: 1, opacity: 0 }}
      />
      <Header />

      {/* Hero image or color bar */}
      {post.coverImage ? (
        <div className="relative h-64 sm:h-80 md:h-96 mt-[65px]">
          <Image src={post.coverImage} alt={post.title} fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
        </div>
      ) : (
        <div className="h-32 sm:h-40 mt-[65px]" style={{ backgroundColor: post.coverColor }} />
      )}

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-12 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">{post.title}</span>
          </nav>

          <article>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{tag}</span>
              ))}
            </div>

            <h1 className="mt-4 font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-outline">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <div className="bg-surface-container-high h-1 w-4" />
              <Link href="/authors/paint-color-hq-staff" className="hover:text-primary transition-colors">{post.author}</Link>
              <div className="bg-surface-container-high h-1 w-4" />
              <PinterestSaveButton
                pageUrl={`/blog/${slug}`}
                mediaUrl={blogPinImageUrl}
                description={blogPinDescription}
              />
            </div>

            <div id="blog-content" className="prose prose-gray max-w-none mt-10 text-on-surface-variant leading-relaxed">
              <TableOfContents />
              {post.content()}
            </div>
            <ColorLinkEnhancer containerRef="blog-content" />
          </article>

          {/* Prev / Next */}
          <nav className="mt-16 grid grid-cols-1 gap-4 pt-10 sm:grid-cols-2">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`} className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-6 hover:shadow-lg transition-all">
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">&larr; Previous</span>
                <span className="mt-2 block font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{prevPost.title}</span>
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`} className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-6 text-right hover:shadow-lg transition-all">
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Next &rarr;</span>
                <span className="mt-2 block font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{nextPost.title}</span>
              </Link>
            ) : <div />}
          </nav>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-10">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">Related Posts</h2>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((rp) => (
                  <Link key={rp.slug} href={`/blog/${rp.slug}`} className="group">
                    {rp.coverImage && (
                      <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-lg">
                        <Image src={rp.coverImage} alt={rp.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 640px) 100vw, 33vw" />
                      </div>
                    )}
                    <time dateTime={rp.date} className="text-xs text-outline">{formatDate(rp.date)}</time>
                    <span className="mt-1 block font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{rp.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Explore Tools */}
          <section className="mt-16 pt-10">
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">Explore Our Tools</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <Link href="/tools/room-visualizer" className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 text-center hover:shadow-lg transition-all duration-500">
                <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Room Visualizer</p>
                <p className="mt-2 text-sm text-on-surface-variant">Preview colors in real rooms</p>
              </Link>
              <Link href="/tools/palette-generator" className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 text-center hover:shadow-lg transition-all duration-500">
                <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Palette Generator</p>
                <p className="mt-2 text-sm text-on-surface-variant">Build harmonious color schemes</p>
              </Link>
              <Link href="/search" className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 text-center hover:shadow-lg transition-all duration-500">
                <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Color Search</p>
                <p className="mt-2 text-sm text-on-surface-variant">Find any color across brands</p>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <TrackPage eventName="blog_read" params={{ page_type: "blog", content_category: post.tags[0], blog_slug: slug }} />
      <AdSenseScript />
      <Footer />

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BlogPosting",
        headline: post.title, datePublished: post.date, dateModified: post.modifiedDate ?? post.date,
        description: post.excerpt, url: `https://www.paintcolorhq.com/blog/${post.slug}`,
        mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.paintcolorhq.com/blog/${post.slug}` },
        keywords: post.tags.join(", "),
        ...(post.coverImage && { image: `https://www.paintcolorhq.com${post.coverImage}` }),
        author: { "@type": "Person", name: post.author, url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff", jobTitle: "Editorial Team", worksFor: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" } },
        publisher: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com", logo: { "@type": "ImageObject", url: "https://www.paintcolorhq.com/og-image.webp" } },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.paintcolorhq.com/blog" },
          { "@type": "ListItem", position: 3, name: post.title, item: `https://www.paintcolorhq.com/blog/${post.slug}` },
        ],
      }} />
    </div>
  );
}

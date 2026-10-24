import { Children, isValidElement, type ReactNode } from "react";
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
import { FOUNDER_PERSON, ORG_REF } from "@/lib/entity-schema";
import { PinterestSaveButton } from "@/components/pinterest-save-button";
import { TrackedLink } from "@/components/tracked-link";
import { getColorBySlug } from "@/lib/queries";

// ISR: re-render hourly so a scheduled post becomes reachable on its date
// (and 404s before it). dynamicParams (default true) renders not-yet-prebuilt
// slugs on demand once they go live. See src/lib/blog-publish.ts.
export const revalidate = 3600;

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
  const image = shareImage(post);
  return {
    title: `${post.title}`,
    description: post.excerpt,
    ...(post.noindex && { robots: { index: false, follow: true } }),
    alternates: { canonical: url },
    openGraph: {
      title: post.title, description: post.excerpt, type: "article",
      publishedTime: post.date, modifiedTime: post.modifiedDate ?? post.date, url, tags: post.tags,
      images: [image],
    },
    twitter: {
      card: "summary_large_image", title: post.title, description: post.excerpt,
      images: [image.url],
    },
  };
}

// Share image for og:image, twitter:image and BlogPosting.image. Posts without
// a cover use the site's default card rather than emitting no image at all.
// The default is 1200x800 on disk; covers are generated at 1200x630.
function shareImage(post: { coverImage?: string }) {
  return post.coverImage
    ? { url: `https://www.paintcolorhq.com${post.coverImage}`, width: 1200, height: 630 }
    : { url: "https://www.paintcolorhq.com/og-image.webp", width: 1200, height: 800 };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// JSON-LD helper — content is server-generated from trusted static data only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// Reuse explicitly authored swatch data; never infer a paint from a photo.
function articleSwatches(node: ReactNode): {name: string; brand?: string; hex: string; href: string}[] {
  const found = new Map<string, {name: string; brand?: string; hex: string; href: string}>();
  function visit(children: ReactNode) {
    Children.forEach(children, child => {
      if (!isValidElement<{children?: ReactNode; name?: string; brand?: string; hex?: string; href?: string}>(child)) return;
      const p = child.props;
      if (p.name && p.hex && /^#[0-9a-f]{6}$/i.test(p.hex) && p.href?.startsWith("/colors/")) found.set(p.href, {name:p.name, brand:p.brand, hex:p.hex, href:p.href});
      if (p.children) visit(p.children);
    });
  }
  visit(node);
  return [...found.values()].slice(0, 6);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleContent = post.content();
  const swatches = articleSwatches(articleContent);
  // Compare CTA: first two distinct swatch colors, resolved to IDs because /compare
  // takes color1/color2 ids. Only shown when the post has 2+ distinct colors.
  const compareSwatches = swatches.filter((c, i, a) => a.findIndex((o) => o.hex.toLowerCase() === c.hex.toLowerCase()) === i).slice(0, 2);
  let compareHref: string | null = null;
  if (compareSwatches.length === 2) {
    const resolved = await Promise.all(
      compareSwatches.map((c) => {
        const [, , brandSlug, colorSlug] = c.href.split("/");
        return brandSlug && colorSlug ? getColorBySlug(brandSlug, colorSlug) : null;
      }),
    );
    if (resolved[0] && resolved[1]) compareHref = `/compare?color1=${resolved[0].id}&color2=${resolved[1].id}`;
  }
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
          <Image src={post.coverImage} alt={post.title} fill preload fetchPriority="high" className="object-cover" sizes="100vw" />
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
              {post.modifiedDate && post.modifiedDate !== post.date && (
                <>
                  <div className="bg-surface-container-high h-1 w-4" />
                  <span>Updated <time dateTime={post.modifiedDate}>{formatDate(post.modifiedDate)}</time></span>
                </>
              )}
              <div className="bg-surface-container-high h-1 w-4" />
              <Link href="/authors/paint-color-hq-staff" className="hover:text-primary transition-colors">{post.author}</Link>
              <div className="bg-surface-container-high h-1 w-4" />
              <PinterestSaveButton
                pageUrl={`/blog/${slug}`}
                mediaUrl={blogPinImageUrl}
                description={blogPinDescription}
              />
            </div>

            {swatches.length > 0 && <section aria-label="Colors in this guide" className="mt-8 rounded-xl border border-outline-variant/30 p-4">
              <h2 className="font-headline text-xl font-bold">Explore colors in this guide</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Open a color for its details and cross-brand alternatives. Read on for the context behind each choice.</p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">{swatches.map(c => <Link key={c.href} href={c.href} className="rounded-lg overflow-hidden border border-outline-variant/20">
                <div className="h-24 border-b border-black/10" style={{backgroundColor:c.hex}} />
                <div className="p-3"><p className="font-semibold text-sm">{c.name}</p>{c.brand && <p className="text-xs mt-1">{c.brand}</p>}</div>
              </Link>)}</div>
            </section>}

            <div id="blog-content" className="prose prose-gray max-w-none mt-10 text-on-surface-variant leading-relaxed">
              <TableOfContents />
              {articleContent}
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

          {compareHref && (
            <aside className="mt-12 rounded-xl border border-outline-variant/30 bg-surface-container-low p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex shrink-0">
                  {compareSwatches.map((c, i) => (
                    <span key={c.href} className={`h-9 w-9 rounded-full border-2 border-white ${i > 0 ? "-ml-3" : ""}`} style={{ backgroundColor: c.hex }} aria-hidden="true" />
                  ))}
                </span>
                <p className="font-headline font-bold text-on-surface">Compare {compareSwatches[0].name} and {compareSwatches[1].name} side by side</p>
              </div>
              <TrackedLink href={compareHref} eventName="cta_click" eventParams={{ cta_label: "blog_compare", blog_slug: slug }}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-headline font-bold text-sm hover:shadow-md transition-all">
                Open comparison
              </TrackedLink>
            </aside>
          )}

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
        // Always emit `image`, the same file as og:image. Posts without a
        // coverImage use the static default card, not an /api URL.
        image: { "@type": "ImageObject", ...shareImage(post) },
        // Every current post is by the founder; a future guest author gets a plain Person node.
        author: post.author === FOUNDER_PERSON.name
          ? { ...FOUNDER_PERSON, worksFor: ORG_REF }
          : { "@type": "Person", name: post.author },
        publisher: { ...ORG_REF, logo: { "@type": "ImageObject", url: "https://www.paintcolorhq.com/logo.webp", width: 600, height: 60 } },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.paintcolorhq.com/blog" },
          { "@type": "ListItem", position: 3, name: post.title, item: `https://www.paintcolorhq.com/blog/${post.slug}` },
        ],
      }} />
      {/* FAQPage schema — for AI engine citation (Perplexity, AI Overviews,
          ChatGPT). Google restricted FAQPage rich results to government/
          healthcare in Aug 2023, so no Google SERP lift, but AI engines still
          extract these Q&A pairs for citation. Only emitted when the post
          defines a `faq` array. */}
      {post.faq && post.faq.length > 0 && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }} />
      )}
    </div>
  );
}

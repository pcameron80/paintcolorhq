import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog | Paint Color HQ",
  description:
    "Expert guides on paint colors, cross-brand matching, color trends, and interior design tips. Learn how to choose the perfect paint color for every room.",
  alternates: { canonical: "https://paintcolorhq.com/blog" },
  openGraph: {
    title: "Blog | Paint Color HQ",
    description:
      "Expert guides on paint colors, cross-brand matching, color trends, and interior design tips.",
    type: "website",
    url: "https://paintcolorhq.com/blog",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = getAllPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Paint Color HQ Blog",
    description:
      "Expert guides on paint colors, cross-brand matching, color trends, and interior design tips.",
    url: "https://paintcolorhq.com/blog",
    publisher: {
      "@type": "Organization",
      name: "Paint Color HQ",
      url: "https://paintcolorhq.com",
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      datePublished: post.date,
      url: `https://paintcolorhq.com/blog/${post.slug}`,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Blog</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="mt-2 text-gray-600">
            Expert guides on paint colors, cross-brand matching, and interior
            design tips.
          </p>

          {/* Post grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Color accent bar */}
                <div
                  className="h-32"
                  style={{ backgroundColor: post.coverColor }}
                />
                <div className="p-5">
                  <time
                    dateTime={post.date}
                    className="text-xs font-medium text-gray-500"
                  >
                    {formatDate(post.date)}
                  </time>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {post.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

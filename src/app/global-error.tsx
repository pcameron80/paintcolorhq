"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- after a root crash a full
   page load is the point; client-side navigation would reuse the broken tree. */

// Branded 500 page. It replaces the root layout when rendering fails, so it
// carries its own <html>, <body> and stylesheet, and it must not fetch data or
// render anything that can fail the same way: no Header (its auth button talks
// to Supabase), no queries, plain <a> links and a GET search form.
import "./globals.css";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/colors", label: "Browse colors" },
  { href: "/compare", label: "Compare two colors" },
];

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong | Paint Color HQ</title>
        <meta name="robots" content="noindex" />
      </head>
      <body className="font-sans antialiased bg-surface text-on-surface">
        <header className="w-full bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-12">
            <a href="/" className="flex shrink-0 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.webp" alt="Paint Color HQ" width={140} height={33} />
            </a>
            <nav className="flex items-center gap-6 text-sm font-semibold uppercase tracking-tight text-on-surface-variant">
              <a href="/colors" className="hover:text-primary">Colors</a>
              <a href="/compare" className="hover:text-primary">Compare</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24">
          <h1 className="font-headline text-3xl font-extrabold text-on-surface sm:text-4xl">
            Something went wrong. Please try again.
          </h1>
          <p className="mt-4 text-on-surface-variant">
            The page did not load. Reloading usually fixes it, or you can search for a color below.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary hover:opacity-90"
          >
            Try again
          </button>

          <form action="/search" method="get" role="search" className="mx-auto mt-10 flex max-w-md gap-2">
            <label htmlFor="global-error-q" className="sr-only">Search paint colors</label>
            <input
              id="global-error-q"
              name="q"
              type="search"
              placeholder="Color name or number"
              className="min-w-0 flex-1 rounded-full border border-outline-variant bg-white px-4 py-3 text-on-surface"
            />
            <button type="submit" className="rounded-full border border-primary px-5 py-3 font-semibold text-primary hover:bg-primary hover:text-on-primary">
              Search
            </button>
          </form>

          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="font-semibold text-primary underline-offset-4 hover:underline">{l.label}</a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}

// Server-rendered A to Z index of every indexable color in one brand, names
// only, one closed <details> per letter. Its job is crawl depth: the paginated
// grid puts most colors many pages deep (Behr runs to 96), and a 2026-11-08 URL Inspection
// sample found 93 of 200 color pages never crawled. Here every color page is
// one link from its brand page. Each letter's list is one prebuilt HTML string
// of bare <li><a> tags, styled from the <ul>: with per-link React elements and
// classes, Behr's page went from 32 KB to 278 KB gzipped on the first preview.
// Plain <a>, not next/link, so opening a letter does not prefetch hundreds of pages.

interface IndexColor {
  name: string;
  slug: string;
  colorNumber: string | null;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function letterOf(name: string): string {
  const first = name.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

export function BrandColorIndex({ brandSlug, brandName, colors }: { brandSlug: string; brandName: string; colors: IndexColor[] }) {
  if (colors.length === 0) return null;
  // A name shared by two colors gets its number, so each link is distinct.
  const nameCount = new Map<string, number>();
  for (const c of colors) nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + 1);

  const groups = new Map<string, IndexColor[]>();
  for (const c of colors) {
    const l = letterOf(c.name);
    if (!groups.has(l)) groups.set(l, []);
    groups.get(l)!.push(c);
  }
  const letters = [...groups.keys()].sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));

  return (
    <section id="all-colors-a-z" className="py-16 px-6 md:px-12 bg-surface scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">{brandName} Colors A to Z</h2>
        <p className="text-on-surface-variant mb-8 max-w-2xl">
          Every {brandName} color by name, {colors.length.toLocaleString()} in all. Open a letter to see its colors.
        </p>
        <div className="space-y-2">
          {letters.map((l) => (
            <details key={l} className="group rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-3">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-headline font-bold text-on-surface">
                <span>{l === "#" ? "Numbers and symbols" : l} <span className="ml-1 text-sm font-normal text-on-surface-variant">({groups.get(l)!.length})</span></span>
                <span className="text-outline transition-transform group-open:rotate-180">&#9662;</span>
              </summary>
              <ul
                className="mt-3 columns-2 sm:columns-3 lg:columns-4 gap-6 text-sm leading-7 text-on-surface-variant [&>li]:break-inside-avoid [&_a:hover]:text-primary [&_a:hover]:underline"
                dangerouslySetInnerHTML={{
                  __html: groups.get(l)!.map((c) => {
                    const label = (nameCount.get(c.name) ?? 0) > 1 && c.colorNumber ? `${c.name} ${c.colorNumber}` : c.name;
                    return `<li><a href="/colors/${brandSlug}/${encodeURI(c.slug)}">${escapeHtml(label)}</a></li>`;
                  }).join(""),
                }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

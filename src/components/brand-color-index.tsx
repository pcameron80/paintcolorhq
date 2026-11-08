// Server-rendered A to Z list of every indexable color in one brand, names
// only, for /brands/[brandSlug]/colors-a-z. Each letter's list is one prebuilt
// HTML string of bare <li><a> tags styled from the <ul>: per-link React
// elements and classes more than doubled the page weight (Behr has ~5,700
// colors). Plain <a>, not next/link, so the page does not prefetch thousands.

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

const anchorOf = (l: string) => (l === "#" ? "other" : l.toLowerCase());

export function BrandColorIndex({ brandSlug, colors }: { brandSlug: string; colors: IndexColor[] }) {
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
    <section className="px-6 md:px-12 pb-20">
      <div className="max-w-7xl mx-auto">
        <nav aria-label="Jump to letter" className="sticky top-16 z-10 -mx-2 mb-8 flex flex-wrap gap-1 bg-surface/95 px-2 py-3 backdrop-blur">
          {letters.map((l) => (
            <a key={l} href={`#${anchorOf(l)}`} className="min-w-9 rounded-lg px-2 py-1.5 text-center text-sm font-headline font-bold text-primary hover:bg-surface-container-low">
              {l}
            </a>
          ))}
        </nav>
        <div className="space-y-10">
          {letters.map((l) => (
            <div key={l} id={anchorOf(l)} className="scroll-mt-32">
              <h2 className="font-headline text-2xl font-bold text-on-surface border-b border-outline-variant/20 pb-2">
                {l === "#" ? "Numbers and symbols" : l} <span className="ml-1 text-sm font-normal text-on-surface-variant">({groups.get(l)!.length})</span>
              </h2>
              <ul
                className="mt-4 columns-2 sm:columns-3 lg:columns-4 gap-6 text-sm leading-7 text-on-surface-variant [&>li]:break-inside-avoid [&_a:hover]:text-primary [&_a:hover]:underline"
                dangerouslySetInnerHTML={{
                  __html: groups.get(l)!.map((c) => {
                    const label = (nameCount.get(c.name) ?? 0) > 1 && c.colorNumber ? `${c.name} ${c.colorNumber}` : c.name;
                    return `<li><a href="/colors/${brandSlug}/${encodeURI(c.slug)}">${escapeHtml(label)}</a></li>`;
                  }).join(""),
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

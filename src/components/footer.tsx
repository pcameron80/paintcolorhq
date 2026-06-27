import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/15">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <div>
          <div className="font-headline font-bold text-lg text-on-surface">Paint Color HQ</div>
          <p className="text-xs text-on-surface-variant leading-relaxed mt-4">
            Architectural precision in every hue. Curating 26,000+ colors across 13 brands for modern spaces.
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href="https://www.linkedin.com/company/paint-color-hq"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Paint Color HQ on LinkedIn"
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.73v20.53C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.73C24 .78 23.2 0 22.22 0z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-headline text-[10px] uppercase font-bold text-on-surface mb-6 tracking-widest">Directory</h4>
          <ul className="space-y-3 text-xs text-on-surface-variant">
            {[
              { name: "Sherwin-Williams", slug: "sherwin-williams" },
              { name: "Benjamin Moore", slug: "benjamin-moore" },
              { name: "Behr", slug: "behr" },
              { name: "PPG", slug: "ppg" },
              { name: "Valspar", slug: "valspar" },
              { name: "Dunn-Edwards", slug: "dunn-edwards" },
              { name: "Farrow & Ball", slug: "farrow-ball" },
            ].map((brand) => (
              <li key={brand.slug}>
                <Link
                  href={`/brands/${brand.slug}`}
                  className="hover:text-primary underline-offset-4 hover:underline transition-all"
                >
                  {brand.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/brands" className="hover:text-primary underline-offset-4 hover:underline transition-all font-semibold">
                All 13 Brands
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-headline text-[10px] uppercase font-bold text-on-surface mb-6 tracking-widest">Tools</h4>
          <ul className="space-y-3 text-xs text-on-surface-variant">
            <li><Link href="/search" className="hover:text-primary underline-offset-4 hover:underline transition-all">Color Search</Link></li>
            <li><Link href="/compare" className="hover:text-primary underline-offset-4 hover:underline transition-all">Compare Colors</Link></li>
            <li><Link href="/tools/room-visualizer" className="hover:text-primary underline-offset-4 hover:underline transition-all">Room Visualizer</Link></li>
            <li><Link href="/tools/color-identifier" className="hover:text-primary underline-offset-4 hover:underline transition-all">Photo Color Identifier</Link></li>
            <li><Link href="/tools/palette-generator" className="hover:text-primary underline-offset-4 hover:underline transition-all">Palette Generator</Link></li>
            <li><Link href="/tools/paint-calculator" className="hover:text-primary underline-offset-4 hover:underline transition-all">Paint Calculator</Link></li>
            <li><Link href="/embed" className="hover:text-primary underline-offset-4 hover:underline transition-all">Embed Widget</Link></li>
            <li><Link href="/api" className="hover:text-primary underline-offset-4 hover:underline transition-all">Developer API</Link></li>
          </ul>

          <h4 className="font-headline text-[10px] uppercase font-bold text-on-surface mb-4 mt-8 tracking-widest">Resources</h4>
          <ul className="space-y-3 text-xs text-on-surface-variant">
            <li><Link href="/blog" className="hover:text-primary underline-offset-4 hover:underline transition-all">Blog</Link></li>
            <li><Link href="/inspiration" className="hover:text-primary underline-offset-4 hover:underline transition-all">Inspiration Palettes</Link></li>
            <li><Link href="/faq" className="hover:text-primary underline-offset-4 hover:underline transition-all">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-headline text-[10px] uppercase font-bold text-on-surface mb-6 tracking-widest">Company</h4>
          <ul className="space-y-3 text-xs text-on-surface-variant">
            <li><Link href="/about" className="hover:text-primary underline-offset-4 hover:underline transition-all">About</Link></li>
            <li><Link href="/methodology" className="hover:text-primary underline-offset-4 hover:underline transition-all">Methodology</Link></li>
            <li><Link href="/contact" className="hover:text-primary underline-offset-4 hover:underline transition-all">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-primary underline-offset-4 hover:underline transition-all">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary underline-offset-4 hover:underline transition-all">Terms of Service</Link></li>
          </ul>

          <h4 className="font-headline text-[10px] uppercase font-bold text-on-surface mb-4 mt-8 tracking-widest">Color Families</h4>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {[
              "White", "Off-White", "Gray", "Beige", "Neutral", "Brown", "Tan",
              "Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "Black",
            ].map((family) => (
              <Link
                key={family}
                href={`/colors/family/${family.toLowerCase()}`}
                className="text-[10px] text-on-surface-variant hover:text-primary transition-colors"
              >
                {family}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant/10 py-8 text-center">
        <p className="text-xs text-outline">
          &copy; {new Date().getFullYear()} Paint Color HQ. Color data is approximate. Always verify with physical samples before purchasing.
        </p>
      </div>
    </footer>
  );
}

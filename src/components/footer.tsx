import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/15">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <div>
          <div className="font-headline font-bold text-lg text-on-surface">Paint Color HQ</div>
          <p className="text-xs text-on-surface-variant leading-relaxed mt-4">
            Architectural precision in every hue. Curating 25,000+ colors across 14 brands for modern spaces.
          </p>
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
                All 14 Brands
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
            <li><Link href="/contact" className="hover:text-primary underline-offset-4 hover:underline transition-all">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-primary underline-offset-4 hover:underline transition-all">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary underline-offset-4 hover:underline transition-all">Terms of Service</Link></li>
          </ul>

          <h4 className="font-headline text-[10px] uppercase font-bold text-on-surface mb-4 mt-8 tracking-widest">Color Families</h4>
          <div className="flex flex-wrap gap-2">
            {["White", "Gray", "Beige", "Blue", "Green", "Red", "Yellow", "Black"].map((family) => (
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

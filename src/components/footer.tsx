import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Brands</h3>
            <ul className="mt-3 space-y-2">
              {[
                { name: "Sherwin-Williams", slug: "sherwin-williams" },
                { name: "Benjamin Moore", slug: "benjamin-moore" },
                { name: "Behr", slug: "behr" },
                { name: "PPG", slug: "ppg" },
                { name: "Dunn-Edwards", slug: "dunn-edwards" },
              ].map((brand) => (
                <li key={brand.slug}>
                  <Link
                    href={`/brands/${brand.slug}`}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    {brand.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Color Families
            </h3>
            <ul className="mt-3 space-y-2">
              {["White", "Gray", "Blue", "Green", "Beige"].map((family) => (
                <li key={family}>
                  <Link
                    href={`/colors/family/${family.toLowerCase()}`}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    {family} Paint Colors
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Resources</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/search"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Color Search
                </Link>
              </li>
              <li>
                <Link
                  href="/compare"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Compare Colors
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/paint-calculator"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Paint Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/color-identifier"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Photo Color Identifier
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/room-visualizer"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Room Visualizer
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-center text-xs text-gray-400">
            Paint Color HQ - Cross-brand paint color matching. Color data is
            approximate. Always verify with physical samples before purchasing.
          </p>
        </div>
      </div>
    </footer>
  );
}

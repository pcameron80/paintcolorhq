import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Brands</h3>
            <ul className="mt-3 space-y-2">
              {[
                { name: "Sherwin-Williams", slug: "sherwin-williams" },
                { name: "Benjamin Moore", slug: "benjamin-moore" },
                { name: "Behr", slug: "behr" },
                { name: "PPG", slug: "ppg" },
                { name: "Valspar", slug: "valspar" },
                { name: "Dunn-Edwards", slug: "dunn-edwards" },
                { name: "Farrow & Ball", slug: "farrow-ball" },
                { name: "Kilz", slug: "kilz" },
                { name: "Vista Paint", slug: "vista-paint" },
                { name: "Hirshfield's", slug: "hirshfields" },
                { name: "Colorhouse", slug: "colorhouse" },
                { name: "Dutch Boy", slug: "dutch-boy" },
                { name: "RAL", slug: "ral" },
                { name: "MPC", slug: "mpc" },
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
              {[
                "White",
                "Off-White",
                "Gray",
                "Beige",
                "Brown",
                "Blue",
                "Green",
                "Red",
                "Yellow",
                "Orange",
                "Purple",
                "Pink",
                "Black",
              ].map((family) => (
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
            <h3 className="text-sm font-semibold text-gray-900">Tools</h3>
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
                  href="/tools/room-visualizer"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Room Visualizer
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
                  href="/tools/palette-generator"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Palette Generator
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
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Resources</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/inspiration"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Inspiration Palettes
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Company</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Contact
                </Link>
              </li>
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
            &copy; {new Date().getFullYear()} Paint Color HQ. Color data is
            approximate. Always verify with physical samples before purchasing.
          </p>
        </div>
      </div>
    </footer>
  );
}

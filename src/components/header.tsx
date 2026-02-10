import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Paint Color HQ
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/brands"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Brands
          </Link>
          <Link
            href="/colors"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Colors
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}

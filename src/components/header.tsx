import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "./auth-button";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm" suppressHydrationWarning>
      <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-full">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.webp"
            alt="Paint Color HQ"
            width={140}
            height={33}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/brands"
            className="font-headline tracking-tight text-sm uppercase font-semibold text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Brands
          </Link>
          <Link
            href="/colors"
            className="font-headline tracking-tight text-sm uppercase font-semibold text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Colors
          </Link>
          <Link
            href="/inspiration"
            className="font-headline tracking-tight text-sm uppercase font-semibold text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Inspiration
          </Link>
          <Link
            href="/blog"
            className="font-headline tracking-tight text-sm uppercase font-semibold text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Blog
          </Link>
          <Link
            href="/tools"
            className="font-headline tracking-tight text-sm uppercase font-semibold text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Tools
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/search"
            className="flex items-center bg-surface-container-low px-4 py-2 rounded-xl group hover:bg-surface-container-lowest transition-all"
          >
            <svg className="h-4 w-4 text-outline mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span className="text-sm text-outline">Search colors...</span>
          </Link>
          <AuthButton />
        </div>

        {/* Mobile nav */}
        <MobileNav />
      </div>
      {/* Structural divider mark */}
      <div className="bg-surface-container-high h-1 w-12 mx-auto" />
    </header>
  );
}

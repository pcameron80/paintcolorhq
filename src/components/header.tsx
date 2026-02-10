import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

export async function Header() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Paint Color HQ"
            width={140}
            height={33}
            priority
          />
        </Link>

        {/* Desktop nav */}
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
            href="/inspiration"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Inspiration
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Blog
          </Link>
          <Link
            href="/tools"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Tools
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Search
          </Link>
          {user ? (
            <UserMenu
              email={user.email ?? ""}
              avatarUrl={user.user_metadata?.avatar_url ?? null}
            />
          ) : (
            <a
              href="/auth/login"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Sign in
            </a>
          )}
        </nav>

        {/* Mobile nav */}
        <MobileNav
          isLoggedIn={!!user}
          email={user?.email ?? null}
          avatarUrl={user?.user_metadata?.avatar_url ?? null}
        />
      </div>
    </header>
  );
}

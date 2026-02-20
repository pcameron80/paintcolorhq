"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const NAV_LINKS = [
  { href: "/brands", label: "Brands" },
  { href: "/colors", label: "Colors" },
  { href: "/inspiration", label: "Inspiration" },
  { href: "/blog", label: "Blog" },
  { href: "/tools", label: "Tools" },
  { href: "/search", label: "Search" },
  { href: "/dashboard", label: "My Projects" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (user) {
          setUser({
            email: user.email ?? "",
            avatarUrl: user.user_metadata?.avatar_url ?? null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // Close on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valid pattern: sync UI state with navigation
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-[57px] z-50 border-b border-gray-200 bg-white px-4 pb-6 pt-4 shadow-lg">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                if (link.href === "/dashboard" && (!user || authLoading)) return null;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2.5 text-base font-medium ${
                      pathname === link.href || pathname.startsWith(link.href + "/")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <hr className="my-4 border-gray-100" />

            {authLoading ? null : user ? (
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                    ) : (
                      user.email.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="truncate text-sm text-gray-600">{user.email}</span>
                </div>
                <a
                  href="/auth/logout"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </a>
              </div>
            ) : (
              <a
                href="/auth/login"
                className="block rounded-lg bg-brand-blue px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-blue-dark"
              >
                Sign in
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

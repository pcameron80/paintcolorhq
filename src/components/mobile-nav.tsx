"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/lib/use-auth-user";

const NAV_LINKS = [
  { href: "/brands", label: "Brands" },
  { href: "/match", label: "Match" },
  { href: "/colors", label: "Colors" },
  { href: "/inspiration", label: "Inspiration" },
  { href: "/blog", label: "Blog" },
  { href: "/tools", label: "Tools" },
  { href: "/search", label: "Search" },
  { href: "/dashboard", label: "My Projects" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, ready } = useAuthUser();
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Opening moves focus into the panel: it is portaled to <body>, so it sits
  // outside the header's tab order. Escape closes and returns focus to the toggle.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      {/* Hamburger button */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Overlay. Portaled to <body> because the header's backdrop-filter makes
          it the containing block for fixed children, which clipped the scrim to
          the header box. The scrim sits at z-40, under the z-50 header, so the
          toggle stays tappable. */}
      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-on-surface/20 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              id="mobile-menu"
              ref={panelRef}
              className="fixed inset-x-0 top-[var(--header-h)] z-50 max-h-[calc(100dvh-var(--header-h))] overflow-y-auto bg-white/95 backdrop-blur-md px-6 pb-8 pt-6 shadow-xl rounded-b-2xl lg:hidden"
            >
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => {
                  if (link.href === "/dashboard" && (!user || !ready)) return null;
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`rounded-xl px-4 py-3 font-headline text-sm uppercase font-semibold tracking-tight transition-all ${
                        isActive
                          ? "bg-surface-container-low text-primary"
                          : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="my-6 bg-surface-container-high h-1 w-12 mx-auto" />

              {!ready ? null : user ? (
                <div className="flex items-center justify-between px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high text-sm font-semibold text-on-surface">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        user.email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="truncate text-sm text-on-surface-variant">{user.email}</span>
                  </div>
                  <a
                    href="/auth/logout"
                    className="shrink-0 pl-3 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Sign out
                  </a>
                </div>
              ) : (
                <a
                  href="/auth/login"
                  className="block rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-3 text-center font-headline text-sm font-bold text-on-primary tracking-tight"
                >
                  Sign In
                </a>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

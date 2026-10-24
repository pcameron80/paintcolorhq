"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface UserMenuProps {
  email: string;
  avatarUrl: string | null;
}

export function UserMenu({ email, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape closes the menu and returns focus to the avatar button.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls="account-menu"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-300"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </button>

      {open && (
        <div
          id="account-menu"
          className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <p className="truncate px-4 py-2 text-xs text-gray-500">{email}</p>
          <hr className="border-gray-100" />
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            My Projects
          </Link>
          <a
            href="/auth/logout"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </a>
        </div>
      )}
    </div>
  );
}

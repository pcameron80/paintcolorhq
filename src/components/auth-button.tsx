"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { UserMenu } from "./user-menu";

export function AuthButton() {
  const [user, setUser] = useState<{
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (user) {
    return <UserMenu email={user.email} avatarUrl={user.avatarUrl} />;
  }

  return (
    <a
      href="/auth/login"
      className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark"
    >
      Sign in
    </a>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { UserMenu } from "./user-menu";

export function AuthButton() {
  const [user, setUser] = useState<{
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const [ready, setReady] = useState(false);

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
      .finally(() => setReady(true));
  }, []);

  // Always render the sign-in link as default — both server and client start with this
  // Once auth check completes, swap to UserMenu if logged in
  if (ready && user) {
    return <UserMenu email={user.email} avatarUrl={user.avatarUrl} />;
  }

  return (
    <a
      href="/auth/login"
      className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2 rounded-lg font-headline text-sm font-bold tracking-tight"
    >
      Sign in
    </a>
  );
}

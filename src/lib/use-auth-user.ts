"use client";

import { useEffect, useState } from "react";
import { hasSessionCookie } from "./auth-hint";

export interface AuthUser {
  id: string;
  email: string;
  avatarUrl: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  /** True once the auth check has finished (signed in or not). */
  ready: boolean;
}

// One lookup per page load, shared by every component that calls the hook.
// Sign-in and sign-out both go through full-page server routes (/auth/*), so
// the cached result never outlives the session it describes.
let userPromise: Promise<AuthUser | null> | null = null;

function loadAuthUser(): Promise<AuthUser | null> {
  if (userPromise) return userPromise;

  if (!hasSessionCookie()) {
    // Signed-out visitors never download the Supabase client (GoTrue, Realtime).
    userPromise = Promise.resolve(null);
    return userPromise;
  }

  userPromise = import("./supabase-browser")
    .then(({ createSupabaseBrowserClient }) =>
      createSupabaseBrowserClient().auth.getUser(),
    )
    .then(({ data: { user } }) =>
      user
        ? {
            id: user.id,
            email: user.email ?? "",
            avatarUrl:
              (user.user_metadata?.avatar_url as string | undefined) ?? null,
          }
        : null,
    )
    .catch(() => null);
  return userPromise;
}

export function useAuthUser(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, ready: false });

  useEffect(() => {
    let cancelled = false;
    loadAuthUser().then((user) => {
      if (!cancelled) setState({ user, ready: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

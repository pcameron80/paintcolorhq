import { createSupabaseServerClient } from "@/lib/supabase-server";

type MaybeUser = { email?: string | null } | null | undefined;

/**
 * Local-only escape hatch so the dashboard can be tested without a Google
 * login. Requires BOTH a development NODE_ENV and ADMIN_DEV_BYPASS=1.
 * `next build` / `next start` and Vercel always run with NODE_ENV=production,
 * so this is false there regardless of what env vars are set.
 */
export function isDevBypass(): boolean {
  return process.env.NODE_ENV === "development" && process.env.ADMIN_DEV_BYPASS === "1";
}

/** True when the user's email is in the comma-separated ADMIN_EMAILS list. */
export function isAdmin(user: MaybeUser): boolean {
  if (isDevBypass()) return true;
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email);
}

export type AdminCheck = "ok" | "anonymous" | "forbidden";

/** Resolves the session and classifies it. Pages redirect on "anonymous"; both 404 on "forbidden". */
export async function checkAdminSession(): Promise<AdminCheck> {
  if (isDevBypass()) return "ok";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "anonymous";
  return isAdmin(user) ? "ok" : "forbidden";
}

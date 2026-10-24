/**
 * Cheap, synchronous check for a Supabase session cookie in the browser.
 *
 * Mirrors the `sb-` prefix test in src/middleware.ts. @supabase/ssr writes its
 * auth cookies with httpOnly: false, so document.cookie can see them. A false
 * result means "definitely signed out"; a true result means "maybe signed in"
 * and still needs getUser() to confirm.
 */
export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith("sb-"));
}

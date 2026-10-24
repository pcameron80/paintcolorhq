// Validates a post-auth "next" redirect target so it can only point back into
// this site. Without it, /auth/callback?next=.evil.example builds
// `${origin}.evil.example` and sends a freshly signed-in user off-site.
//
// Rules: the value must be a root-relative path ("/..."), not protocol-relative
// ("//host") and not the backslash form ("/\host", which browsers treat as
// "//host"). It is then resolved against the origin and must stay on it.
// Returns path + search + hash, or the fallback.
export function safeNext(
  raw: string | null | undefined,
  origin: string,
  fallback = "/dashboard",
): string {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  // Control characters (tabs, newlines) are stripped by URL parsers and can
  // turn "/\t/evil.example" into "//evil.example".
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  let base: URL;
  let parsed: URL;
  try {
    base = new URL(origin);
    parsed = new URL(raw, base);
  } catch {
    return fallback;
  }
  if (parsed.origin !== base.origin) return fallback;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

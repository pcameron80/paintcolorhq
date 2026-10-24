// Attribution terms for the free color-match API, the MCP tool and the embed
// widget, plus the referrer normalization used to record which external sites
// use them (table api_referrers, migration 013). Pure module: no Supabase or
// Next imports, so it is unit-testable (attribution.test.ts) and safe to import
// from scripts.

export const ATTRIBUTION_URL = "https://www.paintcolorhq.com";
export const ATTRIBUTION_TEXT = "Cross-brand paint matching by PaintColorHQ";

// Added to free JSON responses as a new top-level field. Existing fields are
// untouched, so current consumers keep working.
export const ATTRIBUTION = {
  text: ATTRIBUTION_TEXT,
  url: ATTRIBUTION_URL,
  required:
    "Free use requires a visible link to https://www.paintcolorhq.com on the page that shows these results.",
} as const;

export const MAX_REFERRER_URL_LENGTH = 500;

export type ReferrerKind = "api" | "embed" | "mcp";

export interface NormalizedReferrer {
  url: string; // scheme://host[:port]/path, no query, fragment or credentials
  host: string; // lowercase hostname, no port
}

// Hosts that are ours or are local/private. Our own pages call the API on every
// color-picker change, and a local or private address can never be checked for
// credit; the checker also refuses to fetch them (it runs on a LAN machine).
export function isIgnoredHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!h) return true;
  if (h === "paintcolorhq.com" || h.endsWith(".paintcolorhq.com")) return true;
  // Only our own Vercel previews (project "paintcolorhq": paintcolorhq.vercel.app,
  // paintcolorhq-git-<branch>-<team>.vercel.app, paintcolorhq-<hash>-<team>.vercel.app).
  // Other *.vercel.app sites are real third parties and must be counted.
  if (/^paintcolorhq(-[a-z0-9-]+)?\.vercel\.app$/.test(h)) return true;
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (/\.(local|lan|internal|home|test|invalid|example)$/.test(h)) return true;
  if (!h.includes(".") && !h.includes(":")) return true; // single-label intranet name
  return isPrivateIp(h);
}

function isPrivateIp(h: string): boolean {
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (h.includes(":")) {
    // IPv6 literal. Loopback, unspecified, unique-local, link-local, mapped v4.
    return (
      h === "::1" ||
      h === "::" ||
      /^f[cd][0-9a-f]{0,2}:/.test(h) ||
      /^fe[89ab][0-9a-f]?:/.test(h) ||
      h.startsWith("::ffff:")
    );
  }
  return false;
}

// Normalize one Referer/Origin value. Returns null for missing, unparsable,
// non-http(s), ours, local or private values.
export function normalizeReferrer(raw: string | null | undefined): NormalizedReferrer | null {
  const value = raw?.trim();
  if (!value || value === "null") return null; // "null" = opaque origin (sandboxed iframe, file://)
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (isIgnoredHost(host)) return null;
  const url = `${u.protocol}//${u.host.toLowerCase()}${u.pathname || "/"}`;
  return { url: url.slice(0, MAX_REFERRER_URL_LENGTH), host };
}

// Referer first, Origin as fallback. If the Referer is present and points at an
// ignored host (our own site, localhost), the request is ours: do not fall back.
export function referrerFromHeaders(
  referer: string | null | undefined,
  origin: string | null | undefined,
): NormalizedReferrer | null {
  if (referer?.trim()) {
    const fromReferer = normalizeReferrer(referer);
    if (fromReferer) return fromReferer;
    try {
      if (isIgnoredHost(new URL(referer.trim()).hostname)) return null;
    } catch {
      // Unparsable Referer: try Origin below.
    }
  }
  return normalizeReferrer(origin);
}

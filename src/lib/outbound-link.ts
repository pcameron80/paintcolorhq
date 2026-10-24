// Classifies an outbound link for the retailer_click event. Pure, so the
// rules can be unit tested (outbound-link.test.ts).
//
// Until 2026-10-26 retailer_click fired only for a hand-kept list of retailer
// domains (Menards and Kilz were among those it missed), and wrote the link hostname into color_brand. Now every external http(s) link
// counts except share/social and our own hosts; the hostname goes to
// `retailer` and the color comes from the page the click happened on.

const SELF_HOSTS = ["paintcolorhq.com"];

// Share buttons and social profiles are not shopping clicks.
const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "twitter.com",
  "x.com",
  "t.co",
  "pinterest.com",
  "pin.it",
  "reddit.com",
  "linkedin.com",
  "instagram.com",
  "threads.net",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "wa.me",
  "whatsapp.com",
  "t.me",
  "telegram.me",
  "bsky.app",
];

function hostMatches(host: string, domains: string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

function stripWww(host: string): string {
  return host.replace(/^www\./, "");
}

/**
 * Affiliate networks wrap the store URL in a query parameter (CJ uses `url`,
 * Impact uses `u`). Returns the wrapped store URL when there is one.
 */
function unwrapAffiliate(url: URL): URL | null {
  for (const key of ["url", "u"]) {
    const v = url.searchParams.get(key);
    if (v && /^https?:\/\//i.test(v)) {
      try {
        return new URL(v);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export interface PageColor {
  color_brand?: string;
  color_slug?: string;
}

const COLOR_PAGE = /^\/colors\/([^/]+)\/([^/]+)\/?$/;
const MATCH_PAGE = /^\/match\/([^/]+)\/([^/]+)\/?$/;
const NOT_COLOR_SEGMENTS = new Set(["family", "hue"]);

/**
 * The color a click belongs to, from the page path: /colors/{brand}/{slug},
 * or the source color of /match/{brand}/{slug}-to-{targetBrand}.
 */
export function colorFromPagePath(path: string): PageColor {
  const c = path.match(COLOR_PAGE);
  if (c && !NOT_COLOR_SEGMENTS.has(c[1])) return { color_brand: c[1], color_slug: c[2] };
  const m = path.match(MATCH_PAGE);
  if (m && m[2] !== "to") {
    const at = m[2].lastIndexOf("-to-");
    if (at > 0) return { color_brand: m[1], color_slug: m[2].slice(0, at) };
  }
  return {};
}

export interface OutboundClick extends PageColor {
  outbound_url: string;
  retailer: string;
  affiliate: "true" | "false";
}

/**
 * Returns retailer_click params for a link, or null when the click is not an
 * outbound shopping or reference click (relative, non-http, our own host,
 * share or social).
 */
export function classifyOutboundLink(
  href: string,
  opts: { pagePath: string; pageHost: string; rel?: string | null },
): OutboundClick | null {
  let url: URL;
  try {
    url = new URL(href, `https://${opts.pageHost || "www.paintcolorhq.com"}`);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = stripWww(url.hostname.toLowerCase());
  const pageHost = stripWww((opts.pageHost || "").toLowerCase());
  if (!host || host === pageHost || hostMatches(host, SELF_HOSTS)) return null;
  if (hostMatches(host, SOCIAL_HOSTS)) return null;

  const wrapped = unwrapAffiliate(url);
  const retailer = wrapped ? stripWww(wrapped.hostname.toLowerCase()) : host;
  const sponsored = /(^|\s)sponsored(\s|$)/i.test(opts.rel ?? "");

  return {
    outbound_url: url.href,
    retailer,
    affiliate: sponsored || wrapped ? "true" : "false",
    ...colorFromPagePath(opts.pagePath),
  };
}

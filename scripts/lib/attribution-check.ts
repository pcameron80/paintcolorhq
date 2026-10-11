// Pure HTML checks for scripts/check-attribution.ts (tested in
// attribution-check.test.ts). Static HTML only: a link or iframe injected by
// client-side JavaScript is not seen, so "no credit" means "verify by hand".

export type CheckKind = "api" | "embed" | "mcp";

export interface CreditResult {
  hasCredit: boolean;
  note: string;
}

// <a ... href="https://www.paintcolorhq.com/anything"> (any quoting, http or
// https or protocol-relative, with or without www).
const LINK_RE =
  /<a\b[^>]*?\bhref\s*=\s*["']?\s*(?:https?:)?\/\/(?:www\.)?paintcolorhq\.com(?:[/?#"'\s>]|$)/i;

// <iframe ... src="https://www.paintcolorhq.com/embed...">
const EMBED_IFRAME_RE =
  /<iframe\b[^>]*?\bsrc\s*=\s*["']?\s*(?:https?:)?\/\/(?:www\.)?paintcolorhq\.com\/embed\b/i;

export function hasCreditLink(html: string): boolean {
  return LINK_RE.test(html);
}

export function hasEmbedIframe(html: string): boolean {
  return EMBED_IFRAME_RE.test(html);
}

export function detectCredit(html: string, kind: CheckKind): CreditResult {
  const link = hasCreditLink(html);
  if (kind === "embed") {
    // The widget carries its own credit link inside our iframe, so an
    // unmodified embed is sufficient.
    if (hasEmbedIframe(html)) return { hasCredit: true, note: "embed iframe found" };
    if (link) return { hasCredit: true, note: "link found, embed iframe not in static HTML" };
    return { hasCredit: false, note: "no embed iframe or link in static HTML" };
  }
  if (link) return { hasCredit: true, note: "link found" };
  return { hasCredit: false, note: "no link to paintcolorhq.com in static HTML" };
}

// True when the stored URL is only a site root. Browsers send just the origin
// on most cross-origin requests, so the page that actually uses us may be
// elsewhere on the site.
export function isOriginOnly(url: string): boolean {
  try {
    return new URL(url).pathname === "/";
  } catch {
    return false;
  }
}

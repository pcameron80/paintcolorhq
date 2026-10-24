import { NextResponse, after } from "next/server";
import { logUsageEvent, usageMetaFromRequest } from "@/lib/usage-log";
import { logReferrer } from "@/lib/referrer-log";
import { normalizeReferrer } from "@/lib/attribution";

// Beacon target for the embeddable widget (src/app/embed/match/match-widget.tsx).
// It reports the parent page that embedded the widget — the "who embedded the
// widget" signal for Stream A (distribution) in the adoption plan.
//
// Why a dedicated beacon: the widget runs inside an iframe served from our own
// origin, so its normal /api/color-match calls all carry paintcolorhq.com as the
// Referer. The embedding *host* site is only visible to the widget itself (via
// ancestorOrigins / document.referrer), which it posts here once per load.
//
// Fire-and-forget: returns 204 immediately; the insert runs after the response.
//
// This is also where embeds are recorded in api_referrers (kind 'embed') for
// the attribution checker. /embed/match itself is a static page served from
// the CDN, so no server code runs on the iframe load and its Referer is never
// seen; the beacon is the one per-load server hit that knows the parent page.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_HOSTS = new Set(["www.paintcolorhq.com", "paintcolorhq.com"]);

function headerHost(value: string | null): string | null {
  if (!value || value === "null") return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// The claimed host is only trusted when the browser's own Origin or Referer
// vouches for the request. Two shapes pass: the normal beacon from our iframe
// (Origin/Referer is this site, which a third-party page cannot forge), or a
// request whose Origin/Referer already is the claimed host. A cross-site POST
// that names some other site as the embedder fails both and is logged without
// a host, so it cannot plant fake embed attributions.
function vouchedHost(request: Request, claimed: string | null): boolean {
  const claimedHost = headerHost(claimed);
  if (!claimedHost) return false;
  let ownHost: string | null = null;
  try {
    ownHost = new URL(request.url).hostname.toLowerCase();
  } catch {
    // no own host
  }
  const seen = [headerHost(request.headers.get("origin")), headerHost(request.headers.get("referer"))];
  return seen.some((h) => h !== null && (h === claimedHost || SITE_HOSTS.has(h) || h === ownHost));
}

export async function POST(request: Request) {
  let host: string | null = null;
  let page: string | null = null;
  try {
    // sendBeacon may deliver the body as text/plain — parse defensively.
    const text = await request.text();
    if (text) {
      const body = JSON.parse(text);
      if (body && typeof body.host === "string") host = body.host.slice(0, 1024);
      if (body && typeof body.page === "string") page = body.page.slice(0, 1024);
    }
  } catch {
    // Malformed beacon — still log the request meta below.
  }

  if (!vouchedHost(request, host)) {
    host = null;
    page = null;
  }

  after(() => logUsageEvent({ source: "embed", host, ...usageMetaFromRequest(request) }));

  // Prefer the full page URL, but only when it is on the same site as `host`.
  const hostRef = normalizeReferrer(host);
  const pageRef = normalizeReferrer(page);
  const ref = pageRef && hostRef && pageRef.host === hostRef.host ? pageRef : hostRef;
  if (ref) after(() => logReferrer("embed", ref));
  return new NextResponse(null, { status: 204 });
}

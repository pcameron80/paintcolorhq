import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Old-slug → canonical-slug map written by scripts/dedupe-colors.ts when
// duplicate color rows (dual numbering systems, import dupes) are consolidated.
// These must stay deployed as long as the old URLs have inbound links/index
// entries — the rows they pointed at are deleted from the DB.
const colorRedirects: Record<string, string> = JSON.parse(
  readFileSync(join(process.cwd(), "src/data/color-redirects.json"), "utf8"),
);

// Page CSP for everything outside /embed. Ad stacks (Journey by Mediavine is
// the planned one) pull scripts, frames, workers and beacons from a changing
// set of exchanges and CDNs, so a host allowlist silently blocks them: the
// old allowlist below blocked 9 of 9 Journey probes. This policy restricts by
// scheme instead (https only, plus data:/blob: where ad creatives need them)
// and keeps the directives that matter without a host list: no plugins, no
// <base> hijack, same-origin form posts, and no framing by other sites.
// No upgrade-insecure-requests: block-all-mixed-content refuses http
// subresources outright rather than rewriting them.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src https: data: blob:",
  "media-src 'self' https: data: blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "block-all-mixed-content",
].join("; ");

// Host-allowlist CSP, used only as the base of the /embed policy below. The
// embed widget runs inside other sites' pages and loads no ads, so it keeps
// the tight list. Fonts are self-hosted via next/font (Manrope + Inter, see
// app/layout.tsx), so fonts.googleapis.com/gstatic.com are not needed here.
const strictContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://adservice.google.com https://*.adtrafficquality.google https://va.vercel-scripts.com https://s.pinimg.com https://*.pinterest.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.adtrafficquality.google https://vitals.vercel-insights.com https://ct.pinterest.com https://challenges.cloudflare.com",
  "frame-src https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.adtrafficquality.google https://www.google.com https://challenges.cloudflare.com https://*.pinterest.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  // X-Frame-Options removed — the CSP `frame-ancestors 'self'` directive is the
  // modern equivalent and supersedes it in all current browsers.
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// The /embed/* routes are meant to be iframed on third-party sites (the free
// cross-brand match widget — a link/citation engine). They get the strict
// host-allowlist policy above with two changes; every other security header
// matches the page headers. The global rule below excludes /embed/ so this is
// the only CSP that applies there (duplicate CSP headers would intersect to the
// strictest).
// frame-ancestors * → third-party sites can iframe the widget.
// frame-src adds 'self' → the /embed landing page can iframe its own
// /embed/match live preview (the strict frame-src lists only third-party
// hosts, no 'self', which would otherwise block the same-origin preview).
const embedContentSecurityPolicy = strictContentSecurityPolicy
  .replace("frame-ancestors 'self'", "frame-ancestors *")
  .replace("frame-src ", "frame-src 'self' ");
const embedSecurityHeaders = securityHeaders.map((h) =>
  h.key === "Content-Security-Policy" ? { ...h, value: embedContentSecurityPolicy } : h,
);

const nextConfig: NextConfig = {
  // Frozen at build time (this file evaluates once per build) so sitemap
  // lastmod values reflect the actual deploy date instead of resetting to
  // "today" on every ISR cold-start — which Googlebot reads as false freshness.
  env: {
    SITE_BUILD_DATE: new Date().toISOString().split("T")[0],
  },
  // Suppress the X-Powered-By: Next.js fingerprinting header.
  poweredByHeader: false,
  htmlLimitedBots:
    /Mediapartners-Google|AdsBot-Google|Googlebot|Google-InspectionTool|Google-PageRenderer|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|bingbot|BingPreview|msnbot|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|Bytespider|SeznamBot|Pinterestbot|PetalBot|WhatsApp|AhrefsBot|AhrefsSiteAudit|SemrushBot|DotBot|MJ12bot|Screaming Frog|Sitebulb|DeepCrawl|OnCrawl|Bloodhound/i,
  images: {
    // OG/swatch images generated by /api/og and /api/pin are deterministic
    // by hex + name params, but without a TTL Vercel re-processes them every
    // 60 seconds. 24h is appropriate — the underlying inputs don't change.
    minimumCacheTTL: 86400,
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
  async redirects() {
    return [
      // Non-www → www redirect lives in vercel.json (the Vercel edge layer
      // processes those before Next.js rewrites, so a redirect here is dead
      // code). Keeping the path-level redirects below since vercel.json
      // doesn't carry them.
      {
        source: "/colors/family/taupe",
        destination: "/colors/family/beige",
        permanent: true,
      },
      // No /blog?tag= case redirects: on Vercel the `has` values matched
      // regardless of case, so ?tag=design matched the "Design" rule and 308ed
      // to itself (ERR_TOO_MANY_REDIRECTS). The blog page already filters tags
      // case-insensitively, so every casing renders without a redirect.
      // MPC (Matthews Paint) removed 2026-06: sign/metal coatings, not
      // homeowner wall paint. ~2 Google clicks in 3 months across 1,419 pages.
      {
        source: "/colors/mpc/:path*",
        destination: "/brands",
        permanent: true,
      },
      {
        source: "/brands/mpc",
        destination: "/brands",
        permanent: true,
      },
      {
        source: "/match/mpc/:path*",
        destination: "/brands",
        permanent: true,
      },
      {
        source: "/match/:brand/to/mpc",
        destination: "/brands",
        permanent: true,
      },
      // Journey by Mediavine ads.txt, install day. public/ads.txt is served
      // unchanged until then. If the dashboard gives an ads.txt URL rather
      // than a file, add this as the FIRST entry of this list (statusCode,
      // never permanent: true) and delete public/ads.txt from the repo:
      //   { source: "/ads.txt", destination: "<ADS_TXT_URL from Journey>", statusCode: 301 },
      // Retired 2026-10-29: 2025-only trend and popularity posts whose
      // claims could not be sourced. Each points to its 2026 successor.
      {
        source: "/blog/2025-colors-of-the-year-every-brand-compared",
        destination: "/blog/2026-colors-of-the-year-every-brand-compared",
        permanent: true,
      },
      {
        source: "/blog/most-popular-paint-colors-2025",
        destination: "/blog/paint-color-trends-2026",
        permanent: true,
      },
      // Deduped color rows: old slug → canonical slug (161 entries).
      ...Object.entries(colorRedirects).map(([from, to]) => ({
        source: `/colors/${from}`,
        destination: `/colors/${to}`,
        permanent: true,
      })),
    ];
  },
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
      {
        source: "/sitemap/:id.xml",
        destination: "/api/sitemap/:id",
      },
    ];
  },
  async headers() {
    return [
      {
        // Embed routes excluded here — they get the permissive frame-ancestors
        // CSP below so they can be iframed on third-party sites.
        source: "/((?!api/|_next/static/|_next/image/|favicon.ico|embed/).*)",
        headers: securityHeaders,
      },
      {
        source: "/embed/:path*",
        headers: embedSecurityHeaders,
      },
      {
        // Room visualizer photos and masks. scripts/export-rooms.py puts a content
        // hash in every file name, so a changed file is a new URL and these can be
        // cached for a year without revalidating.
        source: "/rooms/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;

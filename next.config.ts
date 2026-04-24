import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://adservice.google.com https://*.adtrafficquality.google https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.adtrafficquality.google https://vitals.vercel-insights.com",
  "frame-src https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.adtrafficquality.google https://www.google.com",
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
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
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

const nextConfig: NextConfig = {
  htmlLimitedBots:
    /Mediapartners-Google|AdsBot-Google|Googlebot|Google-InspectionTool|Google-PageRenderer|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|bingbot|BingPreview|msnbot|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|Bytespider|SeznamBot|Pinterestbot|PetalBot|WhatsApp|AhrefsBot|AhrefsSiteAudit|SemrushBot|DotBot|MJ12bot|Screaming Frog|Sitebulb|DeepCrawl|OnCrawl|Bloodhound/i,
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "paintcolorhq.com" }],
        destination: "https://www.paintcolorhq.com/:path*",
        permanent: true,
      },
      {
        source: "/colors/family/taupe",
        destination: "/colors/family/beige",
        permanent: true,
      },
      {
        source: "/blog",
        has: [{ type: "query", key: "tag", value: "Design" }],
        destination: "/blog?tag=design",
        permanent: true,
      },
      {
        source: "/blog",
        has: [{ type: "query", key: "tag", value: "Guide" }],
        destination: "/blog?tag=guide",
        permanent: true,
      },
      {
        source: "/blog",
        has: [{ type: "query", key: "tag", value: "Trends" }],
        destination: "/blog?tag=trends",
        permanent: true,
      },
      {
        source: "/blog",
        has: [{ type: "query", key: "tag", value: "Tips" }],
        destination: "/blog?tag=tips",
        permanent: true,
      },
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
        source: "/((?!api/|_next/static/|_next/image/|favicon.ico).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

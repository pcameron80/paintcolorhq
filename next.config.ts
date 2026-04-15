import type { NextConfig } from "next";

const securityHeaders = [
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

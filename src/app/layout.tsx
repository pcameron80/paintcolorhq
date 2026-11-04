import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AdScripts } from "@/components/ad-scripts";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { PlausibleScript } from "@/components/plausible-script";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { ogDefaults } from "@/lib/og";
import { BRAND_COUNT, moreBrands } from "@/lib/site-facts";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const DEFAULT_TITLE = `Match Any Paint Color Across ${BRAND_COUNT} Brands | Paint Color HQ`;

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Paint Color HQ",
  },
  description:
    `Free paint color cross-reference tool. Match any color across Sherwin-Williams, Benjamin Moore, Behr & ${moreBrands(3)} more brands. 26,000+ colors with room visualizer & photo color identifier.`,
  metadataBase: new URL("https://www.paintcolorhq.com"),
  // No og:url here: a default url made every page without its own openGraph
  // (the tool pages, for one) share as the homepage. Pages set their own url.
  openGraph: {
    ...ogDefaults,
    title: DEFAULT_TITLE,
    description:
      `Free paint color cross-reference tool. Match any color across Sherwin-Williams, Benjamin Moore, Behr & ${moreBrands(3)} more brands. 26,000+ colors with room visualizer, photo color identifier & paint calculator.`,
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="impact-site-verification" content="dc26e305-732b-490f-9212-85e5f25c94b7" />
        {/* Home Depot (Impact) application, 2026-10-11. Impact's snippet uses a
            non-standard value= attribute; content= is kept for HTML validity. */}
        <meta
          name="impact-site-verification"
          content="d6fa03b1-639b-4026-9f31-bd376b5dee44"
          {...{ value: "d6fa03b1-639b-4026-9f31-bd376b5dee44" }}
        />
        {/* hero.webp preload removed from root layout — Next.js auto-generates
            it from the <Image priority> on the homepage only. Keeping the manual
            preload here fired the LCP hint on every page in the app, including
            color/brand/family routes that never render hero.webp. */}
        <link rel="help" type="text/plain" href="/llms.txt" />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        {children}
        <CookieConsent />
        {/* AnalyticsProvider must stay after CookieConsent (the gtag scripts);
            WebVitalsReporter goes after both. */}
        <AnalyticsProvider />
        <WebVitalsReporter />
        <PlausibleScript />
        {/* Journey by Mediavine. Renders nothing until the dashboard values in
            src/lib/mediavine.ts are filled in, and never on /embed, /admin,
            /dashboard, /auth or /search. Last so the order above is unchanged. */}
        <AdScripts />
      </body>
    </html>
  );
}

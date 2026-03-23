import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Manrope } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Match Any Paint Color Across 14 Brands | Paint Color HQ",
    template: "%s | Paint Color HQ",
  },
  description:
    "Free paint color cross-reference tool. Match any color across Sherwin-Williams, Benjamin Moore, Behr & 11 more brands. 25,000+ colors with room visualizer & photo color identifier.",
  metadataBase: new URL("https://www.paintcolorhq.com"),
  openGraph: {
    type: "website",
    siteName: "Paint Color HQ",
    title: "Match Any Paint Color Across 14 Brands | Paint Color HQ",
    description:
      "Free paint color cross-reference tool. Match any color across Sherwin-Williams, Benjamin Moore, Behr & 11 more brands. 25,000+ colors with room visualizer, photo color identifier & paint calculator.",
    images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
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
        <link
          rel="preload"
          as="image"
          href="/hero.webp"
          fetchPriority="high"
        />
        <link rel="help" type="text/plain" href="/llms.txt" />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-056NR93JLK"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Tag internal traffic for GA4 data filter
            var isInternal = (
              location.hostname === 'localhost' ||
              location.hostname === '127.0.0.1' ||
              location.hostname.endsWith('.vercel.app') ||
              location.search.indexOf('debug=true') !== -1
            );

            gtag('config', 'G-056NR93JLK', isInternal ? {
              traffic_type: 'internal'
            } : {});
          `}
        </Script>
        <AnalyticsProvider />
        {/* AdSense script moved to per-page inclusion via <AdSenseScript /> component.
            Only loaded on high-content pages (blog, brands, tools, homepage).
            Excluded from color pages until content is enriched. */}
      </body>
    </html>
  );
}

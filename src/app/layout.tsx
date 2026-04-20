import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CookieConsent } from "@/components/cookie-consent";
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
  verification: {
    other: { "impact-site-verification": ["dc26e305-732b-490f-9212-85e5f25c94b7"] },
  },
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
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        {children}
        <CookieConsent />
        <AnalyticsProvider />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Paint Color HQ - Match Colors Across 14 Paint Brands | Free Tools",
    template: "%s | Paint Color HQ",
  },
  description:
    "Match paint colors across Sherwin-Williams, Benjamin Moore, Behr & 11 more brands. Free room visualizer, photo color identifier, palette generator & paint calculator. 25,000+ colors.",
  metadataBase: new URL("https://www.paintcolorhq.com"),
  openGraph: {
    type: "website",
    siteName: "Paint Color HQ",
    title: "Paint Color HQ - Match Colors Across 14 Paint Brands | Free Tools",
    description:
      "Match paint colors across Sherwin-Williams, Benjamin Moore, Behr & 11 more brands. Free room visualizer, photo color identifier, palette generator & paint calculator.",
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
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
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
            gtag('config', 'G-056NR93JLK');
          `}
        </Script>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6269963973031881"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}

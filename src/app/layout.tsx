import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Paint Color HQ - Paint Color Inspiration & Palettes",
    template: "%s | Paint Color HQ",
  },
  description:
    "Explore 25,000+ paint colors, discover curated palettes, and find the perfect color scheme for your next project. Browse Sherwin-Williams, Benjamin Moore, Behr, and more.",
  metadataBase: new URL("https://paintcolorhq.com"),
  openGraph: {
    type: "website",
    siteName: "Paint Color HQ",
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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1310166469057795"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

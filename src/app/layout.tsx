import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Paint Color HQ - Cross-Brand Paint Color Matching",
    template: "%s | Paint Color HQ",
  },
  description:
    "Find equivalent paint colors across brands. Match Sherwin-Williams, Benjamin Moore, Behr, and more. Browse 25,000+ colors with hex codes, RGB, and LRV values.",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

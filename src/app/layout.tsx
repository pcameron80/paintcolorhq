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
    title: "Paint Color HQ - Paint Color Inspiration & Palettes",
    description:
      "Explore 25,000+ paint colors, discover curated palettes, and find the perfect color scheme for your next project.",
  },
  twitter: {
    card: "summary_large_image",
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
          src="https://www.googletagmanager.com/gtag/js?id=G-056NR93JLK"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-056NR93JLK');
            `,
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6269963973031881"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

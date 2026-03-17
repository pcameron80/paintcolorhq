"use client";

import Script from "next/script";

/**
 * AdSense script loader — only include on pages with substantial content.
 * Excluded from color pages (template-heavy, single paragraph descriptions)
 * until color page content is enriched.
 *
 * Include this component in: blog posts, brand pages, tool pages, homepage,
 * about, FAQ, inspiration pages.
 */
export function AdSenseScript() {
  return (
    <Script
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6269963973031881"
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}

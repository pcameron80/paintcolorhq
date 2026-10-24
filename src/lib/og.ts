// Open Graph defaults. Next.js replaces the root layout's openGraph object
// wholesale when a page sets its own, so a page that sets openGraph without
// these loses og:type, og:site_name and og:image. Spread ogDefaults first,
// then set the page's title, description and canonical url.

export const OG_IMAGE = { url: "/og-image.webp", width: 1200, height: 630 };

export const ogDefaults = {
  type: "website" as const,
  siteName: "Paint Color HQ",
  locale: "en_US",
  images: [OG_IMAGE],
};

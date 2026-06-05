// Affiliate / sample-purchase links for color pages.
//
// Affiliate IDs are read from env vars — nothing is hardcoded, so no secrets are
// committed. When an ID isn't set, the link falls back to the plain (unmonetized
// but still useful) destination, so a link is never broken or missing. The day
// you add the IDs in Vercel, the same links start earning — no code change.
//
// Env (set in Vercel → Project → Settings → Environment Variables; NOT committed):
//   NEXT_PUBLIC_SAMPLIZE_AFFILIATE_PREFIX
//     Your ShareASale (or other network) deep-link prefix, ending right before
//     the target URL — e.g.
//     "https://shareasale.com/r.cfm?b=<bannerId>&u=<yourAffId>&m=<samplizeMerchantId>&urllink="
//     The encoded Samplize URL is appended to it.
//   NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG
//     Amazon Associates store tag. Optional — defaults to the portfolio's
//     active "greatpickdeal-20" when unset.
//   NEXT_PUBLIC_HOMEDEPOT_AFFILIATE_PREFIX
//     Home Depot affiliate (Impact) deep-link prefix ending right before the
//     target URL — the existing homedepot.com link is appended, URL-encoded.
//   NEXT_PUBLIC_LOWES_AFFILIATE_PREFIX
//     Lowe's affiliate (Impact/CJ) deep-link prefix, same format.
// Note: Sherwin-Williams and Benjamin Moore have no consumer affiliate program
// (they sell through their own stores / dealers) — those brand links stay plain;
// Samplize captures that purchase intent instead.

export interface SampleLink {
  label: string;
  url: string;
  /** true once an affiliate ID is configured for this destination */
  affiliate: boolean;
  /** render as the prominent primary CTA */
  primary?: boolean;
}

interface SampleInfo {
  brandSlug: string;
  colorSlug: string;
  brandName: string;
  colorName: string;
  colorNumber?: string | null;
}

/** Brands Samplize actually stocks peel-and-stick samples for. */
const SAMPLIZE_BRANDS = new Set(["sherwin-williams", "benjamin-moore", "farrow-ball"]);

const SAMPLIZE_PREFIX = process.env.NEXT_PUBLIC_SAMPLIZE_AFFILIATE_PREFIX;
// Amazon Associates tag. Defaults to the portfolio's active greatpickdeal-20.
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || "greatpickdeal-20";
const HOMEDEPOT_PREFIX = process.env.NEXT_PUBLIC_HOMEDEPOT_AFFILIATE_PREFIX;
const LOWES_PREFIX = process.env.NEXT_PUBLIC_LOWES_AFFILIATE_PREFIX;

/** True when at least one affiliate program is configured — gates the FTC disclosure. */
export const AFFILIATE_ENABLED = Boolean(
  SAMPLIZE_PREFIX || AMAZON_TAG || HOMEDEPOT_PREFIX || LOWES_PREFIX
);

/**
 * Wrap an existing retailer URL in an affiliate deep-link when a program is
 * configured for that retailer. Returns the plain URL + affiliate:false otherwise,
 * so a missing ID never breaks a link. Used on the "Buy at …" retailer links.
 */
export function affiliatizeRetailer(url: string): { url: string; affiliate: boolean } {
  if (HOMEDEPOT_PREFIX && url.includes("homedepot.com")) {
    return { url: `${HOMEDEPOT_PREFIX}${encodeURIComponent(url)}`, affiliate: true };
  }
  if (LOWES_PREFIX && url.includes("lowes.com")) {
    return { url: `${LOWES_PREFIX}${encodeURIComponent(url)}`, affiliate: true };
  }
  if (AMAZON_TAG && url.includes("amazon.com")) {
    const sep = url.includes("?") ? "&" : "?";
    return { url: `${url}${sep}tag=${AMAZON_TAG}`, affiliate: true };
  }
  return { url, affiliate: false };
}

export function getSampleLinks(info: SampleInfo): SampleLink[] {
  const query = [info.brandName, info.colorName].filter(Boolean).join(" ");
  const links: SampleLink[] = [];

  // Samplize — peel-and-stick samples. Only Sherwin-Williams, Benjamin Moore,
  // and Farrow & Ball are stocked, and we deep-link straight to the color's
  // product page (e.g. agreeable-gray-7029-12x12) — the highest-intent next
  // step. The slug matches our colorSlug exactly (verified across all 3 brands).
  if (SAMPLIZE_BRANDS.has(info.brandSlug) && info.colorSlug) {
    const samplizeTarget = `https://samplize.com/products/${info.colorSlug}-12x12`;
    links.push({
      label: "Order a peel-and-stick sample",
      url: SAMPLIZE_PREFIX ? `${SAMPLIZE_PREFIX}${encodeURIComponent(samplizeTarget)}` : samplizeTarget,
      affiliate: Boolean(SAMPLIZE_PREFIX),
      primary: true,
    });
  }

  // Amazon — sample pots, swatch cards, and painting supplies (all brands),
  // tagged with the portfolio's active greatpickdeal-20 Associates tag.
  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(`${query} paint sample`)}&tag=${AMAZON_TAG}`;
  links.push({
    label: "Samples & supplies on Amazon",
    url: amazonUrl,
    affiliate: true,
  });

  return links;
}

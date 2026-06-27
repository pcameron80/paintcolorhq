// Affiliate / sample-purchase links for color pages.
//
// Affiliate IDs are read from env vars — nothing is hardcoded, so no secrets are
// committed. When an ID isn't set, the link falls back to the plain (unmonetized
// but still useful) destination, so a link is never broken or missing. The day
// you add the IDs in Vercel, the same links start earning — no code change.
//
// Env (set in Vercel → Project → Settings → Environment Variables; NOT committed):
//   NEXT_PUBLIC_SAMPLIZE_AFFILIATE_PREFIX
//     Samplize runs on CJ Affiliate (Commission Junction), 12% commission,
//     30-day cookie. This is your CJ deep-link prefix, ending in "?url=" — e.g.
//     "https://www.jdoqocy.com/click-<PID>-<AID>?url="
//     (the CJ redirect domain — jdoqocy/anrdoezrs/kqzyfj/tkqlhce — is
//     interchangeable; PID = your website ID, AID = a deep-link-enabled link).
//     The URL-encoded Samplize product URL is appended, then "&sid=<colorSlug>"
//     for per-color attribution in CJ Insights. Pull a real link from CJ → Links
//     → Tools → Deep Link Generator (or Links → Search → Samplize → Get Code →
//     Click URL).
//   NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG
//     Amazon Associates store tag. Optional — defaults to the portfolio's
//     active "greatpickdeal-20" when unset.
//   NEXT_PUBLIC_HOMEDEPOT_AFFILIATE_PREFIX
//     Home Depot affiliate (Impact) deep-link prefix ending right before the
//     target URL — the existing homedepot.com link is appended, URL-encoded.
//   NEXT_PUBLIC_LOWES_AFFILIATE_PREFIX
//     Lowe's affiliate (Impact/CJ) deep-link prefix, same format.
//   NEXT_PUBLIC_ACE_AFFILIATE_PREFIX
//     Ace Hardware affiliate deep-link prefix, same format. Ace stocks Benjamin
//     Moore, so BM colors route their buy CTA to an Ace search (BM .com stays as
//     the "View official color" reference).
// Note: Sherwin-Williams has no consumer affiliate program (own stores) — its
// brand link stays plain and Samplize captures that purchase intent instead.

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
  /**
   * Whether a live Samplize product page exists for this color (colors.samplize_available).
   * Samplize's catalog is not a superset of ours — ~1/3 of our SW colors 404 — so the
   * sample CTA is rendered only when this is true, never blindly. null/undefined =
   * unchecked → CTA hidden (fail safe, no 404). Populated by check-samplize-availability.ts.
   */
  samplizeAvailable?: boolean | null;
  /**
   * Exact samplize.com product handle, used verbatim when it differs from the
   * default `<colorSlug>-12x12` (size-variant `-9x1475` or accent/spelling colors
   * the URL crawl couldn't guess — recovered from the CJ feed). When null/absent,
   * the CTA falls back to `<colorSlug>-12x12`. From colors.samplize_handle.
   */
  samplizeHandle?: string | null;
}

/** Brands Samplize actually stocks peel-and-stick samples for. */
const SAMPLIZE_BRANDS = new Set(["sherwin-williams", "benjamin-moore", "farrow-ball"]);

const SAMPLIZE_PREFIX = process.env.NEXT_PUBLIC_SAMPLIZE_AFFILIATE_PREFIX;
// Amazon Associates tag. Defaults to the portfolio's active greatpickdeal-20.
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || "greatpickdeal-20";
const HOMEDEPOT_PREFIX = process.env.NEXT_PUBLIC_HOMEDEPOT_AFFILIATE_PREFIX;
const LOWES_PREFIX = process.env.NEXT_PUBLIC_LOWES_AFFILIATE_PREFIX;
const ACE_PREFIX = process.env.NEXT_PUBLIC_ACE_AFFILIATE_PREFIX;

/** True when at least one affiliate program is configured — gates the FTC disclosure. */
export const AFFILIATE_ENABLED = Boolean(
  SAMPLIZE_PREFIX || AMAZON_TAG || HOMEDEPOT_PREFIX || LOWES_PREFIX || ACE_PREFIX
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
  if (ACE_PREFIX && url.includes("acehardware.com")) {
    return { url: `${ACE_PREFIX}${encodeURIComponent(url)}`, affiliate: true };
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

  // Samplize — peel-and-stick samples (CJ Affiliate, 12%). Only Sherwin-Williams,
  // Benjamin Moore, and Farrow & Ball are stocked, and the product slug matches
  // our colorSlug exactly (verified across all 3 brands), so we deep-link straight
  // to the color's page (e.g. agreeable-gray-7029-12x12) — the highest-intent next
  // step. BUT Samplize's catalog is not a superset of ours, so we render this CTA
  // ONLY when a live product page is confirmed (samplizeAvailable === true);
  // otherwise the page falls back to its Amazon/brand CTAs instead of deep-linking
  // to a 404. See colors.samplize_available / check-samplize-availability.ts.
  if (SAMPLIZE_BRANDS.has(info.brandSlug) && info.colorSlug && info.samplizeAvailable === true) {
    // Use the exact feed handle when present, else the default `<slug>-12x12`.
    const handle = info.samplizeHandle || `${info.colorSlug}-12x12`;
    const samplizeTarget = `https://samplize.com/products/${handle}`;
    // CJ deep link: prefix ends in "?url=", so append the encoded destination,
    // then "&sid=<colorSlug>" so CJ Insights shows which colors drive sales.
    const url = SAMPLIZE_PREFIX
      ? `${SAMPLIZE_PREFIX}${encodeURIComponent(samplizeTarget)}&sid=${encodeURIComponent(info.colorSlug)}`
      : samplizeTarget;
    links.push({
      label: "Order a peel-and-stick sample",
      url,
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

/**
 * Samplize's evergreen tiered bundle offer (CJ link 15736719). Surfaced on
 * multi-color pages (compare, inspiration, palette generator, room visualizer) to
 * nudge sampling several colors at once — bigger basket, and genuinely better for
 * comparing. Single source of truth: update the copy here, or remove this export's
 * usages, if Samplize changes the offer. Factual/no-urgency by design.
 */
export const SAMPLIZE_OFFER = {
  short: "buy 8 peel-and-stick samples, get 2 free",
  tiers: "8 samples → 2 free · 12 → 3 free · 20 → 3 free + free shipping",
};

/**
 * Generic Samplize "shop all samples" link for multi-color contexts (where we
 * can't deep-link one specific color), with a per-surface SID for CJ attribution.
 * Affiliate-wrapped when NEXT_PUBLIC_SAMPLIZE_AFFILIATE_PREFIX is set, else plain.
 */
export function getSamplizeShopLink(sid: string): { url: string; affiliate: boolean } {
  const target = "https://samplize.com/pages/shop/samples/";
  if (!SAMPLIZE_PREFIX) return { url: target, affiliate: false };
  return {
    url: `${SAMPLIZE_PREFIX}${encodeURIComponent(target)}&sid=${encodeURIComponent(sid)}`,
    affiliate: true,
  };
}

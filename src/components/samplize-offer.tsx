import { SAMPLIZE_OFFER, getSamplizeShopLink, AFFILIATE_ENABLED } from "@/lib/affiliate";

interface SamplizeOfferProps {
  /** Per-surface id for CJ SID attribution, e.g. "inspiration", "room-visualizer". */
  sid: string;
  /** Lead-in tailored to the surface, e.g. "Love this palette?" */
  intro?: string;
  /** Single subtle line instead of the full card (used on color pages, which carry
   *  their own affiliate disclosure). */
  compact?: boolean;
  className?: string;
}

/**
 * Samplize bundle-offer nudge for MULTI-COLOR surfaces (compare, inspiration,
 * palette generator, room visualizer) — sampling several colors at once is both a
 * bigger basket and genuinely better for comparing. Factual, no urgency. Offer copy
 * + link live in src/lib/affiliate.ts (single source of truth). Renders nothing if
 * affiliate isn't configured AND there's no offer to show is not a concern — the
 * link still works as a plain link, so the nudge stays useful pre-monetization.
 */
export function SamplizeOffer({ sid, intro, compact = false, className = "" }: SamplizeOfferProps) {
  const { url, affiliate } = getSamplizeShopLink(sid);
  const rel = `${affiliate ? "sponsored " : ""}nofollow noopener noreferrer`;

  if (compact) {
    return (
      <p className={`text-sm text-on-surface-variant ${className}`}>
        {intro ?? "Comparing brands?"}{" "}
        <a href={url} target="_blank" rel={rel} className="text-secondary font-semibold underline underline-offset-2 hover:no-underline">
          Order peel-and-stick samples
        </a>{" "}
        of your top matches — Samplize {SAMPLIZE_OFFER.short}.
      </p>
    );
  }

  return (
    <div className={`rounded-2xl border border-secondary/20 bg-surface-container/50 p-5 ${className}`}>
      <p className="text-sm text-on-surface">
        <span className="font-headline font-bold">{intro ?? "Comparing a few colors?"}</span>{" "}
        Order peel-and-stick samples to see real paint on your wall before you commit —{" "}
        <span className="font-semibold text-secondary">Samplize: {SAMPLIZE_OFFER.short}</span>.
      </p>
      <p className="mt-1 text-xs text-on-surface-variant">{SAMPLIZE_OFFER.tiers}</p>
      <a
        href={url}
        target="_blank"
        rel={rel}
        className="mt-3 inline-block bg-secondary text-on-secondary px-5 py-2.5 rounded-xl font-headline font-bold text-sm shadow-lg shadow-secondary/20 hover:shadow-xl transition-all"
      >
        Shop peel-and-stick samples →
      </a>
      {AFFILIATE_ENABLED && (
        <p className="mt-3 text-xs text-on-surface-variant/80">
          Affiliate link — Paint Color HQ may earn a small commission at no extra cost to you.
        </p>
      )}
    </div>
  );
}

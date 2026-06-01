/**
 * Scheduled-publishing gate for blog posts. Pure logic, no JSX — so it can be
 * unit-tested and imported by both the app and the Pinterest scripts.
 *
 * Model: a post's `date` IS its publish date. A future date = scheduled; the
 * post is committed to main but stays hidden until the date arrives.
 *
 * Two gates:
 *  - isLive: strict date check. Used for every list, the sitemap, related/brand
 *    posts, and the Pinterest drip — so a scheduled post never leaks into a feed
 *    or gets pinned before it's live, regardless of where the code runs.
 *  - canRender: governs whether a single post PAGE may render. Live posts always;
 *    not-yet-live posts render only on non-production deploys (Vercel preview /
 *    local dev) so they can be reviewed before going live.
 */

/** True when the post's date has arrived (compared at the given instant). */
export function isLiveAt(dateStr: string, now: Date): boolean {
  return new Date(dateStr).getTime() <= now.getTime();
}

/** Strict live check against the real clock. */
export function isLive(dateStr: string): boolean {
  return isLiveAt(dateStr, new Date());
}

/** Whether a post page may render: live always; scheduled only off-production. */
export function canRenderAt(dateStr: string, now: Date, isProduction: boolean): boolean {
  return isLiveAt(dateStr, now) || !isProduction;
}

/** canRender against the real clock + the current Vercel environment. */
export function canRender(dateStr: string): boolean {
  return canRenderAt(dateStr, new Date(), process.env.VERCEL_ENV === "production");
}

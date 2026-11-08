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

/**
 * Publish dates are Eastern calendar days. A bare "YYYY-MM-DD" means midnight
 * America/New_York, not midnight UTC — `new Date("2026-10-27")` is UTC, which
 * revealed every post at 8 pm Eastern the evening before. Strings that carry a
 * time are parsed as written.
 */
const PUBLISH_TIME_ZONE = "America/New_York";

/** Instant (ms) a post goes live. */
export function publishInstant(dateStr: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr).getTime();
  const utcMidnight = Date.parse(`${dateStr}T00:00:00Z`);
  // Read the Eastern offset near local midnight. DST switches at 2 am, so
  // midnight itself is never skipped or repeated.
  const probe = new Date(utcMidnight + 5 * 3_600_000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: PUBLISH_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(probe)
      .map((x) => [x.type, x.value]),
  );
  const wallAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  const offset = wallAsUtc - probe.getTime();
  return utcMidnight - offset;
}

/** True when the post's date has arrived (compared at the given instant). */
export function isLiveAt(dateStr: string, now: Date): boolean {
  return publishInstant(dateStr) <= now.getTime();
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

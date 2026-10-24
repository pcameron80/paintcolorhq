/**
 * Pure decisions for publish-check.ts, the publish-day job for scheduled posts.
 *
 * A future-dated post reveals at 00:00 UTC on its date (ISR, up to ~1h). The
 * job then confirms it is really live, pings IndexNow, resubmits the sitemap to
 * Google Search Console, and for the next four weeks inspects the URL once a day
 * until Google reports it indexed. On the reveal day and again on day 3, while
 * the post is still unindexed, it raises a "Request indexing" nudge with the
 * Search Console inspection link: the API cannot request indexing, so a person
 * has to press the button. Everything here is side-effect free so the
 * rules can be unit-tested; the network calls live in publish-check.ts.
 */
import { isLiveAt } from "../../src/lib/blog-publish.ts";

export const SUBMIT_WINDOW_DAYS = 3; // retry window for a post that hasn't come up yet
export const INSPECT_WINDOW_DAYS = 28; // how long to keep checking Google's index status
export const INSPECT_EVERY_HOURS = 20; // at most one inspection per post per day
export const NUDGE_DAYS = [0, 3] as const; // days after reveal to ask for a manual "Request indexing"
export const NEVER_INDEXED_PROBLEM = `not indexed after ${INSPECT_WINDOW_DAYS} days`;

const DAY = 86_400_000;

export interface PostRef {
  slug: string;
  date: string; // "YYYY-MM-DD", the reveal date
}

export interface Inspection {
  at: string;
  verdict: string; // PASS | NEUTRAL | FAIL | VERDICT_UNSPECIFIED
  coverageState: string; // e.g. "Submitted and indexed", "Discovered - currently not indexed"
  link?: string; // inspectionResultLink: opens this URL in Search Console's inspection tool
}

export interface PostState {
  submittedAt?: string; // IndexNow + GSC sitemap ping both done
  inspections?: Inspection[];
  indexedAt?: string;
  lastProblem?: string;
  nudgedDays?: number[]; // NUDGE_DAYS already raised for this post
}

export type PublishState = Record<string, PostState>;

const ageMs = (date: string, now: Date) => now.getTime() - new Date(date).getTime();

/** Live posts inside the submit window that haven't been submitted yet. */
export function postsToSubmit(posts: PostRef[], state: PublishState, now: Date): PostRef[] {
  return posts.filter(
    (p) =>
      isLiveAt(p.date, now) &&
      ageMs(p.date, now) <= SUBMIT_WINDOW_DAYS * DAY &&
      !state[p.slug]?.submittedAt,
  );
}

/** Submitted, not yet indexed, still inside the inspect window, and not
 *  inspected in the last INSPECT_EVERY_HOURS. */
export function postsToInspect(posts: PostRef[], state: PublishState, now: Date): PostRef[] {
  return posts.filter((p) => {
    const s = state[p.slug];
    if (!s?.submittedAt || s.indexedAt) return false;
    if (ageMs(p.date, now) > INSPECT_WINDOW_DAYS * DAY) return false;
    const last = s.inspections?.at(-1);
    return !last || now.getTime() - new Date(last.at).getTime() >= INSPECT_EVERY_HOURS * 3_600_000;
  });
}

/** Posts whose inspect window closed without Google indexing them. Reported once. */
export function postsNeverIndexed(posts: PostRef[], state: PublishState, now: Date): PostRef[] {
  return posts.filter((p) => {
    const s = state[p.slug];
    return (
      s?.submittedAt &&
      !s.indexedAt &&
      ageMs(p.date, now) > INSPECT_WINDOW_DAYS * DAY &&
      s.lastProblem !== NEVER_INDEXED_PROBLEM
    );
  });
}

export interface Nudge {
  post: PostRef;
  day: number; // the NUDGE_DAYS entry being raised
}

/** Submitted, still-unindexed posts inside the inspect window that have reached
 *  a nudge day not yet raised. Only the latest reached day fires, so a missed
 *  reveal-day run doesn't produce two nudges at once. */
export function nudgesDue(posts: PostRef[], state: PublishState, now: Date): Nudge[] {
  const out: Nudge[] = [];
  for (const p of posts) {
    const s = state[p.slug];
    if (!s?.submittedAt || s.indexedAt) continue;
    const age = ageMs(p.date, now);
    if (age < 0 || age > INSPECT_WINDOW_DAYS * DAY) continue;
    const day = NUDGE_DAYS.filter((d) => age >= d * DAY).at(-1);
    if (day === undefined || s.nudgedDays?.includes(day)) continue;
    out.push({ post: p, day });
  }
  return out;
}

/** Nudge days to record after raising `day`: it and every earlier one. */
export function nudgedThrough(day: number, prior: number[] = []): number[] {
  return [...new Set([...prior, ...NUDGE_DAYS.filter((d) => d <= day)])].sort((a, b) => a - b);
}

/** The Search Console inspection link for a URL: the one the API returned on the
 *  latest inspection, or the standard inspect URL for the property. */
export function inspectionLink(url: string, propertyUrl: string, s?: PostState): string {
  const fromApi = [...(s?.inspections ?? [])].reverse().find((i) => i.link)?.link;
  if (fromApi) return fromApi;
  return (
    "https://search.google.com/search-console/inspect" +
    `?resource_id=${encodeURIComponent(propertyUrl)}&id=${encodeURIComponent(url)}`
  );
}

/** Google's URL Inspection verdict PASS means the URL is on Google. */
export function isIndexed(verdict: string): boolean {
  return verdict === "PASS";
}

/** Why a post that should be live isn't, or null when it checks out: the page
 *  returns 200 with its own canonical, and the blog sitemap lists it. */
export function liveProblem(url: string, status: number, html: string, sitemapXml: string): string | null {
  if (status !== 200) return `page returned ${status}`;
  if (!html.includes(`<link rel="canonical" href="${url}"`)) return "page is missing its canonical tag";
  if (!sitemapXml.includes(`<loc>${url}</loc>`)) return "page is live but not in sitemap/blog.xml";
  return null;
}

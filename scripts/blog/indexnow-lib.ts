/**
 * Pure gate for indexnow-submit.ts: only live blog posts may be pinged.
 *
 * --slug used to bypass the date check, so a scheduled post could be submitted
 * days before it reveals and the engines would crawl a 404 (happened 2026-10-11
 * with how-to-choose-trim-color, two days early). Unknown slugs were also sent.
 */
import { isLiveAt } from "../../src/lib/blog-publish.ts";

export interface SlugCheck {
  live: string[];
  /** Real posts whose date hasn't arrived yet, with that date. */
  scheduled: Array<{ slug: string; date: string }>;
  /** Slugs that match no post in blog-posts.tsx. */
  unknown: string[];
}

/** Sort requested slugs into live / scheduled / unknown. `dateOf` returns the
 *  post's date, or undefined when no such post exists. */
export function checkSlugs(
  slugs: string[],
  dateOf: (slug: string) => string | undefined,
  now: Date,
): SlugCheck {
  const out: SlugCheck = { live: [], scheduled: [], unknown: [] };
  for (const slug of slugs) {
    const date = dateOf(slug);
    if (date === undefined) out.unknown.push(slug);
    else if (isLiveAt(date, now)) out.live.push(slug);
    else out.scheduled.push({ slug, date });
  }
  return out;
}

/** The only host IndexNow submissions may name (the key is registered for it). */
export const SUBMIT_HOST = "www.paintcolorhq.com";
/** Flood guard shared by every mode of indexnow-submit.ts. */
export const MAX_URLS = 25;

export interface UrlCheck {
  /** Normalized, de-duplicated URLs that passed the static checks. */
  urls: string[];
  /** One line per rejected value, with the reason. */
  errors: string[];
}

/** Static checks for --url values: https, www host only, no query or fragment,
 *  at most MAX_URLS after de-duplication. Whether the page is live (200 or in
 *  the sitemap) needs the network and is checked by the caller. */
export function checkUrls(values: string[]): UrlCheck {
  const out: UrlCheck = { urls: [], errors: [] };
  const seen = new Set<string>();
  for (const raw of values) {
    const value = raw.trim();
    let u: URL;
    try {
      u = new URL(value);
    } catch {
      out.errors.push(`${value || "(empty)"}: not a URL`);
      continue;
    }
    if (u.protocol !== "https:") out.errors.push(`${value}: must be https`);
    else if (u.hostname !== SUBMIT_HOST || u.port) out.errors.push(`${value}: host must be ${SUBMIT_HOST}`);
    else if (u.search || u.hash) out.errors.push(`${value}: no query string or fragment`);
    else if (!seen.has(u.href)) {
      seen.add(u.href);
      out.urls.push(u.href);
    }
  }
  if (out.urls.length > MAX_URLS) {
    out.errors.push(`${out.urls.length} URLs given; the limit is ${MAX_URLS}. This tool is not for bulk re-submission.`);
  }
  return out;
}

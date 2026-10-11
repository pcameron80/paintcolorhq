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

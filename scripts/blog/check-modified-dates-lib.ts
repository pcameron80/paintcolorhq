/**
 * Pure helpers for scripts/blog/check-modified-dates.ts.
 *
 * A post's modifiedDate drives sitemap lastmod, BlogPosting dateModified and
 * og:modifiedTime. If a commit changes a post's body after that date, engines
 * get no recrawl signal for the change. The check compares each post's line
 * range in src/lib/blog-posts.tsx against `git log -L` for that range.
 */

export interface PostRange {
  slug: string;
  start: number; // 1-based, inclusive
  end: number; // 1-based, inclusive
  date: string; // YYYY-MM-DD
  modifiedDate?: string;
}

export interface RangeCommit {
  sha: string;
  date: string; // author date, YYYY-MM-DD
  subject: string;
  changed: string[]; // +/- lines inside the range, marker stripped
}

/** Split the blogPosts array source into one line range per post. */
export function parsePostRanges(source: string): PostRange[] {
  const lines = source.split("\n");
  const arrayStart = lines.findIndex((l) => /^const blogPosts: BlogPost\[\] = \[/.test(l));
  const arrayEnd = lines.findIndex((l, i) => i > arrayStart && l === "];");
  if (arrayStart < 0 || arrayEnd < 0) throw new Error("blogPosts array not found");

  const starts: number[] = [];
  for (let i = arrayStart + 1; i < arrayEnd; i++) {
    if (lines[i] === "  {") starts.push(i);
  }
  const ranges: PostRange[] = [];
  starts.forEach((s, k) => {
    const e = k + 1 < starts.length ? starts[k + 1] - 1 : arrayEnd - 1;
    const body = lines.slice(s, e + 1);
    const field = (name: string) => {
      for (const l of body) {
        const m = l.match(new RegExp(`^    ${name}: "([^"]+)"`));
        if (m) return m[1];
      }
      return undefined;
    };
    const slug = field("slug");
    const date = field("date");
    if (!slug || !date) throw new Error(`post at line ${s + 1} has no slug or date`);
    ranges.push({ slug, start: s + 1, end: e + 1, date, modifiedDate: field("modifiedDate") });
  });
  return ranges;
}

/** Parse `git log -L ... --format=@@@COMMIT %H %as %s` output into commits. */
export function parseLogL(output: string): RangeCommit[] {
  const commits: RangeCommit[] = [];
  let cur: RangeCommit | null = null;
  let inHunk = false;
  for (const line of output.split("\n")) {
    const m = line.match(/^@@@COMMIT ([0-9a-f]{7,40}) (\d{4}-\d{2}-\d{2}) (.*)$/);
    if (m) {
      cur = { sha: m[1], date: m[2], subject: m[3], changed: [] };
      commits.push(cur);
      inHunk = false;
      continue;
    }
    if (!cur) continue;
    if (line.startsWith("@@ ")) {
      inHunk = true;
      continue;
    }
    if (line.startsWith("diff --git") || line.startsWith("--- ") || line.startsWith("+++ ")) {
      inHunk = false;
      continue;
    }
    if (inHunk && (line.startsWith("+") || line.startsWith("-"))) {
      cur.changed.push(line.slice(1));
    }
  }
  return commits;
}

/**
 * Lines that are post metadata rather than article body. Changing them alone
 * does not make a post "modified": a modifiedDate bump, a title or excerpt
 * numeral fix, or a new cover image.
 */
const METADATA_LINE = /^\s*(modifiedDate|title|author|excerpt|coverImage|pinImage|tags|noindex):/;

export function isBodyChange(c: RangeCommit): boolean {
  return c.changed.some((l) => l.trim() !== "" && !METADATA_LINE.test(l));
}

export function isExempt(c: RangeCommit, ignoreShas: readonly string[]): boolean {
  if (c.subject.includes("[no-date]")) return true;
  return ignoreShas.some((s) => c.sha.startsWith(s) || s.startsWith(c.sha));
}

export interface DateFinding {
  slug: string;
  effective: string; // modifiedDate ?? date
  newest: RangeCommit;
}

/**
 * The newest commit that changed the post's body, skipping exempt commits and
 * metadata-only edits. Returns a finding when that commit is newer than the
 * post's modifiedDate (or date, when there is none). Commits dated before
 * `since` are grandfathered.
 */
export function checkPost(
  post: PostRange,
  commits: RangeCommit[],
  ignoreShas: readonly string[],
  since = "",
): DateFinding | null {
  const effective = post.modifiedDate ?? post.date;
  const relevant = commits.filter(
    (c) => c.date >= since && !isExempt(c, ignoreShas) && isBodyChange(c),
  );
  if (relevant.length === 0) return null;
  const newest = relevant.reduce((a, b) => (b.date > a.date ? b : a));
  return newest.date > effective ? { slug: post.slug, effective, newest } : null;
}

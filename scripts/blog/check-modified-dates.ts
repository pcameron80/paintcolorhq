/**
 * Fails when a blog post's body changed in a commit newer than its
 * modifiedDate (or its date, when it has no modifiedDate).
 *
 *   npm run check:blog-dates
 *
 * Run locally and in seo-preflight before a blog PR merges. Never at Vercel
 * build: its shallow clone has no history for `git log -L`.
 *
 * Exemptions:
 * - A commit whose subject contains "[no-date]" (wording-only edits).
 * - Commits in IGNORE_SHAS below, each with a reason.
 * - Commits that only touch metadata lines (modifiedDate, title, author,
 *   excerpt, coverImage, pinImage, tags, noindex). A title numeral fix or a
 *   cover swap is not a content update, and neither is the squash merge that
 *   bumps modifiedDate.
 * - Commits before SINCE. The policy (bump modifiedDate with every body edit)
 *   starts with the 2026-10-11 corrections; older history is grandfathered.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { checkPost, parseLogL, parsePostRanges } from "./check-modified-dates-lib.ts";

const FILE = "src/lib/blog-posts.tsx";

const SINCE = "2026-10-01";

const IGNORE_SHAS: readonly string[] = [
  // #218 (2026-10-20): "provided room photograph" became "one of the provided
  // rooms" in 5 posts after the visualizer gained 10 rooms. Wording only.
  "197aceb",
];

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
}

function main() {
  if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true") {
    console.error("check-modified-dates: shallow clone, git log -L cannot see history. Run it in a full clone.");
    process.exit(2);
  }
  const posts = parsePostRanges(readFileSync(FILE, "utf8"));
  const failures: string[] = [];
  for (const post of posts) {
    const out = git([
      "log",
      `-L${post.start},${post.end}:${FILE}`,
      "--format=@@@COMMIT %H %as %s",
    ]);
    const finding = checkPost(post, parseLogL(out), IGNORE_SHAS, SINCE);
    if (finding) {
      failures.push(
        `${finding.slug}: modifiedDate ${finding.effective} is older than ${finding.newest.date} ` +
          `(${finding.newest.sha.slice(0, 7)} ${finding.newest.subject})`,
      );
    }
  }
  if (failures.length) {
    console.error(`check-modified-dates: ${failures.length} post(s) changed after their modifiedDate:`);
    for (const f of failures) console.error(`  ${f}`);
    console.error('Bump modifiedDate, or put "[no-date]" in the commit subject for wording-only edits.');
    process.exit(1);
  }
  console.log(`check-modified-dates: ${posts.length} posts OK`);
}

main();

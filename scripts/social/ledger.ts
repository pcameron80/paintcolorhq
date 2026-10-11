/**
 * Runtime ledgers for the social drips (Pinterest, Facebook, Instagram).
 *
 * Each ledger maps a queue key to the post it produced; the publishers read it
 * to avoid double-posting and (Pinterest) to time cooldown re-pins. They live
 * OUTSIDE the repo, in ~/Library/Application Support/PaintColorHQ/social/, so
 * every checkout, worktree and the launchd jobs' detached worktree of
 * origin/main share one copy. Inside the repo they were per-checkout, so a
 * branch switch or a worktree run could read a stale ledger and repost.
 *
 * PCHQ_SOCIAL_STATE_DIR overrides the folder (tests, or a second machine).
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export type LedgerName = "pinterest" | "facebook" | "instagram";
export type LedgerEntry = { publishedAt: string; [field: string]: unknown };
export type Ledger<E extends LedgerEntry = LedgerEntry> = Record<string, E>;

const FILE: Record<LedgerName, string> = {
  pinterest: "pinterest-published.json",
  facebook: "facebook-published.json",
  instagram: "instagram-published.json",
};

/** Where each ledger lived in the repo before the move (migration sources). */
export const LEGACY_REPO_PATH: Record<LedgerName, string> = {
  pinterest: "scripts/pinterest/published.json",
  facebook: "scripts/facebook/fb-published.json",
  instagram: "scripts/instagram/ig-published.json",
};

export function stateDir(): string {
  return (
    process.env.PCHQ_SOCIAL_STATE_DIR ??
    path.join(os.homedir(), "Library/Application Support/PaintColorHQ/social")
  );
}

export function ledgerPath(name: LedgerName): string {
  return path.join(stateDir(), FILE[name]);
}

/**
 * Read a ledger. A missing file is an error unless allowMissing: an empty
 * ledger makes every queue item look unposted, so a publisher that silently
 * fell back to {} would repost the whole history. A corrupt file always throws
 * for the same reason.
 */
export function readLedger<E extends LedgerEntry>(
  file: string,
  opts: { allowMissing?: boolean } = {},
): Ledger<E> {
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      if (opts.allowMissing) return {};
      throw new Error(
        `Ledger not found: ${file}\n` +
          `Run scripts/social/install-schedules.sh (it migrates the in-repo ledgers), or ` +
          `npx tsx scripts/social/migrate-ledgers.ts --from-repo=<main checkout>.`,
      );
    }
    throw e;
  }
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Ledger is not a JSON object: ${file}`);
  }
  return parsed as Ledger<E>;
}

/** Write via temp file + rename so a crash mid-write never leaves half a ledger. */
export function writeLedger(file: string, ledger: Ledger): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(ledger, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

/**
 * Union of ledgers. Where a key appears more than once, the entry with the
 * latest publishedAt wins (a Pinterest cooldown re-pin overwrites the original
 * entry with a newer date, so the newest is the current state). Ties keep the
 * earlier argument's entry.
 */
export function mergeLedgers<E extends LedgerEntry>(...ledgers: Ledger<E>[]): Ledger<E> {
  const out: Ledger<E> = {};
  for (const ledger of ledgers) {
    for (const [key, entry] of Object.entries(ledger)) {
      const prev = out[key];
      if (!prev || Date.parse(entry.publishedAt) > Date.parse(prev.publishedAt)) out[key] = entry;
    }
  }
  return out;
}

# Backups

PaintColorHQ has two off-platform backup jobs. Both copy data to the NAS (Tower, Unraid) and fail loudly.

| Job | What | Where it runs | When | Kept |
|---|---|---|---|---|
| `com.paintcolorhq.db-backup` | Logical snapshot of the Supabase tables | Philip's laptop (launchd) | Mondays 11:00 local | 4 on the laptop, 12 on Tower |
| `plausible-backup` | Plausible CE: Postgres `plausible_db` and ClickHouse `plausible_events_db` | Tower (Unraid cron) | Nightly 02:15 | 14 on Tower, 30 days in Google Drive |

The reason for both: Supabase keeps 7 daily snapshots, with point-in-time recovery off. They cannot be downloaded and are lost if the project or the account goes. Data errors on this project have shown up weeks after the write that caused them, so a 7-day window is too short. The self-hosted Plausible stack had no backup at all.

ClickHouse's stock config in the Plausible image already allows file backups (`<backups><allowed_path>backups</allowed_path></backups>` in `/etc/clickhouse-server/config.xml`, checked on Tower 2026-10-24), so no extra ClickHouse config is needed.

## Supabase snapshot

Script: `scripts/backup-db-snapshot.ts`. It only reads from Supabase, using the service role key so the RLS-only tables are visible.

Tables: `brands`, `color_families`, `colors`, `projects`, `project_colors`, `api_referrers`, `api_usage_events`. Every column and every id is kept.

Not included:
- `cross_brand_matches`, because it is derived data. `npm run compute-matches` rebuilds it from `colors`.
- `auth.users`, because PostgREST cannot reach it. The 116 accounts are covered only by Supabase's own backups. `projects.user_id` still holds each owner's id.

What one run does:

1. For each table it takes `count(*)`, pages `select('*').order('id')` in pages of 1000, then takes `count(*)` again. A table fails the run if it has 0 rows, if the number of paged rows falls outside the before and after counts, if any id is missing or duplicated, or if it has shrunk by more than 5% since the last snapshot.
2. It writes `<table>.json.gz` and `manifest.json` to `~/Library/Application Support/PaintColorHQ/backup/db/YYYY-MM-DD.partial/`. The manifest records rows, both counts, sha256, the git SHA and the Supabase host.
3. It restores the snapshot into a scratch SQLite database, checks every sha256 and compares the restored counts and distinct ids with the manifest. The result goes in `restore-test.json` inside the snapshot.
4. Only when every check passes is the `.partial` folder renamed to `YYYY-MM-DD/`. It is then rsynced to `Tower:/mnt/user/backups/paintcolorhq-db/YYYY-MM-DD/`, and the NAS copy's sha256 is checked before any old copy is pruned.
5. It mirrors `data/brand-scans/` (136 MB) and `scripts/data/backups/` from the main checkout into `Tower:/mnt/user/backups/paintcolorhq-db/files/`. Both folders are gitignored and exist only on the laptop. The mirror never deletes files on the NAS.

A failed run leaves its `.partial` folder for inspection. It is never copied, and it never causes a good copy to be pruned. The script never writes inside a checkout, which keeps `data/colors-processed.json` safe.

SSH: the job tries `root@192.168.2.110` first, then `root@tower` over Tailscale. Override it with `PCHQ_BACKUP_SSH`.

### Commands

```bash
npx tsx scripts/backup-db-snapshot.ts                          # dry run: prints the plan, no DB or NAS access
npx tsx scripts/backup-db-snapshot.ts --apply                  # full run
npx tsx scripts/backup-db-snapshot.ts --apply --local-only     # no NAS copy
npx tsx scripts/backup-db-snapshot.ts --apply --allow-drop=colors   # accept a planned >5% drop, this run only
npx tsx scripts/backup-db-snapshot.ts --restore-test=<dir> --keep-db  # re-check a snapshot; keeps the SQLite file
npm run test:backup                                            # unit tests (synthetic data, no network)
```

Use `--allow-drop` only after a deliberate bulk delete, such as `retire-bad-color-rows.ts`. Name the tables. The flag lasts for one run.

### Schedule

```bash
./scripts/backup/install-backup-schedule.sh --check     # render and validate, then a dry run; loads nothing
./scripts/backup/install-backup-schedule.sh             # install the launchd agent
./scripts/backup/install-backup-schedule.sh uninstall   # remove it; keeps snapshots and logs
```

The installer follows `scripts/social/install-schedules.sh`. The job runs from its own detached worktree at `backup/checkout/`, which is moved to `origin/main` before every run, with `node_modules` and `.env.local` symlinked from the main checkout. The log is `backup/logs/db-backup.log`. A failure raises a macOS notification. A successful run writes the time to `backup/last-success`.

Run it now: `bash "$HOME/Library/Application Support/PaintColorHQ/backup/run.sh"`. To test the failure notice, set `PCHQ_BACKUP_EXTRA_ARGS=--force-fail` on that command.

### Restoring to Supabase

A restore is a production write, so it is done deliberately, never by a script on a schedule.

1. Choose the snapshot. Run `--restore-test=<dir> --keep-db` on it and query the SQLite file to confirm it holds the rows you need.
2. Back up the current state first: run `--apply --local-only`.
3. Restore only the rows that need it, by id, with an upsert:

```ts
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
const rows = JSON.parse(gunzipSync(readFileSync(`${dir}/colors.json.gz`)).toString());
const wanted = rows.filter((r) => ids.has(r.id));
for (let i = 0; i < wanted.length; i += 500) {
  const { error } = await supabase.from("colors").upsert(wanted.slice(i, i + 500), { onConflict: "id" });
  if (error) throw error;
}
```

`api_referrers` and `api_usage_events` use `GENERATED ALWAYS` identity ids. An upsert that includes `id` needs `OVERRIDING SYSTEM VALUE`, so restore those two tables through SQL rather than PostgREST. After a `colors` restore, run `npm run compute-matches` and `npm run seed-matches`.

## Plausible backup (NAS)

Script: `scripts/backup/nas/plausible-backup.sh`, installed as `/boot/config/plausible-backup.sh`. It is modeled on `/boot/config/clinch-twenty-backup.sh`.

What one run does:

1. `pg_dump -Fc` of `plausible_db` from `plausible-plausible_db-1`.
2. `BACKUP DATABASE plausible_events_db TO File('<zip>')` on `plausible-plausible_events_db-1`. ClickHouse writes into its allowed backups path, which is `appdata/plausible/data/clickhouse/backups/` on the host. The zip is moved out of appdata right away.
3. Writes `SHA256SUMS` and live counts (sites, users and goals; events_v2 and sessions_v2) to `/mnt/user/backups/plausible/<UTC stamp>/`. An empty `events_v2` fails the run.
4. On Sundays, or with `FORCE_RESTORE_TEST=1`: restores the Postgres dump into a scratch `restore_check_*` database and requires the same counts. Restores `events_v2` and `sessions_v2` into a scratch ClickHouse database and requires a non-zero event count no higher than live, because events keep arriving during the run. Then drops both scratch databases.
5. Keeps the newest 14 folders, copies the new one to `gdrive:Backups/plausible/` and runs `rclone check` on the copy. Copies older than 30 days are deleted from Drive.

A failure raises an Unraid notification and logs under the `plausible-backup` tag. The run's folder is renamed `<stamp>.failed`, scratch databases are dropped and no zip is left in appdata. A missing Drive remote is a failure here, unlike in the CRM script, because Drive is the off-site copy.

The script uses only the two Plausible containers. It does not touch `buzz-prod`, the `toh-*` containers or any other stack.

Not covered: `appdata/plausible/ce/.env` holds `SECRET_KEY_BASE` and `TOTP_VAULT_KEY`. A restored `plausible_db` needs the same `TOTP_VAULT_KEY` to read 2FA secrets. Keep a copy of that file in the password manager. It is deliberately left out of the Drive copy.

### Restoring Plausible

```bash
# Postgres (stop the plausible app container first)
docker exec -i plausible-plausible_db-1 pg_restore -U postgres -d plausible_db --clean --if-exists < plausible_db.dump
# ClickHouse: put the zip back inside the allowed path, then restore
cp plausible_events_db.zip /mnt/user/appdata/plausible/data/clickhouse/backups/restore.zip
docker exec plausible-plausible_events_db-1 clickhouse-client -q "RESTORE DATABASE plausible_events_db FROM File('restore.zip') SETTINGS allow_non_empty_tables=true"
```

Restore into a fresh stack, or into `restore_check_*` names, before you overwrite the live databases.

### Cron

`/boot/config/plugins/dynamix/plausible-backup.cron` (from `scripts/backup/nas/plausible-backup.cron`) runs it at 02:15, 15 minutes before the CRM backup. Unraid merges the dynamix `.cron` files into `/etc/cron.d/root` at boot and whenever `update_cron` runs, so the job survives a reboot. The command is `bash /boot/config/plausible-backup.sh`, because `/boot` is mounted noexec.

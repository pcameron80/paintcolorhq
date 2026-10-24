#!/bin/bash
# Nightly backup of the self-hosted Plausible CE stack on Tower (compose project
# "plausible", /mnt/user/appdata/plausible). Lives in the PaintColorHQ repo at
# scripts/backup/nas/plausible-backup.sh; installed on the NAS as
# /boot/config/plausible-backup.sh (see docs/backups.md). Modeled on
# /boot/config/clinch-twenty-backup.sh.
#
# Each run:
# - pg_dump -Fc of plausible_db (sites, users, goals, settings)
# - ClickHouse BACKUP DATABASE plausible_events_db (events_v2, sessions_v2, ...)
#   to a zip inside ClickHouse's allowed backups path, then moved out of appdata
# - SHA256SUMS and live counts; 14 nightly copies kept at /mnt/user/backups/plausible
# - Sundays (or FORCE_RESTORE_TEST=1): restores both into scratch databases
#   (restore_check_* only), compares counts with live, drops the scratch copies
# - copies the backup to Google Drive gdrive:Backups/plausible, 30 days kept there
# Failures raise an Unraid notification and log under the tag plausible-backup.
# Reads the live databases; never writes them. Touches no other compose project.
#
# Not backed up here: ce/.env (SECRET_KEY_BASE, TOTP_VAULT_KEY). Keep a copy of it
# somewhere safe yourself; a restored plausible_db without the same TOTP_VAULT_KEY
# cannot decrypt 2FA secrets.
set -euo pipefail

CH_DATA=/mnt/user/appdata/plausible/data/clickhouse
DEST=/mnt/user/backups/plausible
RCLONE_CONF=/boot/config/rclone/rclone.conf
REMOTE="gdrive:Backups/plausible"
KEEP_LOCAL_DAYS=14
KEEP_REMOTE_DAYS=30
PG_DB=plausible_db
CH_DB=plausible_events_db
# Containers of compose project "plausible" (ce/compose.yml + compose.override.yml).
PG_CT=plausible-plausible_db-1
CH_CT=plausible-plausible_events_db-1

stamp=$(date -u +%Y%m%dT%H%M%SZ)
lstamp=$(echo "$stamp" | tr "A-Z" "a-z")
dir="$DEST/$stamp"
ch_zip="pchq-backup-$stamp.zip"

rdb=""
fail() {
  trap - ERR
  # Never leave a scratch restore behind (only restore_check_* names are ever dropped).
  if [ -n "$rdb" ]; then
    docker exec "$PG_CT" psql -U postgres -d postgres -Atc "drop database if exists $rdb" </dev/null >/dev/null 2>&1 || true
    docker exec "$CH_CT" clickhouse-client -q "DROP DATABASE IF EXISTS $rdb SYNC" </dev/null >/dev/null 2>&1 || true
  fi
  # No backup zip may be left inside appdata, and a failed run's folder is renamed
  # so it never counts as one of the 14 good copies.
  rm -f "$CH_DATA/backups/$ch_zip"
  [ -d "$dir" ] && mv "$dir" "$dir.failed" 2>/dev/null || true
  logger -t plausible-backup "FAILED: $1"
  /usr/local/emhttp/webGui/scripts/notify -e "Plausible backup" -s "Plausible backup failed" -d "$1" -i alert >/dev/null 2>&1 || true
  exit 1
}
trap 'fail "line $LINENO exited with status $?"' ERR
[ "${FORCE_FAIL:-}" = "1" ] && fail "FORCE_FAIL=1 (testing the failure notice)"

umask 077
mkdir -p "$dir"

psql_q() { docker exec "$PG_CT" psql -U postgres -d "$1" -Atc "$2" </dev/null; }
ch_q() { docker exec "$CH_CT" clickhouse-client -q "$1" </dev/null; }

# 1. Postgres
docker exec "$PG_CT" pg_dump -U postgres -d "$PG_DB" -Fc </dev/null > "$dir/$PG_DB.dump"
[ -s "$dir/$PG_DB.dump" ] || fail "empty $PG_DB dump"

# 2. ClickHouse. allowed_path is "backups", i.e. /var/lib/clickhouse/backups in the
#    container = $CH_DATA/backups on the host. The zip is moved out right after.
ch_q "BACKUP DATABASE $CH_DB TO File('$ch_zip')" >/dev/null
[ -s "$CH_DATA/backups/$ch_zip" ] || fail "ClickHouse BACKUP produced no $ch_zip"
mv "$CH_DATA/backups/$ch_zip" "$dir/$CH_DB.zip"

(cd "$dir" && sha256sum "$PG_DB.dump" "$CH_DB.zip" > SHA256SUMS)

pg_counts_sql="select (select count(*) from sites)||' '||(select count(*) from users)||' '||(select count(*) from goals)"
ch_counts() { ch_q "SELECT concat(toString((SELECT count() FROM $1.events_v2)), ' ', toString((SELECT count() FROM $1.sessions_v2)))"; }
live_pg=$(psql_q "$PG_DB" "$pg_counts_sql")
live_ch=$(ch_counts "$CH_DB")
{
  echo "postgres sites users goals: $live_pg"
  echo "clickhouse events_v2 sessions_v2: $live_ch"
} > "$dir/live-counts.txt"
[ "${live_ch%% *}" -gt 0 ] || fail "events_v2 is empty on the live server"

if [ "$(date +%u)" = "7" ] || [ "${FORCE_RESTORE_TEST:-}" = "1" ]; then
  rdb="restore_check_$lstamp"
  # Postgres
  psql_q postgres "create database $rdb" >/dev/null
  docker exec -i "$PG_CT" pg_restore -U postgres -d "$rdb" --no-owner --exit-on-error < "$dir/$PG_DB.dump"
  restored_pg=$(psql_q "$rdb" "$pg_counts_sql")
  psql_q postgres "drop database $rdb" >/dev/null
  # ClickHouse: the zip has to be back inside the allowed path to restore from it.
  cp "$dir/$CH_DB.zip" "$CH_DATA/backups/$ch_zip"
  # Only the two tables the counts read; restoring the whole database would also
  # recreate its dictionaries, which point back at the live tables.
  ch_q "CREATE DATABASE $rdb" >/dev/null
  ch_q "RESTORE TABLE $CH_DB.events_v2 AS $rdb.events_v2, TABLE $CH_DB.sessions_v2 AS $rdb.sessions_v2 FROM File('$ch_zip')" >/dev/null
  restored_ch=$(ch_counts "$rdb")
  ch_q "DROP DATABASE $rdb SYNC" >/dev/null
  rm -f "$CH_DATA/backups/$ch_zip"
  # Live counts move while the backup runs (events keep arriving), so require the
  # restored events to be present and no more than the live count read afterwards.
  [ "$restored_pg" = "$live_pg" ] || fail "postgres restore mismatch: live [$live_pg] restored [$restored_pg]"
  r_events=${restored_ch%% *}
  [ "$r_events" -gt 0 ] || fail "ClickHouse restore returned 0 events_v2 rows"
  [ "$r_events" -le "${live_ch%% *}" ] || fail "ClickHouse restore has more events than live: [$restored_ch] vs [$live_ch]"
  {
    echo "restore test passed $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "postgres sites users goals: $restored_pg"
    echo "clickhouse events_v2 sessions_v2: $restored_ch"
  } > "$dir/restore-test.txt"
fi

# Keep the newest 14 nightly folders (by name, so a missed night never deletes early).
ls -1d "$DEST"/20*Z 2>/dev/null | sort | head -n -"$KEEP_LOCAL_DAYS" | xargs -r rm -rf --

if [ -f "$RCLONE_CONF" ] && rclone --config "$RCLONE_CONF" listremotes | grep -qx 'gdrive:'; then
  rclone --config "$RCLONE_CONF" copy "$dir" "$REMOTE/$stamp" --quiet
  rclone --config "$RCLONE_CONF" check "$dir" "$REMOTE/$stamp" --one-way --quiet || fail "Drive copy of $stamp does not match the local backup"
  rclone --config "$RCLONE_CONF" delete "$REMOTE" --min-age "${KEEP_REMOTE_DAYS}d" --quiet || true
  rclone --config "$RCLONE_CONF" rmdirs "$REMOTE" --leave-root --quiet || true
  remote_note="copied to Drive"
else
  fail "rclone remote gdrive: not configured; backup is local only"
fi

logger -t plausible-backup "OK $stamp pg [$live_pg] ch [$live_ch] ($remote_note)"
echo "OK $stamp pg [$live_pg] ch [$live_ch] ($remote_note)"

#!/usr/bin/env bash
# Run a read-only ClickHouse query file against the self-hosted Plausible
# events database on the NAS.
#
#   scripts/analytics/run-clickhouse.sh <file.sql> [start] [end]
#
#   start, end   YYYY-MM-DD, both inclusive, UTC calendar days. They are passed
#                as ClickHouse query parameters (--param_start / --param_end),
#                so the SQL reads them as {start:Date} and {end:Date}.
#                Default: the last 7 full UTC days.
#
# The SQL is piped over ssh to clickhouse-client inside the Plausible events
# container with --readonly=1, so the server rejects any write. Nothing is
# copied to the NAS and no file there is changed.
#
# Env overrides:
#   NAS_HOST              ssh target (default root@192.168.2.110; off the LAN use root@tower)
#   CLICKHOUSE_CONTAINER  default plausible-plausible_events_db-1
#   CLICKHOUSE_DB         default plausible_events_db
#   CH_FORMAT             output format for queries that set none (default PrettyCompactMonoBlock)
set -euo pipefail

if [[ $# -lt 1 || ! -f "$1" ]]; then
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
fi

sql_file="$1"
days_ago() { date -u -v-"$1"d +%F 2>/dev/null || date -u -d "$1 days ago" +%F; }
start="${2:-$(days_ago 7)}"
end="${3:-$(days_ago 1)}"

for d in "$start" "$end"; do
  if [[ ! "$d" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "Dates must be YYYY-MM-DD, got '$d'" >&2
    exit 2
  fi
done
if [[ "$start" > "$end" ]]; then
  echo "start ($start) is after end ($end)" >&2
  exit 2
fi

host="${NAS_HOST:-root@192.168.2.110}"
container="${CLICKHOUSE_CONTAINER:-plausible-plausible_events_db-1}"
db="${CLICKHOUSE_DB:-plausible_events_db}"
format="${CH_FORMAT:-PrettyCompactMonoBlock}"

echo "# $(basename "$sql_file")  ${start} .. ${end} (UTC, inclusive)  via ${host}" >&2

# The dates were validated above, so they are safe inside the remote command.
ssh -o BatchMode=yes -o ConnectTimeout=10 "$host" \
  "docker exec -i $container clickhouse-client -d $db --readonly=1 --multiquery --format=$format --param_start=$start --param_end=$end" \
  < "$sql_file"

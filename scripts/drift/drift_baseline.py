#!/usr/bin/env python3
"""
drift_baseline.py — Capture an SEO baseline for a URL and store it in SQLite.

Usage:
    python scripts/drift_baseline.py <url>

The baseline is stored in scripts/drift/drift.db.
"""

import hashlib
import json
import os
import sqlite3
import sys
import time
from datetime import datetime, timezone

# Ensure the drift package directory is importable regardless of cwd
_DRIFT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _DRIFT_DIR)

import fetch_page  # noqa: E402
import parse_seo   # noqa: E402

DB_PATH = os.path.join(_DRIFT_DIR, "drift.db")


# ---------------------------------------------------------------------------
# Database setup
# ---------------------------------------------------------------------------

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS baselines (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            url         TEXT    NOT NULL,
            captured_at TEXT    NOT NULL,
            commit_sha  TEXT,
            status_code INTEGER NOT NULL,
            content_hash TEXT   NOT NULL,
            seo_data    TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS comparisons (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            url           TEXT    NOT NULL,
            compared_at   TEXT    NOT NULL,
            baseline_id   INTEGER NOT NULL REFERENCES baselines(id),
            status_code   INTEGER NOT NULL,
            content_hash  TEXT    NOT NULL,
            seo_data      TEXT    NOT NULL,
            findings      TEXT    NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_baselines_url
            ON baselines(url, captured_at);
        CREATE INDEX IF NOT EXISTS idx_comparisons_url
            ON comparisons(url, compared_at);
    """)
    conn.commit()
    return conn


# ---------------------------------------------------------------------------
# Header helpers
# ---------------------------------------------------------------------------

def _pick_headers(raw_headers: dict) -> dict:
    keys = [
        "cache-control", "x-vercel-cache", "x-nextjs-prerender",
        "content-type", "x-robots-tag", "etag",
    ]
    out = {}
    # raw_headers keys may be mixed case
    lower_map = {k.lower(): v for k, v in raw_headers.items()}
    for k in keys:
        if k in lower_map:
            out[k] = lower_map[k]
    return out


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def capture_baseline(url: str, commit_sha: str = None) -> int:
    print(f"Fetching: {url}")
    status, raw_headers, body = fetch_page.fetch(url)
    headers = _pick_headers(raw_headers)

    content_hash = hashlib.sha256(body).hexdigest()

    print(f"  status={status}  content_hash={content_hash[:12]}...")
    seo = parse_seo.parse(body)
    seo["response_headers"] = headers

    now = datetime.now(timezone.utc).isoformat()

    conn = _get_conn()
    cur = conn.execute(
        """
        INSERT INTO baselines (url, captured_at, commit_sha, status_code, content_hash, seo_data)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (url, now, commit_sha, status, content_hash, json.dumps(seo, ensure_ascii=False)),
    )
    baseline_id = cur.lastrowid
    conn.commit()
    conn.close()

    print(f"  Baseline #{baseline_id} saved to {DB_PATH}")
    return baseline_id


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/drift_baseline.py <url> [commit_sha]", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]
    commit_sha = sys.argv[2] if len(sys.argv) > 2 else None
    capture_baseline(url, commit_sha)


if __name__ == "__main__":
    main()

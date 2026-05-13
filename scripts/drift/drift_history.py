#!/usr/bin/env python3
"""
drift_history.py — Show baseline and comparison history for a URL.

Usage:
    python scripts/drift_history.py <url>
"""

import json
import os
import sys
from datetime import datetime

_DRIFT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _DRIFT_DIR)

from drift_baseline import _get_conn  # noqa: E402


def show_history(url: str):
    conn = _get_conn()

    baselines = conn.execute(
        "SELECT id, captured_at, commit_sha, status_code, content_hash FROM baselines "
        "WHERE url=? ORDER BY captured_at ASC",
        (url,)
    ).fetchall()

    comparisons = conn.execute(
        "SELECT id, compared_at, baseline_id, status_code, content_hash, findings "
        "FROM comparisons WHERE url=? ORDER BY compared_at ASC",
        (url,)
    ).fetchall()

    conn.close()

    if not baselines:
        print(f"No history found for: {url}")
        return

    print(f"\nHistory for: {url}")
    print("=" * 80)
    print(f"\n{'BASELINES':}")
    print(f"  {'ID':<6} {'Captured At':<28} {'Commit':<12} {'Status':<8} {'Hash'}")
    print("  " + "-" * 74)
    for b in baselines:
        commit = (b["commit_sha"] or "unknown")[:10]
        h = (b["content_hash"] or "")[:12] + "..."
        print(f"  {b['id']:<6} {b['captured_at']:<28} {commit:<12} {b['status_code']:<8} {h}")

    if comparisons:
        print(f"\n{'COMPARISONS':}")
        print(f"  {'ID':<6} {'Compared At':<28} {'Baseline':<10} {'Status':<8} {'Findings':<30} {'Hash'}")
        print("  " + "-" * 90)
        for c in comparisons:
            findings = json.loads(c["findings"] or "[]")
            crits = sum(1 for f in findings if f["severity"] == "CRITICAL")
            warns = sum(1 for f in findings if f["severity"] == "WARNING")
            infos = sum(1 for f in findings if f["severity"] == "INFO")
            summary = f"{crits}C / {warns}W / {infos}I"
            h = (c["content_hash"] or "")[:12] + "..."
            print(f"  {c['id']:<6} {c['compared_at']:<28} #{c['baseline_id']:<9} {c['status_code']:<8} {summary:<30} {h}")
    else:
        print("\nNo comparisons run yet.")

    print()


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/drift_history.py <url>", file=sys.stderr)
        sys.exit(1)
    show_history(sys.argv[1])


if __name__ == "__main__":
    main()

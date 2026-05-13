#!/usr/bin/env python3
"""
drift_compare.py — Compare current page state to the most recent baseline.

Usage:
    python scripts/drift_compare.py <url>

Prints a findings table and stores results in drift.db.
"""

import hashlib
import json
import os
import sys
from datetime import datetime, timezone

_DRIFT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _DRIFT_DIR)

import fetch_page   # noqa: E402
import parse_seo    # noqa: E402
from drift_baseline import _get_conn, _pick_headers  # noqa: E402

import sqlite3


# ---------------------------------------------------------------------------
# Comparison rules (17 rules, 3 severity levels)
# ---------------------------------------------------------------------------

def _pct_change(old_str: str, new_str: str) -> float:
    """Rough character-level change percentage between two strings."""
    if not old_str and not new_str:
        return 0.0
    if not old_str:
        return 100.0
    import difflib
    ratio = difflib.SequenceMatcher(None, old_str or "", new_str or "").ratio()
    return round((1 - ratio) * 100, 1)


def run_rules(baseline: dict, current: dict) -> list[dict]:
    """
    Compare baseline seo_data dict to current seo_data dict.
    Returns list of triggered findings dicts with keys:
      rule, severity, field, old_value, new_value, description
    """
    findings = []

    def add(rule, severity, field, old_val, new_val, description):
        findings.append({
            "rule": rule,
            "severity": severity,
            "field": field,
            "old_value": str(old_val) if old_val is not None else "(none)",
            "new_value": str(new_val) if new_val is not None else "(none)",
            "description": description,
        })

    b = baseline
    c = current

    # --- CRITICAL rules ---

    # R01: Status became 4xx/5xx
    b_status = b.get("_status_code", 200)
    c_status = c.get("_status_code", 200)
    if b_status < 400 and c_status >= 400:
        add("R01", "CRITICAL", "status_code", b_status, c_status,
            "Page returned error status code")

    # R02: noindex added
    b_robots = (b.get("robots_meta") or "").lower()
    c_robots = (c.get("robots_meta") or "").lower()
    b_noindex = "noindex" in b_robots
    c_noindex = "noindex" in c_robots
    if not b_noindex and c_noindex:
        add("R02", "CRITICAL", "robots_meta", b.get("robots_meta"), c.get("robots_meta"),
            "Page now has noindex directive — will be removed from search index")

    # R03: Canonical changed
    b_can = b.get("canonical") or ""
    c_can = c.get("canonical") or ""
    if b_can and c_can and b_can != c_can:
        add("R03", "CRITICAL", "canonical", b_can, c_can,
            "Canonical URL changed — may consolidate signals to wrong page")

    # R04: Canonical removed
    if b_can and not c_can:
        add("R04", "CRITICAL", "canonical", b_can, "(missing)",
            "Canonical tag removed")

    # R05: H1 removed
    b_h1 = b.get("h1") or ""
    c_h1 = c.get("h1") or ""
    if b_h1 and not c_h1:
        add("R05", "CRITICAL", "h1", b_h1, "(missing)",
            "H1 tag removed")

    # R06: H1 changed >50%
    if b_h1 and c_h1 and b_h1 != c_h1:
        pct = _pct_change(b_h1, c_h1)
        if pct > 50:
            add("R06", "CRITICAL", "h1", b_h1, c_h1,
                f"H1 changed by {pct}% — substantial keyword signal shift")

    # R07: Title removed
    b_title = b.get("title") or ""
    c_title = c.get("title") or ""
    if b_title and not c_title:
        add("R07", "CRITICAL", "title", b_title, "(missing)",
            "Title tag removed")

    # R08: Schema type removed
    b_types = set(b.get("json_ld_types") or [])
    c_types = set(c.get("json_ld_types") or [])
    removed_types = b_types - c_types
    if removed_types:
        add("R08", "CRITICAL", "json_ld_types",
            ", ".join(sorted(removed_types)), "(removed)",
            f"Schema type(s) removed: {', '.join(sorted(removed_types))}")

    # --- WARNING rules ---

    # R09: Title changed
    if b_title and c_title and b_title != c_title:
        pct = _pct_change(b_title, c_title)
        add("R09", "WARNING", "title", b_title, c_title,
            f"Title tag changed ({pct}% difference)")

    # R10: Meta description changed
    b_desc = b.get("meta_description") or ""
    c_desc = c.get("meta_description") or ""
    if b_desc and c_desc and b_desc != c_desc:
        add("R10", "WARNING", "meta_description", b_desc, c_desc,
            "Meta description changed")

    # R11: Meta description removed
    if b_desc and not c_desc:
        add("R11", "WARNING", "meta_description", b_desc, "(missing)",
            "Meta description removed")

    # R12: OG tags removed
    b_og = b.get("og_fields") or {}
    c_og = c.get("og_fields") or {}
    removed_og = set(b_og.keys()) - set(c_og.keys())
    if removed_og:
        add("R12", "WARNING", "og_fields",
            ", ".join(sorted(removed_og)), "(removed)",
            f"OG tag(s) removed: {', '.join(sorted(removed_og))}")

    # R13: Schema modified (types changed but not fully removed)
    added_types = c_types - b_types
    if added_types and not removed_types:
        add("R13", "WARNING", "json_ld_types",
            ", ".join(sorted(b_types)), ", ".join(sorted(c_types)),
            f"New schema type(s) added (also INFO R15): {', '.join(sorted(added_types))}")

    # R14: H1 changed ≤50%
    if b_h1 and c_h1 and b_h1 != c_h1:
        pct = _pct_change(b_h1, c_h1)
        if pct <= 50:
            add("R14", "WARNING", "h1", b_h1, c_h1,
                f"H1 changed by {pct}% — moderate keyword shift")

    # R15: Word count dropped >20%
    b_wc = b.get("word_count") or 0
    c_wc = c.get("word_count") or 0
    if b_wc > 0 and c_wc > 0:
        drop_pct = (b_wc - c_wc) / b_wc * 100
        if drop_pct > 20:
            add("R15", "WARNING", "word_count", b_wc, c_wc,
                f"Word count dropped {drop_pct:.1f}% (from {b_wc} to {c_wc})")

    # --- INFO rules ---

    # R16: New schema type added
    if added_types:
        add("R16", "INFO", "json_ld_types",
            "(not present)", ", ".join(sorted(added_types)),
            f"New schema type(s) added: {', '.join(sorted(added_types))}")

    # R17: Content hash changed (anything else changed)
    b_hash = b.get("_content_hash", "")
    c_hash = c.get("_content_hash", "")
    if b_hash and c_hash and b_hash != c_hash:
        add("R17", "INFO", "content_hash", b_hash[:12] + "...", c_hash[:12] + "...",
            "Page content changed (raw HTML hash differs)")

    return findings


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def compare(url: str) -> list[dict]:
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM baselines WHERE url=? ORDER BY captured_at DESC LIMIT 1",
        (url,)
    ).fetchone()
    if not row:
        print(f"No baseline found for {url}. Run drift_baseline.py first.", file=sys.stderr)
        conn.close()
        return []

    baseline_id = row["id"]
    baseline_seo = json.loads(row["seo_data"])
    baseline_seo["_status_code"] = row["status_code"]
    baseline_seo["_content_hash"] = row["content_hash"]

    print(f"Fetching current state: {url}")
    status, raw_headers, body = fetch_page.fetch(url)
    headers = _pick_headers(raw_headers)
    content_hash = hashlib.sha256(body).hexdigest()

    current_seo = parse_seo.parse(body)
    current_seo["response_headers"] = headers
    current_seo["_status_code"] = status
    current_seo["_content_hash"] = content_hash

    findings = run_rules(baseline_seo, current_seo)

    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO comparisons
          (url, compared_at, baseline_id, status_code, content_hash, seo_data, findings)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (url, now, baseline_id, status, content_hash,
         json.dumps(current_seo, ensure_ascii=False),
         json.dumps(findings, ensure_ascii=False)),
    )
    conn.commit()
    conn.close()

    # Print summary
    crits = sum(1 for f in findings if f["severity"] == "CRITICAL")
    warns = sum(1 for f in findings if f["severity"] == "WARNING")
    infos = sum(1 for f in findings if f["severity"] == "INFO")
    print(f"\nResult: {crits} CRITICAL / {warns} WARNING / {infos} INFO\n")

    if findings:
        fmt = "{:<12} {:<10} {:<20} {:<50} {:<50}"
        print(fmt.format("SEVERITY", "RULE", "FIELD", "OLD VALUE", "NEW VALUE"))
        print("-" * 145)
        for f in findings:
            print(fmt.format(
                f["severity"], f["rule"], f["field"],
                str(f["old_value"])[:48], str(f["new_value"])[:48]
            ))
    else:
        print("No drift detected.")

    return findings


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/drift_compare.py <url>", file=sys.stderr)
        sys.exit(1)
    compare(sys.argv[1])


if __name__ == "__main__":
    main()

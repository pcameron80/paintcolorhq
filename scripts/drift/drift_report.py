#!/usr/bin/env python3
"""
drift_report.py — Generate an HTML report from a drift comparison record or baseline dump.

Usage:
    python scripts/drift_report.py --url <url> --output report.html
    python scripts/drift_report.py --all-baselines --output baseline_report.html
"""

import argparse
import json
import os
import sys
from datetime import datetime

_DRIFT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _DRIFT_DIR)

from drift_baseline import _get_conn  # noqa: E402

_SEVERITY_COLOR = {
    "CRITICAL": "#dc2626",
    "WARNING":  "#d97706",
    "INFO":     "#2563eb",
}

_CSS = """
body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #f9fafb; color: #111; }
h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
h2 { font-size: 1.1rem; margin-top: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; }
.meta { color: #6b7280; font-size: 0.85rem; margin-bottom: 2rem; }
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 2rem; }
th { background: #f3f4f6; text-align: left; padding: 6px 10px; border: 1px solid #e5e7eb; }
td { padding: 6px 10px; border: 1px solid #e5e7eb; vertical-align: top; word-break: break-word; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem;
         font-weight: 600; color: #fff; }
.badge-CRITICAL { background: #dc2626; }
.badge-WARNING  { background: #d97706; }
.badge-INFO     { background: #2563eb; }
.no-findings    { color: #16a34a; font-weight: 600; }
.section        { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
                  padding: 1.5rem; margin-bottom: 1.5rem; }
pre { background: #f3f4f6; padding: 0.75rem; border-radius: 4px; font-size: 0.8rem;
      overflow-x: auto; white-space: pre-wrap; }
"""


def _badge(severity: str) -> str:
    return f'<span class="badge badge-{severity}">{severity}</span>'


def _baseline_section(b) -> str:
    seo = json.loads(b["seo_data"])
    headers = seo.get("response_headers", {})
    og = seo.get("og_fields", {})
    h2s = seo.get("h2s", [])
    types = seo.get("json_ld_types", [])

    def row(label, val):
        val = val if val is not None else "<em>not set</em>"
        return f"<tr><th>{label}</th><td>{val}</td></tr>"

    commit = (b["commit_sha"] or "unknown")[:12]
    h = (b["content_hash"] or "")[:16] + "..."

    rows = [
        row("Captured at", b["captured_at"]),
        row("Commit SHA", commit),
        row("Status code", b["status_code"]),
        row("Content SHA-256", h),
        row("Cache-Control", headers.get("cache-control")),
        row("x-vercel-cache", headers.get("x-vercel-cache")),
        row("x-nextjs-prerender", headers.get("x-nextjs-prerender")),
        row("Title", seo.get("title")),
        row("Meta description", seo.get("meta_description")),
        row("Canonical", seo.get("canonical")),
        row("Robots meta", seo.get("robots_meta")),
        row("H1", seo.get("h1")),
        row("H2s", "<br>".join(h2s) if h2s else "<em>none</em>"),
        row("JSON-LD types", ", ".join(types) if types else "<em>none</em>"),
        row("OG fields", "<br>".join(f"<b>{k}</b>: {v}" for k, v in og.items()) if og else "<em>none</em>"),
        row("Internal links", seo.get("internal_link_count")),
        row("Word count", seo.get("word_count")),
        row("Images (total)", seo.get("image_count")),
        row("Images with alt", seo.get("images_with_alt")),
    ]

    return f"""
<div class="section">
  <h2>{b['url']}</h2>
  <table>{''.join(rows)}</table>
</div>
"""


def generate_baseline_report(output_path: str):
    conn = _get_conn()
    # Get most recent baseline per URL
    rows = conn.execute("""
        SELECT b.* FROM baselines b
        INNER JOIN (
            SELECT url, MAX(captured_at) AS max_at FROM baselines GROUP BY url
        ) latest ON b.url = latest.url AND b.captured_at = latest.max_at
        ORDER BY b.url
    """).fetchall()
    conn.close()

    sections = "".join(_baseline_section(b) for b in rows)
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SEO Drift Baselines — PaintColorHQ</title>
<style>{_CSS}</style>
</head>
<body>
<h1>SEO Drift Baselines — PaintColorHQ</h1>
<p class="meta">Generated: {now} &nbsp;|&nbsp; {len(rows)} URL(s) baselined</p>
{sections}
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Report written to: {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", help="Filter to a single URL")
    parser.add_argument("--all-baselines", action="store_true",
                        help="Dump all baselines (latest per URL)")
    parser.add_argument("--output", required=True, help="Output HTML file path")
    args = parser.parse_args()

    if args.all_baselines or not args.url:
        generate_baseline_report(args.output)
    else:
        # Single URL baseline report (reuse same renderer)
        conn = _get_conn()
        row = conn.execute(
            "SELECT * FROM baselines WHERE url=? ORDER BY captured_at DESC LIMIT 1",
            (args.url,)
        ).fetchone()
        conn.close()
        if not row:
            print(f"No baseline for {args.url}", file=sys.stderr)
            sys.exit(1)

        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SEO Baseline — {args.url}</title>
<style>{_CSS}</style>
</head>
<body>
<h1>SEO Baseline</h1>
<p class="meta">Generated: {now}</p>
{_baseline_section(row)}
</body>
</html>"""
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Report written to: {args.output}")


if __name__ == "__main__":
    main()

"""
parse_seo.py — Extract SEO signals from HTML bytes.

Returns a dict with all fields the drift schema tracks:
  title, meta_description, canonical, robots_meta,
  h1, h2s, json_ld_types, og_fields,
  internal_link_count, word_count,
  image_count, images_with_alt
"""

import json
import re
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Low-level HTML parser
# ---------------------------------------------------------------------------

class _SEOParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title: Optional[str] = None
        self.meta_description: Optional[str] = None
        self.canonical: Optional[str] = None
        self.robots_meta: Optional[str] = None
        self.h1s: List[str] = []
        self.h2s: List[str] = []
        self.og_fields: Dict[str, str] = {}
        self.json_ld_blocks: List[str] = []
        self.internal_links: int = 0
        self.images: int = 0
        self.images_with_alt: int = 0

        self._in_title = False
        self._in_heading: Optional[str] = None
        self._in_json_ld = False
        self._json_ld_buf: List[str] = []
        self._in_body = False
        self._in_nav = False
        self._in_footer = False
        self._nav_depth = 0
        self._footer_depth = 0
        self._body_text_parts: List[str] = []
        self._skip_tags = {"script", "style", "noscript"}
        self._in_skip = 0
        self._skip_depth = 0

    # --- tag handlers -------------------------------------------------------

    def handle_starttag(self, tag: str, attrs):
        attr = dict(attrs)

        if tag == "body":
            self._in_body = True

        # nav / footer exclusion for internal link count
        if tag in ("nav", "header"):
            self._in_nav = True
            self._nav_depth += 1
        if tag == "footer":
            self._in_footer = True
            self._footer_depth += 1

        if tag in self._skip_tags:
            self._in_skip += 1

        if tag == "title":
            self._in_title = True

        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._in_heading = tag

        if tag == "meta":
            name = (attr.get("name") or "").lower()
            prop = (attr.get("property") or "").lower()
            content = attr.get("content", "")
            if name == "description":
                self.meta_description = content
            elif name == "robots":
                self.robots_meta = content
            elif prop.startswith("og:"):
                self.og_fields[prop] = content

        if tag == "link":
            if (attr.get("rel") or "").lower() == "canonical":
                self.canonical = attr.get("href")

        if tag == "script" and (attr.get("type") or "") == "application/ld+json":
            self._in_json_ld = True
            self._json_ld_buf = []

        if tag == "a":
            href = attr.get("href", "")
            if href.startswith("/") and not self._in_nav and not self._in_footer:
                self.internal_links += 1

        if tag == "img":
            self.images += 1
            if attr.get("alt", "").strip():
                self.images_with_alt += 1

    def handle_endtag(self, tag: str):
        if tag == "title":
            self._in_title = False
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._in_heading = None

        if tag in ("nav", "header"):
            self._nav_depth -= 1
            if self._nav_depth <= 0:
                self._in_nav = False
                self._nav_depth = 0
        if tag == "footer":
            self._footer_depth -= 1
            if self._footer_depth <= 0:
                self._in_footer = False
                self._footer_depth = 0

        if tag in self._skip_tags and not self._in_json_ld:
            self._in_skip = max(0, self._in_skip - 1)

        if tag == "script" and self._in_json_ld:
            self._in_json_ld = False
            self.json_ld_blocks.append("".join(self._json_ld_buf))
            self._json_ld_buf = []

    def handle_data(self, data: str):
        if self._in_title:
            self.title = (self.title or "") + data

        if self._in_heading == "h1":
            if self.h1s:
                self.h1s[-1] += data
            else:
                self.h1s.append(data)
        elif self._in_heading == "h2":
            if self.h2s:
                self.h2s[-1] += data
            else:
                self.h2s.append(data)

        if self._in_json_ld:
            self._json_ld_buf.append(data)

        if self._in_body and self._in_skip == 0 and not self._in_nav and not self._in_footer:
            self._body_text_parts.append(data)

    def handle_starttag_self_closing(self, tag: str, attrs):
        """Some parsers call this; delegate to handle_starttag."""
        self.handle_starttag(tag, attrs)


# ---------------------------------------------------------------------------
# JSON-LD type extraction
# ---------------------------------------------------------------------------

def _extract_json_ld_types(blocks: List[str]) -> List[str]:
    types: List[str] = []
    for raw in blocks:
        raw = raw.strip()
        if not raw:
            continue
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            continue
        _collect_types(obj, types)
    return types


def _collect_types(obj: Any, out: List[str]) -> None:
    if isinstance(obj, dict):
        t = obj.get("@type")
        if isinstance(t, str):
            out.append(t)
        elif isinstance(t, list):
            out.extend(t)
        for v in obj.values():
            _collect_types(v, out)
    elif isinstance(obj, list):
        for item in obj:
            _collect_types(item, out)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse(html_bytes: bytes) -> Dict[str, Any]:
    try:
        html = html_bytes.decode("utf-8", errors="replace")
    except Exception:
        html = str(html_bytes)

    parser = _SEOParser()
    parser.feed(html)

    # Word count from body text, stripped of extra whitespace
    body_text = " ".join(parser._body_text_parts)
    words = re.findall(r"\b\w+\b", body_text)
    word_count = len(words)

    # Clean heading text
    h1 = " ".join(parser.h1s).strip() if parser.h1s else None
    h2s = [h.strip() for h in parser.h2s if h.strip()]

    # Deduplicate h2s while preserving order
    seen: Dict[str, bool] = {}
    h2s_deduped: List[str] = []
    for h in h2s:
        if h not in seen:
            seen[h] = True
            h2s_deduped.append(h)

    return {
        "title": (parser.title or "").strip() or None,
        "meta_description": parser.meta_description,
        "canonical": parser.canonical,
        "robots_meta": parser.robots_meta or "index, follow",
        "h1": h1,
        "h2s": h2s_deduped,
        "json_ld_types": sorted(set(_extract_json_ld_types(parser.json_ld_blocks))),
        "og_fields": parser.og_fields,
        "internal_link_count": parser.internal_links,
        "word_count": word_count,
        "image_count": parser.images,
        "images_with_alt": parser.images_with_alt,
    }

"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    // Find all h2s inside the closest prose block
    const article = document.querySelector("article .prose");
    if (!article) return;

    const headings = article.querySelectorAll("h2");
    if (headings.length < 3) return; // Only show TOC for posts with 3+ sections

    const tocItems: TocItem[] = [];
    headings.forEach((h, i) => {
      // Add an id if missing
      if (!h.id) {
        h.id = `section-${i}`;
      }
      tocItems.push({
        id: h.id,
        text: h.textContent?.trim() ?? "",
        level: 2,
      });
    });

    setItems(tocItems);
  }, []);

  if (items.length === 0) return null;

  return (
    <details className="mb-8 rounded-lg border border-gray-200 bg-gray-50">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700 select-none">
        Jump to section ({items.length})
      </summary>
      <nav className="px-4 pb-3">
        <ol className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="block rounded px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}

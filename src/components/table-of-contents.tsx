"use client";

import { useEffect, useSyncExternalStore } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const EMPTY: TocItem[] = [];

// The headings are server-rendered siblings of this component, so the DOM is
// an external store read with useSyncExternalStore rather than copied into
// state from an effect. The post body does not add or remove h2s after load,
// so there is nothing to subscribe to.
function subscribe(): () => void {
  return () => {};
}

function getHeadings(): HTMLHeadingElement[] {
  // Find all h2s inside the closest prose block
  const article = document.querySelector("article .prose");
  if (!article) return [];
  const headings = Array.from(article.querySelectorAll("h2"));
  return headings.length < 3 ? [] : headings; // Only show TOC for posts with 3+ sections
}

const headingId = (h: HTMLHeadingElement, i: number) => h.id || `section-${i}`;

// getSnapshot must return the same reference while the data is unchanged, or
// React re-renders forever. Cache on a string key of the ids and texts.
let cachedKey = "";
let cachedItems: TocItem[] = EMPTY;

function getSnapshot(): TocItem[] {
  const headings = getHeadings();
  if (headings.length === 0) return EMPTY;
  const items = headings.map((h, i) => ({
    id: headingId(h, i),
    text: h.textContent?.trim() ?? "",
    level: 2,
  }));
  const key = items.map((item) => `${item.id}\u0000${item.text}`).join("\u0001");
  if (key !== cachedKey) {
    cachedKey = key;
    cachedItems = items;
  }
  return cachedItems;
}

function getServerSnapshot(): TocItem[] {
  return EMPTY;
}

export function TableOfContents() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Give id-less headings the ids the links point at. Writing to the DOM is
  // the side effect an effect is for; it runs before the user can click.
  useEffect(() => {
    getHeadings().forEach((h, i) => {
      if (!h.id) h.id = headingId(h, i);
    });
  }, [items]);

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

"use client";

import { useEffect, useRef } from "react";

/**
 * Client-side enhancer that finds all links pointing to /colors/[brand]/[slug]
 * within a container and adds:
 * 1. An inline swatch dot (fetched from /api/color-hex endpoint)
 * 2. A hover tooltip with a larger swatch preview
 *
 * Drop this component after any block that contains editorial color links.
 */
export function ColorLinkEnhancer({ containerRef }: { containerRef: string }) {
  const enhanced = useRef(false);

  useEffect(() => {
    if (enhanced.current) return;
    enhanced.current = true;

    const container = document.getElementById(containerRef);
    if (!container) return;

    // Find all links that point to /colors/ pages
    const colorLinks = container.querySelectorAll<HTMLAnchorElement>(
      'a[href*="/colors/"][href*="/"]'
    );

    colorLinks.forEach(async (link) => {
      const href = link.getAttribute("href");
      if (!href) return;

      // Extract brand and color slug from href like /colors/sherwin-williams/agreeable-gray-sw-7029
      const match = href.match(/\/colors\/([^/]+)\/([^/]+)/);
      if (!match) return;

      // Skip links to family pages or brand index pages
      if (match[1] === "family") return;

      try {
        // Fetch the hex from our search API using the color slug
        const slug = match[2];
        const res = await fetch(`/api/color-hex?brand=${match[1]}&slug=${slug}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.hex) return;

        const hex = data.hex;

        // Add inline swatch dot before link text
        const dot = document.createElement("span");
        dot.className = "inline-block h-2.5 w-2.5 rounded-full shrink-0 shadow-sm align-middle mr-1";
        dot.style.backgroundColor = hex;
        dot.style.display = "inline-block";
        dot.style.verticalAlign = "middle";
        link.insertBefore(dot, link.firstChild);

        // Make the link position relative for tooltip
        link.style.position = "relative";

        // Create hover tooltip
        const tooltip = document.createElement("span");
        tooltip.className = "pointer-events-none absolute z-50 flex flex-col items-center gap-1 transition-opacity duration-200";
        tooltip.style.cssText = "opacity:0; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);";

        const swatch = document.createElement("span");
        swatch.style.cssText = `display:block; width:56px; height:56px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); border:2px solid white; background-color:${hex};`;

        const label = document.createElement("span");
        label.style.cssText = "font-size:9px; font-family:monospace; background:white; padding:2px 6px; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.1); white-space:nowrap;";
        label.textContent = hex.toUpperCase();

        tooltip.appendChild(swatch);
        tooltip.appendChild(label);
        link.appendChild(tooltip);

        link.addEventListener("mouseenter", () => { tooltip.style.opacity = "1"; });
        link.addEventListener("mouseleave", () => { tooltip.style.opacity = "0"; });
      } catch {
        // Silently skip if fetch fails
      }
    });
  }, [containerRef]);

  return null;
}

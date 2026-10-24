"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isNonTrackedPath } from "@/lib/consent";
import {
  initScrollDepthTracking,
  initTimeOnPageTracking,
  trackSwatchClick,
  trackRetailerClick,
} from "@/lib/analytics";
import { classifyOutboundLink } from "@/lib/outbound-link";

export function AnalyticsProvider() {
  const pathname = usePathname();

  // Click delegation, once per document.
  useEffect(() => {
    // Event delegation for color swatch clicks and outbound (retailer) links.
    // auxclick catches middle-click "open in new tab", which never fires click.
    function handleClick(e: MouseEvent) {
      if (e.type === "auxclick" && e.button !== 1) return;
      // Don't run site analytics inside the embeddable widget (third-party iframes).
      if (isNonTrackedPath(window.location.pathname)) return;
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href") ?? "";

      // Color swatch click: links matching /colors/{brand}/{slug}
      const colorMatch = href.match(/^\/colors\/([^/]+)\/([^/]+)$/);
      if (colorMatch) {
        // Blog swatches carry their data in data-* attributes
        if (link.dataset.swatchSource) {
          trackSwatchClick(
            link.dataset.swatchName ?? "",
            colorMatch[1],
            link.dataset.swatchHex ?? "",
            undefined,
            link.dataset.swatchSource,
          );
          return;
        }
        // Extract color info from the card's text content
        const card = link.closest(".group") ?? link;
        const nameEl = card.querySelector("p.font-medium, p:first-child");
        const colorName = nameEl?.textContent?.trim() ?? "";
        const brandSlug = colorMatch[1];
        const hexEl = card.querySelector(".font-mono");
        const hex = hexEl?.textContent?.trim() ?? "";

        if (colorName) {
          trackSwatchClick(colorName, brandSlug, hex);
        }
        return;
      }

      // Outbound click: any external http(s) link except share, social and
      // our own hosts (rules and tests in src/lib/outbound-link.ts).
      const outbound = classifyOutboundLink(link.href, {
        pagePath: window.location.pathname,
        pageHost: window.location.hostname,
        rel: link.getAttribute("rel"),
      });
      if (outbound) {
        // Nearest heading, kept from the old handler for continuity.
        const section = link.closest("section, article, main, [class*=retailer]");
        const colorName = section?.querySelector("h1, h2")?.textContent?.trim() || undefined;
        trackRetailerClick({ ...outbound, color_name: colorName });
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("auxclick", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("auxclick", handleClick);
    };
  }, []);

  // Scroll depth and time on page restart on every pathname change, so a
  // page reached by a soft navigation gets its own milestones.
  useEffect(() => {
    if (!pathname || isNonTrackedPath(pathname)) return;
    const stopScroll = initScrollDepthTracking(pathname);
    const stopTime = initTimeOnPageTracking(pathname);
    return () => {
      stopScroll();
      stopTime();
    };
  }, [pathname]);

  return null;
}

"use client";

import { useEffect } from "react";
import {
  initScrollDepthTracking,
  initTimeOnPageTracking,
  trackSwatchClick,
  trackRetailerClick,
} from "@/lib/analytics";

export function AnalyticsProvider() {
  useEffect(() => {
    initScrollDepthTracking();
    initTimeOnPageTracking();

    // Event delegation for color swatch clicks and retailer links
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href") ?? "";

      // Color swatch click: links matching /colors/{brand}/{slug}
      const colorMatch = href.match(/^\/colors\/([^/]+)\/([^/]+)$/);
      if (colorMatch) {
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

      // Retailer outbound click: external links to paint stores
      if (link.hostname && link.hostname !== window.location.hostname) {
        const retailerDomains = [
          "sherwin-williams.com",
          "benjaminmoore.com",
          "behr.com",
          "ppgpaints.com",
          "dunnedwards.com",
          "valspar.com",
          "farrow-ball.com",
          "amazon.com",
          "homedepot.com",
          "lowes.com",
        ];

        const isRetailer = retailerDomains.some((d) => link.hostname.includes(d));
        if (isRetailer) {
          // Try to find brand/color context from nearest heading or card
          const section = link.closest("section, article, main, [class*=retailer]");
          const brandText = section?.querySelector("h1, h2")?.textContent?.trim() ?? "";
          trackRetailerClick(link.href, link.hostname, brandText);
        }
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

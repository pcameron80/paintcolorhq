type GtagEvent = {
  [key: string]: string | number | undefined;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: GtagEvent) {
  if (typeof window === "undefined") return;
  if (window.gtag) {
    window.gtag("event", eventName, params);
  } else {
    // gtag not ready yet — queue and retry when it loads
    const check = setInterval(() => {
      if (window.gtag) {
        clearInterval(check);
        window.gtag("event", eventName, params);
      }
    }, 200);
    // Give up after 5s
    setTimeout(() => clearInterval(check), 5000);
  }
}

// --- Tool engagement (open / use / complete) ---

export function trackToolEngagement(
  toolName: string,
  action: "open" | "use" | "complete",
  colorInput?: string,
) {
  trackEvent("tool_use", {
    tool_name: toolName,
    tool_action: action,
    page_type: "tool",
    color_input: colorInput,
  });
}

// --- Color swatch click (from listings, blog, homepage) ---

export function trackSwatchClick(
  colorName: string,
  brand: string,
  hexCode: string,
  colorCode?: string,
) {
  trackEvent("color_swatch_click", {
    color_name: colorName,
    color_brand: brand,
    color_code: colorCode,
    hex_code: hexCode,
    source_page: typeof window !== "undefined" ? window.location.pathname : undefined,
  });
}

// --- Search events ---

export function trackColorSearch(searchTerm: string, resultCount: number) {
  trackEvent("color_search", {
    search_term: searchTerm,
    page_type: "search",
    result_count: resultCount,
  });
}

// --- Compare events ---

export function trackCompare(
  color1: string,
  color2: string,
  brand1: string,
  brand2: string,
) {
  trackEvent("color_search", {
    color_1: color1,
    color_2: color2,
    color_brand: `${brand1} vs ${brand2}`,
    page_type: "compare",
    colors_compared: 2,
  });
}

// --- Blog events ---

export function trackBlogRead(slug: string, category?: string) {
  trackEvent("blog_read", {
    page_type: "blog",
    content_category: category,
    blog_slug: slug,
  });
}

// --- Retailer outbound click ---

export function trackRetailerClick(outboundUrl: string, brand: string, colorName: string) {
  trackEvent("retailer_click", {
    outbound_url: outboundUrl,
    color_brand: brand,
    color_name: colorName,
    source_page: typeof window !== "undefined" ? window.location.pathname : undefined,
  });
}

// --- Page view enrichment (for color/brand/family pages) ---

export function trackPageView(params: GtagEvent) {
  trackEvent("page_view_enriched", params);
}

// --- Scroll depth (25 / 50 / 90) ---

export function initScrollDepthTracking() {
  if (typeof window === "undefined") return;

  const thresholds = [25, 50, 90];
  const fired = new Set<number>();

  function onScroll() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const pct = Math.round((window.scrollY / scrollHeight) * 100);

    for (const t of thresholds) {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        trackEvent("scroll_depth", {
          percent_scrolled: String(t),
          page_slug: window.location.pathname,
          page_type: detectPageType(),
        });
      }
    }

    if (fired.size === thresholds.length) {
      window.removeEventListener("scroll", onScroll);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}

// --- Time on page (30s / 60s / 120s / 300s) ---

export function initTimeOnPageTracking() {
  if (typeof window === "undefined") return;

  const buckets = [30, 60, 120, 300];
  const timers: ReturnType<typeof setTimeout>[] = [];

  for (const seconds of buckets) {
    timers.push(
      setTimeout(() => {
        trackEvent("time_on_page", {
          time_bucket: `${seconds}s`,
          page_slug: window.location.pathname,
          page_type: detectPageType(),
        });
      }, seconds * 1000),
    );
  }

  // Clean up on navigation
  const cleanup = () => {
    for (const t of timers) clearTimeout(t);
    window.removeEventListener("beforeunload", cleanup);
  };
  window.addEventListener("beforeunload", cleanup);
}

// --- Helpers ---

function detectPageType(): string {
  if (typeof window === "undefined") return "unknown";
  const path = window.location.pathname;
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/tools")) return "tool";
  if (path.startsWith("/brands")) return "brand";
  if (path.startsWith("/colors/family")) return "family";
  if (path.startsWith("/colors")) return "color";
  if (path.startsWith("/match")) return "match";
  if (path.startsWith("/compare")) return "compare";
  if (path.startsWith("/search")) return "search";
  if (path === "/") return "homepage";
  return "other";
}

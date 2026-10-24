type GtagEvent = {
  [key: string]: string | number | boolean | undefined;
};

type PlausibleFn = ((event: string, options?: { props?: Record<string, string> }) => void) & { q?: unknown[] };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: PlausibleFn;
  }
}

// GA4 events that are also Plausible goals (cookieless, so they count visitors
// who decline cookies). Plausible goal names must match these exactly.
const PLAUSIBLE_GOALS: Record<string, string> = {
  retailer_click: "Retailer Click",
  color_search: "Color Search",
  color_compare: "Compare",
  web_vitals: "Web Vitals",
};

function sendToPlausible(eventName: string, params?: GtagEvent) {
  let goal = PLAUSIBLE_GOALS[eventName];
  // Only an actual use counts; "open" fires on every tool page load. The
  // palette generator, color identifier and paint calculator only fire
  // "complete", so that counts too.
  if (eventName === "tool_use" && (params?.tool_action === "use" || params?.tool_action === "complete")) goal = "Tool Use";
  if (!goal) return;
  const props: Record<string, string> = {};
  if (eventName === "tool_use" && params?.tool_name) props.tool = String(params.tool_name);
  // Search terms show what visitors want and cannot find. Lowercased and
  // capped so the property stays a short, groupable value.
  if (eventName === "color_search" && params?.search_term) {
    props.term = String(params.search_term).trim().toLowerCase().slice(0, 50);
    props.results = Number(params.result_count) > 0 ? "some" : "none";
  }
  if (eventName === "retailer_click") {
    // brand is now the color's brand slug (it was the link hostname before
    // 2026-10-26); retailer carries the hostname.
    if (params?.color_brand) props.brand = String(params.color_brand);
    if (params?.retailer) props.retailer = String(params.retailer);
    if (params?.affiliate) props.affiliate = String(params.affiliate);
  }
  if (eventName === "web_vitals") {
    if (params?.metric_name) props.metric = String(params.metric_name);
    if (params?.metric_rating) props.rating = String(params.metric_rating);
    if (params?.page_type) props.page_type = String(params.page_type);
  }
  // Queue until the script loads (it replays window.plausible.q). The script
  // only loads on the production host, so elsewhere this queue is never sent.
  const fn: PlausibleFn =
    window.plausible ??
    Object.assign((...args: unknown[]) => {
      (fn.q = fn.q || []).push(args);
    }, {} as { q?: unknown[] });
  window.plausible = fn;
  fn(goal, Object.keys(props).length ? { props } : undefined);
}

export function trackEvent(eventName: string, params?: GtagEvent) {
  if (typeof window === "undefined") return;
  sendToPlausible(eventName, params);
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
  source?: string,
) {
  trackEvent("color_swatch_click", {
    swatch_source: source,
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
  trackEvent("color_compare", {
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

export interface RetailerClickParams {
  outbound_url: string;
  retailer: string;
  color_brand?: string;
  color_slug?: string;
  affiliate: "true" | "false";
  color_name?: string;
}

export function trackRetailerClick(p: RetailerClickParams) {
  trackEvent("retailer_click", {
    ...p,
    source_page: typeof window !== "undefined" ? window.location.pathname : undefined,
  });
}

// --- Page view enrichment (for color/brand/family pages) ---

export function trackPageView(params: GtagEvent) {
  trackEvent("page_view_enriched", params);
}

// --- Scroll depth (25 / 50 / 90) ---

/**
 * Starts scroll-depth milestones for the page at `path` and returns a cleanup.
 * The path and page type are captured at start, so a milestone can never be
 * tagged with the next page's URL. AnalyticsProvider restarts it on every
 * pathname change, so soft navigations get their own milestones.
 */
export function initScrollDepthTracking(path: string): () => void {
  if (typeof window === "undefined") return () => {};

  const pageType = detectPageType(path);
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
          page_slug: path,
          page_type: pageType,
        });
      }
    }

    if (fired.size === thresholds.length) {
      window.removeEventListener("scroll", onScroll);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

// --- Time on page (30s / 60s / 120s / 300s) ---

/** Starts dwell-time buckets for the page at `path`; returns a cleanup. */
export function initTimeOnPageTracking(path: string): () => void {
  if (typeof window === "undefined") return () => {};

  const pageType = detectPageType(path);
  const buckets = [30, 60, 120, 300];
  const timers = buckets.map((seconds) =>
    setTimeout(() => {
      trackEvent("time_on_page", {
        time_bucket: `${seconds}s`,
        page_slug: path,
        page_type: pageType,
      });
    }, seconds * 1000),
  );

  return () => {
    for (const t of timers) clearTimeout(t);
  };
}

// --- Helpers ---

const MATCH_LISTING_PATH = /^\/match\/[^/]+\/to\/[^/]+\/?$/;

/** Page type for a pathname; uses the same values as each route's TrackPage. */
export function detectPageType(path: string): string {
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/tools")) return "tool";
  if (path.startsWith("/brands")) return "brand";
  if (path.startsWith("/colors/family")) return "family";
  if (path.startsWith("/colors/hue")) return "hue_band";
  if (path.startsWith("/colors")) return "color";
  if (path === "/match" || path === "/match/") return "match_hub";
  if (MATCH_LISTING_PATH.test(path)) return "match_listing";
  if (path.startsWith("/match")) return "match";
  if (path.startsWith("/inspiration")) return "inspiration";
  if (path.startsWith("/compare")) return "compare";
  if (path.startsWith("/color-of-the-year")) return "color_of_the_year";
  if (path.startsWith("/search")) return "search";
  if (path === "/") return "homepage";
  return "other";
}

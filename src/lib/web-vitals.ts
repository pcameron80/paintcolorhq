// Field Core Web Vitals per page type, sent as GA4 `web_vitals` (GA4 only;
// see PLAUSIBLE_GOALS in analytics.ts for why not Plausible). Taken before the ad tag goes in so its cost can be measured
// against a per-template baseline (CrUX only has origin-level data for us).
// Pure helpers; the hook lives in src/components/web-vitals-reporter.tsx.

/** The five metrics we keep. FID is retired in favor of INP and is dropped. */
export const REPORTED_METRICS = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);

/** Hard ceiling per document, on top of one report per metric id. */
export const MAX_VITALS_PER_DOCUMENT = 10;

export interface VitalsMetric {
  id: string;
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
}

/** ms rounded for timings; CLS is unitless, so x1000 to keep an integer. */
export function vitalsValue(name: string, value: number): number {
  return Math.round(name === "CLS" ? value * 1000 : value);
}

export function vitalsParams(metric: VitalsMetric, pageType: string) {
  return {
    metric_name: metric.name,
    metric_value: vitalsValue(metric.name, metric.value),
    metric_rating: metric.rating ?? "unknown",
    navigation_type: metric.navigationType ?? "unknown",
    page_type: pageType,
    non_interaction: true,
    transport_type: "beacon",
  };
}

/**
 * Gate that keeps web_vitals from flooding GA4: one event per metric id, only
 * the five metrics above, and never more than MAX_VITALS_PER_DOCUMENT. In
 * practice that is five per page load (CLS and INP report once, on page hide).
 */
export function createVitalsGate(max = MAX_VITALS_PER_DOCUMENT) {
  const seen = new Set<string>();
  return (metric: VitalsMetric): boolean => {
    if (!REPORTED_METRICS.has(metric.name)) return false;
    if (seen.has(metric.id) || seen.size >= max) return false;
    seen.add(metric.id);
    return true;
  };
}

"use client";

import { useReportWebVitals } from "next/web-vitals";
import { detectPageType, trackEvent } from "@/lib/analytics";
import { isNonTrackedPath } from "@/lib/consent";
import { createVitalsGate, vitalsParams } from "@/lib/web-vitals";

// Vitals describe the document as loaded, and CLS and INP report on page hide,
// possibly after soft navigations. So the page type is the landing page's,
// captured when this module first runs in the browser.
const landingPath = typeof window === "undefined" ? "" : window.location.pathname;
const allow = createVitalsGate();

// Module-level so its identity never changes: useReportWebVitals re-registers
// every observer when the callback changes, which would duplicate reports.
function report(metric: Parameters<Parameters<typeof useReportWebVitals>[0]>[0]) {
  if (!landingPath || isNonTrackedPath(landingPath)) return;
  if (!allow(metric)) return;
  trackEvent("web_vitals", vitalsParams(metric, detectPageType(landingPath)));
}

export function WebVitalsReporter() {
  useReportWebVitals(report);
  return null;
}

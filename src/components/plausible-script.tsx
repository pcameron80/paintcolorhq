"use client";

import { useEffect } from "react";
import { isNonTrackedPath } from "@/lib/consent";

// Cookieless page-view counts from our self-hosted Plausible. It sets no
// cookies and stores nothing on the device, so it loads for every visitor
// without the consent banner. Production host only: previews and local dev
// would otherwise report as paintcolorhq.com.
export function PlausibleScript() {
  useEffect(() => {
    if (window.location.hostname !== "www.paintcolorhq.com") return;
    if (isNonTrackedPath(window.location.pathname)) return;
    if (document.querySelector("script[data-plausible]")) return;
    const s = document.createElement("script");
    s.defer = true;
    s.src = "/stats/js/script.js";
    s.setAttribute("data-domain", "paintcolorhq.com");
    s.setAttribute("data-api", "/stats/api/event");
    s.setAttribute("data-plausible", "");
    document.head.appendChild(s);
  }, []);
  return null;
}

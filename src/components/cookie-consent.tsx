"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  CONSENT_STORAGE_KEY,
  OPEN_PRIVACY_CHOICES_EVENT,
  REGULATED_REGIONS,
  isNonTrackedPath,
  fetchConsentRegion,
  getStoredConsent,
  setStoredConsent,
} from "@/lib/consent";

// Runs before gtag.js loads. Region-specific defaults come first so gtag can
// deny regulated visitors on its own geo lookup before ours has returned; a
// stored choice or a GPC signal is applied immediately after.
const GTAG_INIT = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
    region: ${JSON.stringify(REGULATED_REGIONS)},
    wait_for_update: 500
  });
  gtag('consent', 'default', {
    analytics_storage: 'granted', ad_storage: 'granted',
    ad_user_data: 'granted', ad_personalization: 'granted'
  });
  var stored = null;
  try { stored = localStorage.getItem('${CONSENT_STORAGE_KEY}'); } catch (e) {}
  if (stored === 'granted' || stored === 'denied') {
    gtag('consent', 'update', {
      analytics_storage: stored, ad_storage: stored,
      ad_user_data: stored, ad_personalization: stored
    });
  } else if (navigator.globalPrivacyControl === true) {
    gtag('consent', 'update', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    });
  }
  gtag('ads_data_redaction', true);
  gtag('js', new Date());
  // ?debug=true marks this browser internal for GA4 and Plausible until
  // ?debug=false clears it (it used to cover only the one page view).
  var internalFlag = false;
  try {
    if (location.search.indexOf('debug=true') !== -1) {
      localStorage.setItem('pchq_internal', '1');
      localStorage.setItem('plausible_ignore', 'true');
    } else if (location.search.indexOf('debug=false') !== -1) {
      localStorage.removeItem('pchq_internal');
      localStorage.removeItem('plausible_ignore');
    }
    internalFlag = localStorage.getItem('pchq_internal') === '1';
  } catch (e) {}
  var isInternal = (
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname.endsWith('.vercel.app') ||
    location.search.indexOf('debug=true') !== -1 ||
    internalFlag
  );
  // Headless scrapers that became visible once consent stopped gating gtag
  // (2026-10-02): Windows Chrome at screen sizes real visitors almost never
  // have, ~4s sessions, ~0% engagement. Tagged so a GA4 data filter on
  // traffic_type 'bot' can drop them; nothing else about the page changes.
  var sr = screen.width + 'x' + screen.height;
  var ua = navigator.userAgent;
  var isBot = navigator.webdriver === true ||
    (/Windows/.test(ua) && ['1280x1200', '800x600', '600x800', '1600x1600'].indexOf(sr) !== -1) ||
    (/Linux/.test(ua) && !/Android/.test(ua) && sr === '1440x900');
  var trafficType = isInternal ? 'internal' : isBot ? 'bot' : null;
  gtag('config', 'G-056NR93JLK', trafficType ? { traffic_type: trafficType } : {});
`;

export function CookieConsent() {
  // The embeddable widget runs inside third-party iframes, and /admin is the
  // owner's own traffic: never show a banner or load GA there. Everywhere else
  // the gtag scripts render immediately, server HTML included, instead of
  // waiting on the uncached /api/geo lookup (155-171 ms). Regulated visitors
  // are still covered: GTAG_INIT's region-scoped consent defaults deny them on
  // gtag's own geo lookup before any hit is sent.
  const pathname = usePathname();
  const tracked = !!pathname && !isNonTrackedPath(pathname);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!tracked) return;
    let active = true;
    // The geo lookup now only decides whether to show the banner.
    fetchConsentRegion().then((r) => {
      if (!active) return;
      if (!getStoredConsent() && r === "regulated") setVisible(true);
    });

    const onOpen = () => setVisible(true);
    window.addEventListener(OPEN_PRIVACY_CHOICES_EVENT, onOpen);
    return () => {
      active = false;
      window.removeEventListener(OPEN_PRIVACY_CHOICES_EVENT, onOpen);
    };
  }, [tracked]);

  const choose = useCallback((value: "granted" | "denied") => {
    setStoredConsent(value);
    setVisible(false);
  }, []);

  if (!tracked) return null;

  return (
    <>
      <Script id="gtag-init" strategy="afterInteractive">
        {GTAG_INIT}
      </Script>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-056NR93JLK"
        strategy="afterInteractive"
      />

      {visible && (
        <div className="fixed bottom-0 inset-x-0 z-[100] p-2 sm:p-6">
          {/* Compact single-row bar on mobile so it doesn't cover CTAs / editorial
              above the fold (audit visual finding). Roomier card on >= sm. */}
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 shadow-xl sm:gap-6 sm:rounded-2xl sm:p-5">
            <p className="flex-1 text-xs leading-snug text-on-surface-variant sm:text-sm sm:leading-relaxed">
              We use cookies for analytics and ads.{" "}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              .
            </p>
            <div className="flex shrink-0 gap-2 sm:gap-3">
              <button
                onClick={() => choose("denied")}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container sm:px-4 sm:py-2 sm:text-sm"
              >
                Decline
              </button>
              <button
                onClick={() => choose("granted")}
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90 sm:px-5 sm:py-2 sm:text-sm"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

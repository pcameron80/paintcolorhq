"use client";

import { useState, useEffect, useCallback } from "react";
import Script from "next/script";

type Consent = "granted" | "denied" | null;

function getStoredConsent(): Consent {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("cookie_consent");
  return v === "granted" || v === "denied" ? v : null;
}

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored);
    } else {
      setVisible(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem("cookie_consent", "granted");
    setConsent("granted");
    setVisible(false);
  }, []);

  const handleDecline = useCallback(() => {
    localStorage.setItem("cookie_consent", "denied");
    setConsent("denied");
    setVisible(false);
  }, []);

  return (
    <>
      {consent === "granted" && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-056NR93JLK"
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              var isInternal = (
                location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1' ||
                location.hostname.endsWith('.vercel.app') ||
                location.search.indexOf('debug=true') !== -1
              );
              gtag('config', 'G-056NR93JLK', isInternal ? {
                traffic_type: 'internal'
              } : {});
            `}
          </Script>
          {/* Pinterest Tag — page tracking only (no enhanced match since we
              don't capture visitor emails on pageload). */}
          <Script id="pinterest-tag" strategy="afterInteractive">
            {`
              !function(e){if(!window.pintrk){window.pintrk = function () {
                window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
                var n=window.pintrk;n.queue=[],n.version="3.0";
                var t=document.createElement("script");t.async=!0,t.src=e;
                var r=document.getElementsByTagName("script")[0];
                r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
              pintrk('load', '2613209988121');
              pintrk('page');
            `}
          </Script>
        </>
      )}

      {visible && (
        <div className="fixed bottom-0 inset-x-0 z-[100] p-2 sm:p-6">
          {/* Compact single-row bar on mobile so it doesn't cover CTAs / editorial
              above the fold (audit visual finding). Roomier card on >= sm. */}
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 shadow-xl sm:gap-6 sm:rounded-2xl sm:p-5">
            <p className="flex-1 text-xs leading-snug text-on-surface-variant sm:text-sm sm:leading-relaxed">
              We use cookies for analytics.{" "}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              .
            </p>
            <div className="flex shrink-0 gap-2 sm:gap-3">
              <button
                onClick={handleDecline}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container sm:px-4 sm:py-2 sm:text-sm"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
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

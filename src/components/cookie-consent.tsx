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
        <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl sm:flex sm:items-center sm:gap-6">
            <p className="text-sm text-on-surface-variant leading-relaxed sm:flex-1">
              We use cookies for analytics and to improve your experience. See
              our{" "}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              .
            </p>
            <div className="mt-4 flex gap-3 sm:mt-0 sm:shrink-0">
              <button
                onClick={handleDecline}
                className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
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

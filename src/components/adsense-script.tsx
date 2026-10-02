"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import {
  CONSENT_CHANGE_EVENT,
  adsAllowed,
  fetchConsentRegion,
  getStoredConsent,
} from "@/lib/consent";

export function AdSenseScript() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchConsentRegion().then((region) => {
      if (active) setAllowed(adsAllowed(getStoredConsent(), region));
    });

    async function onChange() {
      const region = await fetchConsentRegion();
      if (active) setAllowed(adsAllowed(getStoredConsent(), region));
    }
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    };
  }, []);

  if (!allowed) return null;

  return (
    <Script
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6269963973031881"
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}

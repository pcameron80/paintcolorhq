"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

export function AdSenseScript() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(localStorage.getItem("cookie_consent") === "granted");

    function onStorage(e: StorageEvent) {
      if (e.key === "cookie_consent") {
        setConsented(e.newValue === "granted");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!consented) return null;

  return (
    <Script
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6269963973031881"
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}

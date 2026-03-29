"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  layout?: string;
  layoutKey?: string;
  className?: string;
}

export function AdUnit({ slot, format = "auto", layout, layoutKey, className }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded or ad blocked
    }
  }, []);

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client="ca-pub-6269963973031881"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
      {...(layout && { "data-ad-layout": layout })}
      {...(layoutKey && { "data-ad-layout-key": layoutKey })}
    />
  );
}

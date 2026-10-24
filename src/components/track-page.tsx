"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { navTypeFor, type NavTypeState } from "@/lib/nav-type";

interface TrackPageProps {
  eventName: string;
  params: Record<string, string | number | undefined>;
}

// One per document: survives soft navigations, resets on a full load.
const navState: NavTypeState = { landingPath: null, leftLanding: false };

export function TrackPage({ eventName, params }: TrackPageProps) {
  const pathname = usePathname();
  const lastKey = useRef<string | null>(null);
  const key = `${pathname}|${eventName}|${JSON.stringify(params)}`;

  useEffect(() => {
    // Fires once per page. Keyed on path and params rather than a mount flag,
    // because Next reuses this instance when one dynamic route navigates to
    // another of the same template (color page to color page).
    if (lastKey.current === key) return;
    lastKey.current = key;
    trackEvent(eventName, { ...params, nav_type: navTypeFor(navState, pathname ?? "") });
    // key covers eventName, params and pathname.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}

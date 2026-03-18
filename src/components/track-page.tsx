"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface TrackPageProps {
  eventName: string;
  params: Record<string, string | number | undefined>;
}

export function TrackPage({ eventName, params }: TrackPageProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      trackEvent(eventName, params);
    }
  }, [eventName, params]);

  return null;
}

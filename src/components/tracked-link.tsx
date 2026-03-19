"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { type ComponentProps } from "react";

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  eventName: string;
  eventParams?: Record<string, string | number | undefined>;
}

export function TrackedLink({ eventName, eventParams, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(eventName, eventParams);
        if (onClick) onClick(e);
      }}
    />
  );
}

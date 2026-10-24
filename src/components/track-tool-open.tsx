"use client";

import { useEffect } from "react";
import { trackToolEngagement } from "@/lib/analytics";

/** Fires the tool_use "open" event for a server-rendered tool page. */
export function TrackToolOpen({ tool }: { tool: string }) {
  useEffect(() => {
    trackToolEngagement(tool, "open");
  }, [tool]);
  return null;
}

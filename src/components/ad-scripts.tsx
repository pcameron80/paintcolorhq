"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  GROW_INITIALIZER,
  MEDIAVINE_ENABLED,
  MEDIAVINE_SCRIPT_URL,
  isAdFreePath,
  onMediavineRouteChange,
} from "@/lib/mediavine";

// Journey by Mediavine wrapper plus Grow, mounted once in the root layout.
// Path-aware on the client: the root layout also serves /embed/match iframes
// on third-party sites, /admin and the private dashboard, and none of those
// may carry ads. Not gated on adsAllowed(): Mediavine runs its own consent
// tool. next/script loads each src once per session, so client-side
// navigations do not re-inject the wrapper.
export function AdScripts() {
  const pathname = usePathname();
  if (!MEDIAVINE_ENABLED || !pathname || isAdFreePath(pathname)) return null;

  return (
    <>
      <Script
        id="mediavine-wrapper"
        src={MEDIAVINE_SCRIPT_URL}
        strategy="afterInteractive"
        data-noptimize="1"
        data-cfasync="false"
      />
      {GROW_INITIALIZER && (
        // If the supplied Grow <script> tag carries attributes, copy them
        // onto this element exactly as given.
        <Script id="mediavine-grow" strategy="afterInteractive">
          {GROW_INITIALIZER}
        </Script>
      )}
      {onMediavineRouteChange && (
        <Suspense fallback={null}>
          <RouteChangeNotifier notify={onMediavineRouteChange} />
        </Suspense>
      )}
    </>
  );
}

// Fires Mediavine's route-change call after client-side navigations that
// change the path or the ?page= param only, so /compare picks (other query
// params) do not refresh ads. Skips the first render: the wrapper handles the
// initial page view itself.
function RouteChangeNotifier({ notify }: { notify: () => void }) {
  const pathname = usePathname();
  const page = useSearchParams().get("page");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    notify();
  }, [pathname, page, notify]);

  return null;
}

// Journey by Mediavine install values. Every value below is a placeholder
// until Philip copies the real one from the Journey dashboard on approval day.
// While MEDIAVINE_SCRIPT_URL is empty the site behaves exactly as it did
// before this file existed: no wrapper, no Grow, no consent changes, and the
// privacy page and footer keep their current wording.
//
// Fill in from the Journey dashboard (Settings > Install / Privacy):
//   MEDIAVINE_SCRIPT_URL   the wrapper script URL, exactly as given
//   GROW_INITIALIZER       the Grow snippet's inline JavaScript, exactly as given
//                          (the code inside its <script> tag, without the tag)
//   MEDIAVINE_PRIVACY_HTML the "Mediavine Programmatic Advertising (Ver 1.1)"
//                          body text, verbatim, from help.mediavine.com/privacy-policy-language
//   MEDIAVINE_PRIVACY_EFFECTIVE_DATE  install day, shown on /privacy
//   onMediavineRouteChange only if Mediavine documents a call to make on a
//                          client-side route change; leave null if Journey
//                          reloads ads on URL change by itself

/** Wrapper script URL from the Journey dashboard. Empty = ads off. */
export const MEDIAVINE_SCRIPT_URL = "";

/** Inline JavaScript of the Grow initializer, verbatim. Empty = no Grow. */
export const GROW_INITIALIZER = "";

/**
 * Body of Mediavine's required "Mediavine Programmatic Advertising (Ver 1.1)"
 * privacy block, pasted verbatim (it is HTML). The heading is rendered by the
 * privacy page. Empty = the block is not rendered. Do not paraphrase it: the
 * Privacy Health Check matches the exact text.
 */
export const MEDIAVINE_PRIVACY_HTML = "";

/**
 * Mediavine's documented route-change call, if it has one. Runs after each
 * client-side navigation that changes the path or the ?page= param (not other
 * query params, so /compare picks do not refresh ads). Null = do nothing.
 */
export const onMediavineRouteChange: null | (() => void) = null;

/**
 * Effective date the privacy page shows once Journey is live, e.g.
 * "November 12, 2026" (the install day). Empty = keep the current date.
 */
export const MEDIAVINE_PRIVACY_EFFECTIVE_DATE = "";

export const MEDIAVINE_ENABLED = MEDIAVINE_SCRIPT_URL !== "";

/**
 * Paths that never load the ad wrapper or Grow: everything isNonTrackedPath()
 * covers (/embed/match iframes, /admin), the /embed landing page, the private
 * project dashboard, auth callbacks, API routes and the noindex /search utility.
 */
export function isAdFreePath(pathname: string): boolean {
  return (
    pathname === "/embed" ||
    pathname.startsWith("/embed/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname === "/search"
  );
}

/**
 * Resolves true if Mediavine's TCF consent tool (window.__tcfapi) appears
 * within timeoutMs, false otherwise. Used so regulated visitors see one
 * consent prompt: Mediavine's when it loads, ours as the fallback.
 */
export function waitForMediavineCmp(timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const has = () => typeof (window as Window & { __tcfapi?: unknown }).__tcfapi === "function";
    if (has()) return resolve(true);
    const start = Date.now();
    const id = window.setInterval(() => {
      if (has()) {
        window.clearInterval(id);
        resolve(true);
      } else if (Date.now() - start >= timeoutMs) {
        window.clearInterval(id);
        resolve(false);
      }
    }, 100);
  });
}

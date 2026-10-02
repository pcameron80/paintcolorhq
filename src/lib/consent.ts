// Region-aware consent. Visitors in the EEA, UK and Switzerland must opt in
// before analytics or ad cookies are set, so they see the banner and Google
// Consent Mode defaults them to "denied". Everyone else gets analytics and ads
// by default and can opt out through the footer "Your Privacy Choices" link or
// a Global Privacy Control signal.

export type StoredConsent = "granted" | "denied" | null;
export type ConsentRegion = "regulated" | "other" | "pending";

export const CONSENT_STORAGE_KEY = "cookie_consent";
export const CONSENT_CHANGE_EVENT = "pchq:consent-change";
export const OPEN_PRIVACY_CHOICES_EVENT = "pchq:open-privacy-choices";

// EEA + UK + Switzerland, ISO 3166-1 alpha-2 (the format both Vercel's
// x-vercel-ip-country header and gtag's consent `region` parameter use).
export const REGULATED_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
];

export function getStoredConsent(): StoredConsent {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean })
    .globalPrivacyControl === true;
}

// Ad and marketing tags (AdSense, Pinterest). An explicit choice always wins;
// with no choice, only non-regulated visitors without GPC get them.
export function adsAllowed(stored: StoredConsent, region: ConsentRegion): boolean {
  if (stored) return stored === "granted";
  return region === "other" && !hasGlobalPrivacyControl();
}

export function setStoredConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  const state = value === "granted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  });
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: value }));
}

let regionPromise: Promise<"regulated" | "other"> | null = null;

// One uncached request per page load; the result is held in sessionStorage so
// client-side navigations and later page loads in the session skip it.
// Unknown countries and failures count as regulated, which is the safe side.
export function fetchConsentRegion(): Promise<"regulated" | "other"> {
  if (regionPromise) return regionPromise;
  regionPromise = (async () => {
    try {
      const cached = sessionStorage.getItem("consent_region");
      if (cached === "regulated" || cached === "other") return cached;
    } catch {}
    let region: "regulated" | "other" = "regulated";
    try {
      const res = await fetch("/api/geo", { cache: "no-store" });
      if (res.ok) {
        const { country } = (await res.json()) as { country: string | null };
        region = country && !REGULATED_REGIONS.includes(country) ? "other" : "regulated";
      }
    } catch {}
    try {
      sessionStorage.setItem("consent_region", region);
    } catch {}
    return region;
  })();
  return regionPromise;
}

"use client";

import { OPEN_PRIVACY_CHOICES_EVENT } from "@/lib/consent";
import { MEDIAVINE_ENABLED } from "@/lib/mediavine";

// Reopens the cookie banner so any visitor can opt out (or back in). Before
// Journey this is the US "Do Not Sell or Share" path for visitors outside the
// EEA/UK/CH. Once Journey is live, Mediavine's own footer link carries Do Not
// Sell, so ours covers Google Analytics only and is labeled "Cookie settings".
export function PrivacyChoicesLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_CHOICES_EVENT))}
      className={className}
    >
      {MEDIAVINE_ENABLED ? "Cookie settings" : "Your Privacy Choices"}
    </button>
  );
}

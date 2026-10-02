"use client";

import { OPEN_PRIVACY_CHOICES_EVENT } from "@/lib/consent";

// Reopens the cookie banner so any visitor can opt out (or back in). This is
// the US "Do Not Sell or Share" path for visitors outside the EEA/UK/CH.
export function PrivacyChoicesLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_CHOICES_EVENT))}
      className={className}
    >
      Your Privacy Choices
    </button>
  );
}

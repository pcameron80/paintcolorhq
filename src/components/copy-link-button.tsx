"use client";

import { useEffect, useRef, useState } from "react";

interface CopyLinkButtonProps {
  /** Built at click time so the link always matches what is on screen. */
  getUrl: () => string;
  onCopied?: () => void;
  label?: string;
  className?: string;
}

/**
 * Copies a link that reopens the tool in its current state. Falls back to a
 * prompt with the URL selected when the Clipboard API is missing or blocked
 * (older Safari, insecure contexts, some in-app browsers).
 */
export function CopyLinkButton({ getUrl, onCopied, label = "Copy link", className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
    onCopied?.();
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? "Link copied" : label}
    </button>
  );
}

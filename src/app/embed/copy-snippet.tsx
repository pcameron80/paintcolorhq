"use client";

import { useState } from "react";

export function CopySnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the code is still selectable below */
    }
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 pr-24 text-xs leading-relaxed text-on-surface">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-on-secondary shadow-sm transition-all hover:shadow-md"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

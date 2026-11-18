"use client";

import { useEffect } from "react";

// Loads the one dealt scroll moment (pinned chapters) from plain files in
// /assets/moments. The page is complete without it: each step stands as a row.
export function MomentsLoader() {
  useEffect(() => {
    let cancelled = false;
    const url = "/assets/moments/moments.js";
    import(/* webpackIgnore: true */ url).catch(() => {
      if (!cancelled) document.querySelectorAll("[data-moment]").forEach((el) => el.classList.add("mo-safe"));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

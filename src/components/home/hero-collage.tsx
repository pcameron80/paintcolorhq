"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Rotates the hero's server-rendered match sets every 2.8 s. Set one is the
// first paint and the no-script state. The rotation rests under reduced motion
// and on phones, and a pause button stops it (WCAG 2.2.2: moves past 5 s).
export function HeroCollage({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const index = useRef(0);

  useEffect(() => {
    const quiet = matchMedia("(prefers-reduced-motion: reduce)");
    const phone = matchMedia("(max-width: 639px)");
    const sync = () => setCanMove(!quiet.matches && !phone.matches);
    sync();
    quiet.addEventListener("change", sync);
    phone.addEventListener("change", sync);
    return () => {
      quiet.removeEventListener("change", sync);
      phone.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const sets = Array.from(el.querySelectorAll<HTMLElement>("[data-set]"));
    const show = (n: number) => {
      index.current = n;
      sets.forEach((s, i) => {
        s.classList.toggle("is-on", i === n);
        if (i === n) s.removeAttribute("inert");
        else s.setAttribute("inert", "");
      });
    };
    if (!canMove) {
      show(0);
      return;
    }
    if (paused) return;
    const id = window.setInterval(() => show((index.current + 1) % sets.length), 2800);
    return () => window.clearInterval(id);
  }, [canMove, paused]);

  return (
    <div className={`ly-collage pch-collage ${className}`} ref={root} role="group" aria-label={label}>
      {children}
      {canMove && (
        <button
          type="button"
          className="pch-collage__pause"
          aria-label={paused ? "Play the match examples" : "Pause the match examples"}
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            {paused ? <path d="M3 1.5v11l9-5.5z" fill="currentColor" /> : <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor" />}
          </svg>
        </button>
      )}
    </div>
  );
}

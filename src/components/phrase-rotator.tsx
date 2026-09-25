"use client";

import { useEffect, useState } from "react";

const INTERVAL_MS = 3500;

/**
 * Cross-fades through `phrases`. Pauses while the tab is hidden and stays on the first phrase
 * for people who prefer reduced motion. Screen readers get one fixed phrase instead of a changing one.
 */
export function PhraseRotator({ phrases, className }: { phrases: string[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length < 2) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      timer = undefined;
      if (document.hidden || reducedMotion.matches) return;
      timer = setInterval(() => setIndex((i) => (i + 1) % phrases.length), INTERVAL_MS);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, [phrases.length]);

  return (
    <p className={className}>
      <span className="sr-only">{phrases[0]}</span>
      {/* Every phrase sits in the same grid cell, so the box keeps the size of the longest one and nothing below jumps. */}
      <span aria-hidden className="grid">
        {phrases.map((p, i) => (
          <span
            key={p}
            className={`[grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
          >
            {p}
          </span>
        ))}
      </span>
    </p>
  );
}

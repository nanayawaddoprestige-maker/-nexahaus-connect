"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Subtle fade/rise the first time an element scrolls into view.
 *
 * Safe by default: the element renders fully visible on the server and on first
 * client paint. Only after mount, and only when IntersectionObserver is
 * available and motion is allowed, do we (a) hide elements that are still below
 * the fold and (b) reveal them on intersection. If anything is unavailable the
 * content simply stays visible — it never depends on JS to be seen.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** ms */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "armed" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") return; // stay visible

    // Already on screen at mount → don't animate, avoid a pointless flash.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;

    setState("armed");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setState("shown");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={state === "shown" && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]",
        state === "armed"
          ? "motion-safe:translate-y-3 motion-safe:opacity-0"
          : "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Colour band for a 0–100 score: <60 critical, <80 warning, else positive.
 * The `--positive`/`--warning`/`--critical` tokens (used for the arc and,
 * on a light background, the label) are all under 3:1 against `navy-900`
 * (checked against WCAG's contrast formula) — nowhere near the 4.5:1 text
 * needs, so a gauge placed on a dark card (as the homepage does) needs a
 * lighter set for the label text specifically.
 */
function band(score: number, onNavy: boolean) {
  if (score < 60) {
    return {
      stroke: "#b91c1c",
      labelColor: onNavy ? "#f87171" : "#b91c1c",
      label: "Needs attention",
    };
  }
  if (score < 80) {
    return {
      stroke: "#b45309",
      labelColor: onNavy ? "#fbbf24" : "#b45309",
      label: "Room to improve",
    };
  }
  return {
    stroke: "#0f766e",
    labelColor: onNavy ? "#5eead4" : "#0f766e",
    label: "Healthy",
  };
}

/**
 * Animated semicircular score gauge. The needle/arc sweeps to `score` the first
 * time it enters view and the number counts up with it. Respects
 * prefers-reduced-motion (renders the final state immediately). Decorative
 * detail is `aria-hidden`; the accessible name carries the value.
 */
export function HealthGauge({
  score,
  caption,
  size = 240,
  className,
  onNavy = false,
}: {
  score: number;
  caption?: string;
  size?: number;
  className?: string;
  /** Set when the gauge sits on a dark (navy-900) card — swaps the score
   *  number, "out of 100", label and caption for colours that stay
   *  readable there (the default palette is tuned for a light background). */
  onNavy?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const { stroke, labelColor, label } = band(clamped, onNavy);

  // Geometry: 180° arc, stroke inside the box.
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half circle
  const progress = (display / 100) * circumference;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setDisplay(clamped);
      return;
    }
    let raf = 0;
    let safety = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const dur = 900;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(eased * clamped));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        // Safety net: if rAF is throttled (e.g. the tab is backgrounded) and
        // never resumes, still land on the correct final value.
        safety = window.setTimeout(() => setDisplay(clamped), dur + 400);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
    };
  }, [clamped]);

  return (
    <div
      ref={ref}
      className={cn("inline-flex flex-col items-center", className)}
      role="img"
      aria-label={`Example Property Health Score: ${clamped} out of 100 — ${label}`}
    >
      <svg
        width={size}
        height={size / 2 + 24}
        viewBox={`0 0 ${size} ${size / 2 + 24}`}
        aria-hidden
      >
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className={cn(
            "font-semibold tabular-nums",
            onNavy ? "fill-white" : "fill-navy-900",
          )}
          style={{ fontSize: size * 0.22 }}
        >
          {display}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className={onNavy ? "fill-navy-200" : "fill-ink-subtle"}
          style={{ fontSize: size * 0.075 }}
        >
          out of 100
        </text>
      </svg>
      <span className="mt-1 text-sm font-medium" style={{ color: labelColor }}>
        {label}
      </span>
      {caption ? (
        <span
          className={cn(
            "mt-1 text-xs",
            onNavy ? "text-navy-200" : "text-ink-subtle",
          )}
        >
          {caption}
        </span>
      ) : null}
    </div>
  );
}

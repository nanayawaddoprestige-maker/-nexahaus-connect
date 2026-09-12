"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface StepDef {
  /** Stable id, used for analytics and keys. */
  id: string;
  /** Short label shown in the progress indicator. */
  label: string;
}

export interface UseStepsResult {
  index: number;
  current: StepDef;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  back: () => void;
  goTo: (i: number) => void;
  /** 0–100 */
  progress: number;
}

/**
 * Step state for a multi-step form. Navigation is caller-controlled: call
 * `next()` only after the current step validates.
 */
export function useSteps(
  steps: StepDef[],
  onStepChange?: (step: StepDef, index: number) => void,
): UseStepsResult {
  const [index, setIndex] = useState(0);
  const total = steps.length;

  const change = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(total - 1, i));
      setIndex(clamped);
      const step = steps[clamped];
      if (step) onStepChange?.(step, clamped);
    },
    [total, steps, onStepChange],
  );

  const current = steps[index] ?? steps[0]!;

  return {
    index,
    current,
    total,
    isFirst: index === 0,
    isLast: index === total - 1,
    next: () => change(index + 1),
    back: () => change(index - 1),
    goTo: change,
    progress: total > 1 ? Math.round((index / (total - 1)) * 100) : 100,
  };
}

/** Numbered progress rail (brief §16). Past steps are clickable for review. */
export function StepProgress({
  steps,
  index,
  onGoTo,
  className,
}: {
  steps: StepDef[];
  index: number;
  onGoTo?: (i: number) => void;
  className?: string;
}) {
  return (
    <ol
      className={cn("flex flex-wrap gap-x-2 gap-y-3", className)}
      aria-label="Progress"
    >
      {steps.map((step, i) => {
        const state = i < index ? "done" : i === index ? "current" : "todo";
        const clickable = state === "done" && onGoTo;
        const Tag = clickable ? "button" : "div";
        return (
          <li key={step.id} className="flex items-center gap-2">
            <Tag
              {...(clickable
                ? { type: "button" as const, onClick: () => onGoTo(i) }
                : {})}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium",
                state === "current" && "bg-navy-900 text-white",
                state === "done" && "text-navy-800",
                state === "todo" && "text-ink-subtle",
                clickable && "hover:bg-navy-50",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] tabular-nums",
                  state === "current" && "bg-white text-navy-900",
                  state === "done" && "bg-positive text-white",
                  state === "todo" && "border border-line",
                )}
              >
                {state === "done" ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M1.5 5.5l2 2 5-5.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </Tag>
            {i < steps.length - 1 ? (
              <span aria-hidden className="hidden h-px w-4 bg-line sm:block" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Wraps the current step's content. Moves focus to the step heading on change
 * so screen-reader and keyboard users are oriented. `stepKey` should change per
 * step so the effect re-runs.
 */
export function StepPanel({
  stepKey,
  title,
  description,
  children,
}: {
  stepKey: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return; // don't steal focus on first render
    }
    headingRef.current?.focus();
  }, [stepKey]);

  return (
    <div className="motion-safe:animate-fade-up">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold text-navy-900 focus-visible:outline-none"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      ) : null}
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

/** Back / Next (or Submit) row. */
export function StepNav({
  isFirst,
  isLast,
  onBack,
  submitting,
  nextLabel = "Continue",
  submitLabel = "Submit",
}: {
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  submitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst || submitting}
        className="inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium text-navy-800 hover:bg-navy-50 disabled:invisible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
      >
        ← Back
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-6 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
      >
        {submitting ? "Submitting…" : isLast ? submitLabel : nextLabel}
      </button>
    </div>
  );
}

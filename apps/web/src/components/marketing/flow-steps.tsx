import { cn } from "@/lib/cn";

export interface FlowStep {
  label: string;
  detail?: string;
}

/**
 * A vertical (mobile) / horizontal (desktop) sequence with connectors — the
 * "YOUR PROPERTY → YOUR TEAM → REAL-TIME UPDATES → …" chains in the brief.
 * Connectors are decorative and hidden from assistive tech; the ordered list
 * carries the meaning.
 */
export function FlowSteps({
  steps,
  onNavy = false,
  className,
}: {
  steps: readonly FlowStep[];
  onNavy?: boolean;
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "grid gap-3 sm:auto-cols-fr sm:grid-flow-col",
        className,
      )}
    >
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex sm:block">
          <div
            className={cn(
              "flex w-full flex-col rounded-xl border p-4 text-center sm:h-full",
              onNavy
                ? "border-white/15 bg-white/[0.04]"
                : "border-line bg-surface shadow-card",
            )}
          >
            <span
              className={cn(
                "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                onNavy ? "bg-gold-400 text-navy-900" : "bg-navy-900 text-white",
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "mt-2 text-sm font-semibold",
                onNavy ? "text-white" : "text-navy-900",
              )}
            >
              {step.label}
            </span>
            {step.detail ? (
              <span
                className={cn(
                  "mt-1 text-xs leading-relaxed",
                  onNavy ? "text-navy-200" : "text-ink-subtle",
                )}
              >
                {step.detail}
              </span>
            ) : null}
          </div>
          {i < steps.length - 1 ? (
            <span
              aria-hidden
              className={cn(
                "pointer-events-none select-none",
                // down arrow between rows on mobile, right arrow between cols on desktop
                "absolute left-1/2 top-full h-3 -translate-x-1/2 text-lg leading-none sm:left-full sm:top-1/2 sm:h-auto sm:-translate-x-0 sm:-translate-y-1/2",
                onNavy ? "text-navy-300" : "text-ink-subtle",
              )}
            >
              <span className="sm:hidden">↓</span>
              <span className="hidden sm:inline">→</span>
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

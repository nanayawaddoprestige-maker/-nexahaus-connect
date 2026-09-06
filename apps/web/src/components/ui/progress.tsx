import { cn } from "@/lib/cn";

export function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-navy-50", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-navy-900 transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function StepList({
  steps,
}: {
  steps: { index: number; label: string; done: boolean; current: boolean }[];
}) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s) => (
        <li key={s.index} className="flex items-center gap-3 text-sm">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
              s.done
                ? "bg-navy-900 text-white"
                : s.current
                  ? "border-2 border-navy-900 text-navy-900"
                  : "border border-line text-ink-subtle",
            )}
          >
            {s.done ? "✓" : s.index}
          </span>
          <span className={cn(s.done ? "text-ink-muted" : "text-navy-900", s.current && "font-medium")}>
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

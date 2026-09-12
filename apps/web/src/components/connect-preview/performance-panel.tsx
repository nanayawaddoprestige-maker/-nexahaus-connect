import { cn } from "@/lib/cn";

export interface PerformanceRow {
  label: string;
  value: string;
  /** Optional small note under the value, e.g. "estimate". */
  note?: string;
}

/**
 * Illustrative asset-performance summary (brief §8). Realistic FICTIONAL data,
 * clearly labelled. Estimates are marked as estimates. Presentational only.
 */
export function PerformancePanel({
  rows,
  occupancy,
  label = "Illustrative example — not a valuation",
  className,
}: {
  rows: PerformanceRow[];
  /** 0–100 */
  occupancy: number;
  label?: string;
  className?: string;
}) {
  const occ = Math.max(0, Math.min(100, Math.round(occupancy)));
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface shadow-raised",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-line bg-surface-sunken px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Asset performance
        </span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-subtle">
          {label}
        </span>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Occupancy</span>
            <span className="font-medium tabular-nums text-navy-900">
              {occ}%
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-navy-50">
            <div
              className={cn(
                "h-full rounded-full",
                occ < 60
                  ? "bg-critical"
                  : occ < 80
                    ? "bg-warning"
                    : "bg-positive",
              )}
              style={{ width: `${occ}%` }}
            />
          </div>
        </div>

        <dl className="divide-y divide-line">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between py-2.5"
            >
              <dt className="text-sm text-ink-muted">{r.label}</dt>
              <dd className="text-right">
                <span className="text-sm font-medium tabular-nums text-navy-900">
                  {r.value}
                </span>
                {r.note ? (
                  <span className="ml-2 text-[11px] text-ink-subtle">
                    {r.note}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <figcaption className="sr-only">
        Illustrative example of a NexaHaus asset-performance summary. Figures
        are fictional; estimates are labelled and are not a professional
        valuation.
      </figcaption>
    </figure>
  );
}

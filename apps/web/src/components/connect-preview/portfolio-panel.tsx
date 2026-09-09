import { cn } from "@/lib/cn";

export interface PortfolioPanelData {
  stats: { label: string; value: string }[];
  finance: { label: string; value: string }[];
  portfolioHealth: number;
  /** e.g. "Illustrative interface — example data" */
  label: string;
}

/**
 * Illustrative NexaHaus Connect portfolio view. Realistic FICTIONAL data,
 * always visibly labelled (brief §33, §45). Presentational only; the numbers
 * never come from a real account. Rendered as a light "product" surface.
 */
export function PortfolioPanel({
  data,
  className,
  tone = "light",
}: {
  data: PortfolioPanelData;
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const collectedPct = pctFromFinance(data.finance);

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border shadow-raised",
        dark ? "border-white/10 bg-navy-800" : "border-line bg-surface",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-5 py-3",
          dark ? "border-white/10" : "border-line bg-surface-sunken",
        )}
      >
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            dark ? "text-navy-200" : "text-ink-subtle",
          )}
        >
          Portfolio
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
            dark ? "border-white/15 text-navy-200" : "border-line text-ink-subtle",
          )}
        >
          {data.label}
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-lg p-3 text-center",
                dark ? "bg-navy-900/60" : "bg-surface-sunken",
              )}
            >
              <div
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  dark ? "text-white" : "text-navy-900",
                )}
              >
                {s.value}
              </div>
              <div className={cn("mt-0.5 text-[11px]", dark ? "text-navy-200" : "text-ink-subtle")}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <dl className="mt-4 space-y-2">
          {data.finance.map((f) => (
            <div key={f.label} className="flex items-center justify-between text-sm">
              <dt className={dark ? "text-navy-200" : "text-ink-muted"}>{f.label}</dt>
              <dd
                className={cn(
                  "font-medium tabular-nums",
                  dark ? "text-white" : "text-navy-900",
                )}
              >
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        {collectedPct != null ? (
          <>
            <div
              className={cn(
                "mt-3 h-1.5 w-full overflow-hidden rounded-full",
                dark ? "bg-navy-900" : "bg-navy-50",
              )}
            >
              <div className="h-full rounded-full bg-gold-400" style={{ width: `${collectedPct}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={cn("text-[11px]", dark ? "text-navy-300" : "text-ink-subtle")}>
                {collectedPct}% of expected rent collected
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  dark ? "text-navy-100" : "text-navy-800",
                )}
              >
                Portfolio Health {data.portfolioHealth}/100
              </span>
            </div>
          </>
        ) : null}
      </div>
      <figcaption className="sr-only">
        Illustrative example of the NexaHaus Connect portfolio dashboard. Figures are
        fictional and do not represent real company or client performance.
      </figcaption>
    </figure>
  );
}

function pctFromFinance(finance: { label: string; value: string }[]): number | null {
  const expected = numFrom(finance.find((f) => /expected/i.test(f.label))?.value);
  const collected = numFrom(finance.find((f) => /collected/i.test(f.label))?.value);
  if (!expected || collected == null) return null;
  return Math.round((collected / expected) * 100);
}

function numFrom(value?: string): number | null {
  if (!value) return null;
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

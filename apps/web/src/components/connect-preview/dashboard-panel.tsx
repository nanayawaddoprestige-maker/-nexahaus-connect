import { ConnectFrame, ModuleRail, Row } from "./frame";

/** Illustrative portfolio dashboard — the landing view of NexaHaus Connect. */
export function DashboardPanel() {
  return (
    <ConnectFrame
      title="NexaHaus Connect — Dashboard"
      sidebar={<ModuleRail active="Dashboard" />}
    >
      <h3 className="text-base font-semibold text-navy-900">
        Portfolio overview
      </h3>
      <p className="text-xs text-ink-subtle">
        5 properties · 18 units · September 2026
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["5", "Properties"],
          ["4", "Occupied"],
          ["1", "Vacant"],
          ["2", "Open maintenance"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-lg bg-surface-sunken p-3 text-center">
            <div className="text-lg font-semibold tabular-nums text-navy-900">
              {v}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-subtle">{l}</div>
          </div>
        ))}
      </div>

      <dl className="mt-4 divide-y divide-line">
        <Row label="Expected rent" value="GHS 28,500" />
        <Row label="Collected" value="GHS 24,500" tone="positive" />
        <Row label="Outstanding" value="GHS 4,000" tone="warning" />
      </dl>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-navy-50">
        <div
          className="h-full rounded-full bg-gold-400"
          style={{ width: "86%" }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-ink-subtle">
          86% of expected rent collected this period
        </span>
        <span className="font-medium text-navy-800">
          Portfolio Health 87/100
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-line p-3">
        <p className="text-xs font-medium text-ink-subtle">
          Needs your attention
        </p>
        <ul className="mt-2 space-y-1 text-xs text-ink-muted">
          <li>1 maintenance item awaiting approval (GHS 1,200)</li>
          <li>1 unit vacant 21 days — re-letting in progress</li>
          <li>2 tenancies expiring within 60 days</li>
        </ul>
      </div>
    </ConnectFrame>
  );
}

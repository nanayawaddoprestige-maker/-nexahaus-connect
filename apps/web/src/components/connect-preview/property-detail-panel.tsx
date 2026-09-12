import { ConnectFrame, ModuleRail, Row, Tag } from "./frame";

/** Illustrative "Property profile" screen. All data fictional. */
export function PropertyDetailPanel() {
  return (
    <ConnectFrame
      title="NexaHaus Connect — Property"
      sidebar={<ModuleRail active="Properties" />}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-navy-900">
            Cantonments Court, Block B
          </h3>
          <p className="text-xs text-ink-subtle">
            6-unit apartment building · Accra · NH-000142
          </p>
        </div>
        <Tag tone="positive">Managed</Tag>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["6", "Units"],
          ["5", "Occupied"],
          ["1", "Vacant"],
          ["84", "Health / 100"],
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
        <Row label="Expected rent (this month)" value="GHS 15,000" />
        <Row label="Collected" value="GHS 12,500" tone="positive" />
        <Row label="Outstanding" value="GHS 2,500" tone="warning" />
        <Row label="Last inspection" value="3 September 2026" />
        <Row label="Open maintenance" value="1 item" />
        <Row label="Documents" value="Title, 5 tenancies, insurance" />
      </dl>

      <div className="mt-4 rounded-lg border border-line p-3">
        <p className="text-xs font-medium text-ink-subtle">Recent activity</p>
        <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
          <li>1 Sep — Rent received, Unit B3 (GHS 2,500)</li>
          <li>27 Aug — Maintenance completed: kitchen tap, Unit B1</li>
          <li>3 Sep — Quarterly inspection report published</li>
        </ul>
      </div>
    </ConnectFrame>
  );
}

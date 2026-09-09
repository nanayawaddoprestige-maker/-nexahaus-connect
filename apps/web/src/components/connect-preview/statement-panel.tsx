import { ConnectFrame, ModuleRail, Row } from "./frame";

/** Illustrative monthly owner statement. Every line ties back to a transaction. */
export function StatementPanel() {
  return (
    <ConnectFrame title="NexaHaus Connect — Owner statement" sidebar={<ModuleRail active="Finance" />}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-navy-900">Owner statement — August 2026</h3>
          <p className="text-xs text-ink-subtle">Cantonments Court, Block B · NH-000142 · ST-2026-08</p>
        </div>
        <span className="rounded-md border border-line px-2 py-1 text-[11px] text-ink-muted">PDF available</span>
      </div>

      <dl className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Income</p>
        <Row label="Rent charged (6 units)" value="GHS 15,000" />
        <Row label="Rent collected" value="GHS 14,000" tone="positive" />
        <Row label="Brought forward (arrears)" value="GHS 1,500" tone="warning" />

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Deductions</p>
        <Row label="Management fee (8%)" value="-GHS 1,120" />
        <Row label="Maintenance (MT-0298)" value="-GHS 350" />
        <Row label="Common-area electricity" value="-GHS 420" />
      </dl>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-navy-900 px-4 py-3 text-white">
        <span className="text-sm">Net to owner</span>
        <span className="text-lg font-semibold tabular-nums">GHS 12,110</span>
      </div>
      <p className="mt-2 text-[11px] text-ink-subtle">
        Reproducible from every underlying transaction — nothing edited by hand.
      </p>
    </ConnectFrame>
  );
}

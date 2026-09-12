import { ConnectFrame, ModuleRail, Tag } from "./frame";

const AREAS: {
  area: string;
  rating: "Good" | "Fair" | "Attention";
  tone: "positive" | "warning" | "critical";
  note: string;
}[] = [
  {
    area: "Exterior & common areas",
    rating: "Good",
    tone: "positive",
    note: "Clean, no visible defects.",
  },
  {
    area: "Unit B1 — kitchen",
    rating: "Good",
    tone: "positive",
    note: "Tap replaced 27 Aug.",
  },
  {
    area: "Unit B3 — bathroom",
    rating: "Attention",
    tone: "critical",
    note: "Water heater fault — ticket MT-0311 raised.",
  },
  {
    area: "Roof & drainage",
    rating: "Fair",
    tone: "warning",
    note: "Gutter clearing recommended before the rains.",
  },
  {
    area: "Electrical & safety",
    rating: "Good",
    tone: "positive",
    note: "RCD tested, extinguishers in date.",
  },
];

/** Illustrative inspection report: area-by-area findings with photos + ratings. */
export function InspectionPanel() {
  return (
    <ConnectFrame
      title="NexaHaus Connect — Inspection"
      sidebar={<ModuleRail active="Inspections" />}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-navy-900">
            Quarterly inspection
          </h3>
          <p className="text-xs text-ink-subtle">
            Cantonments Court, Block B · 3 September 2026 · IN-0087
          </p>
        </div>
        <Tag tone="warning">1 item for follow-up</Tag>
      </div>

      <div className="mt-3 flex gap-2" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 flex-1 rounded-md border border-line bg-surface-sunken"
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-ink-subtle">14 photos attached</p>

      <ul className="mt-4 divide-y divide-line">
        {AREAS.map((a) => (
          <li key={a.area} className="py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-navy-900">
                {a.area}
              </span>
              <Tag tone={a.tone}>{a.rating}</Tag>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">{a.note}</p>
          </li>
        ))}
      </ul>
    </ConnectFrame>
  );
}

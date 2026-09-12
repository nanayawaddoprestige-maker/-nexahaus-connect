import { ConnectFrame, ModuleRail, Tag } from "./frame";

const TICKETS: {
  ref: string;
  title: string;
  property: string;
  raised: string;
  stage:
    | "Reported"
    | "Assigned"
    | "In progress"
    | "Awaiting approval"
    | "Completed";
  tone: "neutral" | "warning" | "positive";
  cost?: string;
}[] = [
  {
    ref: "MT-0311",
    title: "Water heater not working",
    property: "Cantonments Court · B3",
    raised: "2 Sep",
    stage: "Awaiting approval",
    tone: "warning",
    cost: "GHS 1,200",
  },
  {
    ref: "MT-0309",
    title: "Gate motor intermittent",
    property: "Cantonments Court · Common",
    raised: "29 Aug",
    stage: "In progress",
    tone: "neutral",
  },
  {
    ref: "MT-0304",
    title: "Repaint stairwell",
    property: "Cantonments Court · Common",
    raised: "20 Aug",
    stage: "Assigned",
    tone: "neutral",
  },
  {
    ref: "MT-0298",
    title: "Kitchen tap replacement",
    property: "Cantonments Court · B1",
    raised: "12 Aug",
    stage: "Completed",
    tone: "positive",
    cost: "GHS 350",
  },
];

/** Illustrative "Maintenance" screen: tickets from report to completion. */
export function MaintenancePanel() {
  return (
    <ConnectFrame
      title="NexaHaus Connect — Maintenance"
      sidebar={<ModuleRail active="Maintenance" />}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-navy-900">Maintenance</h3>
        <span className="text-xs text-ink-subtle">
          4 open · 1 awaiting your approval
        </span>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {TICKETS.map((t) => (
          <li
            key={t.ref}
            className="flex items-start justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy-900">{t.title}</p>
              <p className="mt-0.5 text-xs text-ink-subtle">
                {t.ref} · {t.property} · raised {t.raised}
                {t.cost ? ` · ${t.cost}` : ""}
              </p>
            </div>
            <Tag tone={t.tone}>{t.stage}</Tag>
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
        MT-0311 needs your approval — estimated GHS 1,200, above your GHS 1,000
        threshold.
      </div>
    </ConnectFrame>
  );
}

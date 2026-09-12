import { ConnectFrame, ModuleRail } from "./frame";
import { cn } from "@/lib/cn";

const CATEGORIES: { name: string; score: number }[] = [
  { name: "Occupancy", score: 83 },
  { name: "Rent collection", score: 78 },
  { name: "Maintenance", score: 71 },
  { name: "Property condition", score: 86 },
  { name: "Tenant experience", score: 88 },
  { name: "Documentation", score: 95 },
  { name: "Security", score: 90 },
  { name: "Financial performance", score: 80 },
];

function band(n: number) {
  return n < 60 ? "bg-critical" : n < 80 ? "bg-warning" : "bg-positive";
}

/** Illustrative Property Health breakdown across the eight assessment areas. */
export function HealthPanel() {
  const overall = Math.round(
    CATEGORIES.reduce((n, c) => n + c.score, 0) / CATEGORIES.length,
  );
  return (
    <ConnectFrame
      title="NexaHaus Connect — Property Health"
      sidebar={<ModuleRail active="Property Health" />}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-navy-900">
            Property Health
          </h3>
          <p className="text-xs text-ink-subtle">
            Cantonments Court, Block B · updated 3 Sep 2026
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums text-navy-900">
            {overall}
          </div>
          <div className="text-[11px] text-ink-subtle">out of 100</div>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {CATEGORIES.map((c) => (
          <li key={c.name}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">{c.name}</span>
              <span className="tabular-nums text-navy-900">{c.score}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-50">
              <div
                className={cn("h-full rounded-full", band(c.score))}
                style={{ width: `${c.score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] text-ink-subtle">
        A NexaHaus management assessment framework — not a professional
        valuation, legal opinion or investment recommendation.
      </p>
    </ConnectFrame>
  );
}

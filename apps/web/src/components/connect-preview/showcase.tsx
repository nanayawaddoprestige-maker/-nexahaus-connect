"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";
import { DashboardPanel } from "./dashboard-panel";
import { PropertyDetailPanel } from "./property-detail-panel";
import { StatementPanel } from "./statement-panel";
import { MaintenancePanel } from "./maintenance-panel";
import { InspectionPanel } from "./inspection-panel";
import { HealthPanel } from "./health-panel";

const TABS = [
  { id: "dashboard", label: "Dashboard", render: () => <DashboardPanel /> },
  { id: "property", label: "Property", render: () => <PropertyDetailPanel /> },
  { id: "finance", label: "Finance", render: () => <StatementPanel /> },
  {
    id: "maintenance",
    label: "Maintenance",
    render: () => <MaintenancePanel />,
  },
  {
    id: "inspections",
    label: "Inspections",
    render: () => <InspectionPanel />,
  },
  { id: "health", label: "Property Health", render: () => <HealthPanel /> },
] as const;

/**
 * Tabbed tour of illustrative NexaHaus Connect screens. Emits
 * `connect_preview_viewed` once when it first enters view.
 */
export function ConnectShowcase() {
  const [active, setActive] =
    useState<(typeof TABS)[number]["id"]>("dashboard");
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen) return;
    setSeen(true);
    track("connect_preview_viewed", { surface: "nexahaus_connect_page" });
  }, [seen]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="NexaHaus Connect screens"
        className="flex flex-wrap gap-1.5"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500",
              active === t.id
                ? "bg-navy-900 text-white"
                : "border border-line text-ink-muted hover:border-navy-300 hover:text-navy-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 motion-safe:animate-fade-in">
        {TABS.find((t) => t.id === active)?.render()}
      </div>
    </div>
  );
}

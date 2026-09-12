"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminOverview } from "@/lib/admin-resources";
import { formatMinor, formatPercent } from "@/lib/format";
import { cn } from "@/lib/cn";
import { StatCard, Card, CardHeader } from "@/components/ui/card";
import { LoadingCards, ErrorState, PageHeader } from "@/components/ui/states";

const ALERT_STYLE: Record<AdminOverview["alerts"][number]["level"], string> = {
  URGENT: "bg-red-50 text-red-800 ring-red-100",
  ACTION: "bg-amber-50 text-amber-900 ring-amber-100",
  WARNING: "bg-sky-50 text-sky-900 ring-sky-100",
};

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api.get<AdminOverview>("/admin/overview"),
  });

  return (
    <div>
      <PageHeader
        title="Operations overview"
        subtitle="Portfolio-wide status for the NexaHaus team."
      />

      {isLoading ? (
        <LoadingCards count={4} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-6">
          {data.alerts.length > 0 ? (
            <div className="space-y-2">
              {data.alerts.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset",
                    ALERT_STYLE[a.level],
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {a.level}
                  </span>
                  {a.message}
                </div>
              ))}
            </div>
          ) : null}

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Properties managed"
              value={data.portfolio.propertiesManaged}
              hint={`${data.portfolio.occupiedProperties} occupied · ${data.portfolio.vacantProperties} vacant`}
            />
            <StatCard
              label="Occupancy"
              value={formatPercent(data.portfolio.occupancyRate)}
            />
            <StatCard
              label="Collected this month"
              value={formatMinor(
                data.rent.monthlyCollectedMinor,
                data.currency,
              )}
              hint={`${formatPercent(data.rent.collectionRate)} of expected`}
              tone="positive"
            />
            <StatCard
              label="Outstanding rent"
              value={formatMinor(data.rent.outstandingMinor, data.currency)}
              tone={data.rent.outstandingMinor === "0" ? "default" : "warning"}
            />
          </section>

          <Card>
            <CardHeader title="Operational load" />
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Metric
                label="Open maintenance"
                value={data.operations.openMaintenance}
              />
              <Metric
                label="Urgent issues"
                value={data.operations.urgentIssues}
                tone={data.operations.urgentIssues > 0 ? "critical" : undefined}
              />
              <Metric
                label="Pending approvals"
                value={data.operations.pendingApprovals}
                tone={
                  data.operations.pendingApprovals > 0 ? "warning" : undefined
                }
              />
              <Metric
                label="Inspections due"
                value={data.operations.inspectionsDue}
              />
              <Metric
                label="Docs expiring"
                value={data.operations.documentsExpiring}
                tone={
                  data.operations.documentsExpiring > 0 ? "warning" : undefined
                }
              />
              <Metric
                label="Overdue charges"
                value={data.operations.overdueCharges}
                tone={
                  data.operations.overdueCharges > 0 ? "critical" : undefined
                }
              />
            </dl>
          </Card>

          <section className="grid grid-cols-2 gap-4 sm:max-w-md">
            <StatCard
              label="Active clients"
              value={data.growth.activeClients}
            />
            <StatCard label="New leads (30d)" value={data.growth.newLeads} />
          </section>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "critical" | "warning";
}) {
  return (
    <div>
      <dt className="nx-label">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "critical" && "text-critical",
          tone === "warning" && "text-warning",
          !tone && "text-navy-900",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

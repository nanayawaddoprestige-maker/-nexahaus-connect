"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import type { OwnerDashboard } from "@/lib/resources";
import { useAuth } from "@/lib/auth-context";
import { formatMinor, formatPercent } from "@/lib/format";
import { StatCard, Card, CardHeader } from "@/components/ui/card";
import { LoadingCards, ErrorState, PageHeader } from "@/components/ui/states";

const PERIODS = [
  { value: "this_month", label: "This month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
] as const;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] =
    useState<(typeof PERIODS)[number]["value"]>("this_month");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "owner", period],
    queryFn: () => api.get<OwnerDashboard>("/dashboard/owner", { period }),
  });

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="Here is where your portfolio stands today."
        action={
          <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                  (period === p.value
                    ? "bg-navy-900 text-white"
                    : "text-ink-muted hover:text-navy-900")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <LoadingCards count={5} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="Properties"
              value={data.portfolio.totalProperties}
              hint={`${data.portfolio.occupiedProperties} occupied · ${data.portfolio.vacantProperties} vacant`}
            />
            <StatCard
              label="Occupancy"
              value={formatPercent(data.portfolio.occupancyRate)}
              hint={`${data.portfolio.occupiedUnits}/${data.portfolio.totalUnits} units`}
            />
            <StatCard
              label="Collected rent"
              value={formatMinor(data.rent.collectedMinor, data.currency)}
              hint={`of ${formatMinor(data.rent.expectedMinor, data.currency)} expected`}
              tone="positive"
            />
            <StatCard
              label="Outstanding rent"
              value={formatMinor(data.rent.outstandingMinor, data.currency)}
              hint={`collection rate ${formatPercent(data.rent.collectionRate)}`}
              tone={data.rent.outstandingMinor === "0" ? "default" : "warning"}
            />
            <StatCard
              label="Portfolio health"
              value={
                data.portfolioHealthScore == null
                  ? "—"
                  : `${data.portfolioHealthScore}/100`
              }
              hint="average across properties"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StatCard
              label="Open maintenance"
              value={data.attention.openMaintenance}
              hint={
                data.attention.urgentMaintenance > 0
                  ? `${data.attention.urgentMaintenance} urgent`
                  : "nothing urgent"
              }
              tone={
                data.attention.urgentMaintenance > 0 ? "critical" : "default"
              }
            />
            <StatCard
              label="Pending approvals"
              value={data.attention.pendingApprovals}
              hint="awaiting your decision"
              tone={data.attention.pendingApprovals > 0 ? "warning" : "default"}
            />
            <StatCard
              label="Inspections due"
              value={data.attention.inspectionsDue}
              hint="scheduled or assigned"
            />
          </section>

          <Card>
            <CardHeader
              title="Rent — expected vs collected"
              description="Monthly, across your portfolio"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.charts.monthly.map((m) => ({
                    month: m.month,
                    Expected: Number(m.expectedMinor) / 100,
                    Collected: Number(m.collectedMinor) / 100,
                  }))}
                  margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) =>
                      `${data.currency} ${v.toLocaleString("en-GH")}`
                    }
                  />
                  <Bar
                    dataKey="Expected"
                    fill="#a7b6d3"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="Collected"
                    fill="#0a1f44"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

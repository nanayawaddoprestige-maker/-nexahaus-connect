"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getAccessToken } from "@/lib/api";
import type { TabularReport } from "@/lib/intel-resources";
import { OWNER_REPORT_KINDS } from "@/lib/intel-resources";
import { formatMinor } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

const PERIODS = [
  { value: "this_month", label: "This month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
] as const;

function cell(value: string | number, kind?: string): string {
  if (kind === "money") return formatMinor(String(value), "GHS");
  if (kind === "percent") return `${value}%`;
  return String(value);
}

export default function ReportsPage() {
  const [kind, setKind] = useState<string>(OWNER_REPORT_KINDS[0].value);
  const [period, setPeriod] = useState<string>("this_month");

  const report = useQuery({
    queryKey: ["report", kind, period],
    queryFn: () => api.get<TabularReport>(`/reports/owner/${kind}`, { period }),
  });

  async function downloadCsv() {
    const res = await fetch(
      `/api/v1/reports/owner/${kind}?period=${period}&format=csv`,
      { headers: { authorization: `Bearer ${getAccessToken() ?? ""}` } },
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const r = report.data;

  return (
    <div>
      <PageHeader title="Reports" subtitle="Portfolio and property figures, on demand." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        >
          {OWNER_REPORT_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                (period === p.value ? "bg-navy-900 text-white" : "text-ink-muted hover:text-navy-900")
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={() => void downloadCsv()}>
          Download CSV
        </Button>
      </div>

      {report.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : report.isError ? (
        <ErrorState onRetry={() => void report.refetch()} />
      ) : !r || r.columns.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-subtle">No data for this report and period.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-navy-900">
            {r.title}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
                {r.columns.map((c) => (
                  <th
                    key={c.key}
                    className={
                      "px-4 py-2 font-medium " +
                      (c.kind === "money" || c.kind === "number" || c.kind === "percent"
                        ? "text-right"
                        : "")
                    }
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.rows.map((row, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  {r.columns.map((c) => (
                    <td
                      key={c.key}
                      className={
                        "px-4 py-2.5 " +
                        (c.kind === "money" || c.kind === "number" || c.kind === "percent"
                          ? "text-right tabular-nums text-navy-900"
                          : "text-ink-muted")
                      }
                    >
                      {cell(row[c.key] ?? "", c.kind)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {r.notes?.length ? (
            <div className="border-t border-line px-4 py-3 text-xs text-ink-subtle">
              {r.notes.map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

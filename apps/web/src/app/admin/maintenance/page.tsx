"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MaintenanceRow } from "@/lib/ops-resources";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

const PRIORITY_TONE: Record<
  string,
  "critical" | "warning" | "info" | "neutral"
> = {
  URGENT: "critical",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
};

export default function AdminMaintenancePage() {
  const [openOnly, setOpenOnly] = useState(true);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "maintenance", { openOnly, page }],
    queryFn: () =>
      api.list<MaintenanceRow>("/maintenance", {
        query: { openOnly: openOnly ? "true" : undefined, page, pageSize: 20 },
      }),
    placeholderData: keepPreviousData,
  });
  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Requests across every property in the portfolio."
      />
      <label className="mb-4 flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={openOnly}
          onChange={(e) => {
            setOpenOnly(e.target.checked);
            setPage(1);
          }}
        />
        Open requests only
      </label>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={openOnly ? "No open maintenance" : "No maintenance requests"}
          description="Requests reported by tenants, owners or staff appear here."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <Link key={m.id} href={`/maintenance/${m.id}`}>
              <Card className="flex items-center justify-between gap-4 transition-shadow hover:shadow-raised">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={m.priority}
                      tone={PRIORITY_TONE[m.priority]}
                    />
                    <span className="truncate font-medium text-navy-900">
                      {m.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-subtle">
                    <span className="font-mono">{m.ref}</span> ·{" "}
                    {m.property.name}
                    {m.unit ? ` · ${m.unit}` : ""} · {titleCase(m.category)}
                    {m.scheduledFor
                      ? ` · scheduled ${formatDate(m.scheduledFor)}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-sm tabular-nums text-ink-muted">
                    {formatMoney(
                      m.actualCost ?? m.approvedCost ?? m.estimatedCost,
                    )}
                  </span>
                  <StatusBadge status={m.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {meta && (meta.totalPages ?? 1) > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-subtle">
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={(meta.page ?? 1) <= 1}
              onClick={() => setPage((n) => n - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={(meta.page ?? 1) >= (meta.totalPages ?? 1)}
              onClick={() => setPage((n) => n + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

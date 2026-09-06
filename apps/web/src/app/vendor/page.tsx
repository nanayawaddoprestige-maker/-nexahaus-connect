"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

interface WorkOrderRow {
  id: string;
  ref: string;
  status: string;
  scheduledFor: string | null;
  cost: { minor: string; currency: string } | null;
  request: {
    id: string;
    ref: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    location: string;
    address: string;
  };
}

const PRIORITY_TONE: Record<string, "critical" | "warning" | "neutral"> = {
  URGENT: "critical",
  HIGH: "warning",
  MEDIUM: "neutral",
  LOW: "neutral",
};

export default function VendorHome() {
  const [openOnly, setOpenOnly] = useState(true);
  const list = useQuery({
    queryKey: ["vendor", "work-orders", openOnly],
    queryFn: () => api.list<WorkOrderRow>("/vendor/work-orders", { query: { openOnly: openOnly ? "true" : undefined } }),
  });

  const rows = list.data?.items ?? [];

  return (
    <div>
      <PageHeader title="Work orders" subtitle="Jobs NexaHaus has assigned to you." />
      <label className="mb-4 flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
        Open jobs only
      </label>

      {list.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title={openOnly ? "No open jobs" : "No work orders"} description="Assigned jobs appear here." />
      ) : (
        <div className="space-y-3">
          {rows.map((w) => (
            <Link key={w.id} href={`/vendor/${w.id}`}>
              <Card className="transition-shadow hover:shadow-raised">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={w.request.priority} tone={PRIORITY_TONE[w.request.priority]} />
                      <span className="font-medium text-navy-900">{w.request.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-subtle">
                      <span className="font-mono">{w.ref}</span> · {titleCase(w.request.category)} · {w.request.location}
                    </p>
                    <p className="text-xs text-ink-subtle">{w.request.address}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={w.status} />
                    {w.scheduledFor ? (
                      <p className="mt-1 text-xs text-ink-subtle">{formatDate(w.scheduledFor)}</p>
                    ) : null}
                    {w.cost ? <p className="text-xs tabular-nums text-ink-muted">{formatMoney(w.cost)}</p> : null}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InspectionRow } from "@/lib/ops-resources";
import { formatDate, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

const CONDITION_TONE: Record<string, "positive" | "warning" | "critical" | "neutral"> = {
  EXCELLENT: "positive",
  GOOD: "positive",
  FAIR: "warning",
  POOR: "critical",
};

export default function InspectionsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inspections", "list"],
    queryFn: () => api.list<InspectionRow>("/inspections", { query: { pageSize: 50 } }),
  });
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Inspections"
        subtitle="Scheduled and completed inspections across your portfolio."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No inspections yet"
          description="Your NexaHaus manager schedules inspections based on each property's management agreement."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((i) => (
            <Link key={i.id} href={`/inspections/${i.id}`}>
              <Card className="flex items-center justify-between gap-4 transition-shadow hover:shadow-raised">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy-900">
                      {titleCase(i.type)} inspection
                    </span>
                    {i.overallCondition ? (
                      <StatusBadge
                        status={i.overallCondition}
                        tone={CONDITION_TONE[i.overallCondition]}
                      />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-ink-subtle">
                    <span className="font-mono">{i.ref}</span> · {i.property.name}
                    {i.inspector ? ` · ${i.inspector.fullName}` : ""}
                    {i.completedAt
                      ? ` · completed ${formatDate(i.completedAt)}`
                      : i.scheduledFor
                        ? ` · scheduled ${formatDate(i.scheduledFor)}`
                        : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {i.reportDocumentId ? (
                    <span className="text-xs font-medium text-navy-700">Report ready</span>
                  ) : null}
                  <StatusBadge status={i.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

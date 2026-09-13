"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InspectionRow } from "@/lib/ops-resources";
import { formatDate, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

const CONDITION_TONE: Record<
  string,
  "positive" | "warning" | "critical" | "neutral"
> = {
  EXCELLENT: "positive",
  GOOD: "positive",
  FAIR: "warning",
  POOR: "critical",
};

export default function AdminInspectionsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "inspections", { page }],
    queryFn: () =>
      api.list<InspectionRow>("/inspections", {
        query: { page, pageSize: 20 },
      }),
    placeholderData: keepPreviousData,
  });
  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Inspections"
        subtitle="Scheduled and completed inspections across the portfolio."
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
          description="Inspections scheduled against management agreements appear here."
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
                    <span className="font-mono">{i.ref}</span> ·{" "}
                    {i.property.name}
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
                    <span className="text-xs font-medium text-navy-700">
                      Report ready
                    </span>
                  ) : null}
                  <StatusBadge status={i.status} />
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

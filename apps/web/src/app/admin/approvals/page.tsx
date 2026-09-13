"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApprovalRow } from "@/lib/ops-resources";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

export default function AdminApprovalsPage() {
  const [tab, setTab] = useState<"PENDING" | "ALL">("PENDING");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "approvals", tab, page],
    queryFn: () =>
      api.list<ApprovalRow>("/approvals", {
        query: {
          status: tab === "PENDING" ? "PENDING" : undefined,
          page,
          pageSize: 20,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle="Owner decisions across the portfolio — NexaHaus raises these, owners decide."
        action={
          <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
            {(["PENDING", "ALL"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
                className={
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                  (tab === t
                    ? "bg-navy-900 text-white"
                    : "text-ink-muted hover:text-navy-900")
                }
              >
                {t === "PENDING" ? "Pending" : "All"}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === "PENDING" ? "Nothing pending" : "No approvals yet"}
          description="Requests that need an owner's decision appear here once raised."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-subtle">
                      {a.ref}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 font-medium text-navy-900">
                    {titleCase(a.type)}
                    {a.property ? ` · ${a.property.name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums text-navy-900">
                    {formatMoney(a.amount)}
                  </p>
                  {a.threshold ? (
                    <p className="text-xs text-ink-subtle">
                      threshold {formatMoney(a.threshold)}
                    </p>
                  ) : null}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 border-t border-line pt-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="nx-label">Requested by</dt>
                  <dd className="mt-0.5 text-navy-900">
                    {a.requestedBy?.fullName ?? "NexaHaus"}
                  </dd>
                </div>
                <div>
                  <dt className="nx-label">Raised</dt>
                  <dd className="mt-0.5 text-navy-900">
                    {formatDate(a.createdAt)}
                  </dd>
                </div>
                {a.dueAt ? (
                  <div>
                    <dt className="nx-label">Needed by</dt>
                    <dd className="mt-0.5 text-navy-900">
                      {formatDate(a.dueAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Card>
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

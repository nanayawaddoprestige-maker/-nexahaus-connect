"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, formatMinor, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

interface ExpenseRow {
  id: string;
  ref: string;
  category: string;
  description: string;
  total: { minor: string; currency: string };
  status: string;
  approvalStatus: string;
  paymentStatus: string;
  incurredAt: string;
  property: { name: string; ref: string };
  vendor: string | null;
}

const FILTERS = [
  "",
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PAID",
] as const;

export default function AdminExpensesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "expenses", status],
    queryFn: () =>
      api.list<ExpenseRow>("/expenses", {
        query: { status: status || undefined, pageSize: 30 },
      }),
  });

  const action = useMutation({
    mutationFn: ({
      id,
      verb,
      body,
    }: {
      id: string;
      verb: string;
      body?: unknown;
    }) => api.post(`/expenses/${id}/${verb}`, body ?? {}),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["admin", "expenses"] }),
  });

  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={
          meta?.totalItems != null ? `${meta.totalItems} recorded` : undefined
        }
      />

      <div className="mb-4 flex gap-1 rounded-lg border border-line bg-surface p-1">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            onClick={() => setStatus(f)}
            className={
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
              (status === f
                ? "bg-navy-900 text-white"
                : "text-ink-muted hover:text-navy-900")
            }
          >
            {f ? titleCase(f) : "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No expenses"
          description="Property expenses appear here as they are recorded."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">Ref / property</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Incurred</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-navy-700">
                      {e.ref}
                    </span>
                    <div className="text-xs text-ink-subtle">
                      {e.property.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {titleCase(e.category)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-navy-900">
                    {formatMinor(e.total.minor, e.total.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                    {e.approvalStatus === "PENDING" ? (
                      <span className="ml-1 text-xs text-warning">
                        approval
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(e.incurredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {e.status === "DRAFT" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            action.mutate({ id: e.id, verb: "submit" })
                          }
                        >
                          Submit
                        </Button>
                      ) : null}
                      {e.status === "SUBMITTED" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            action.mutate({
                              id: e.id,
                              verb: "decision",
                              body: { decision: "APPROVED" },
                            })
                          }
                        >
                          Approve
                        </Button>
                      ) : null}
                      {e.status === "APPROVED" && e.paymentStatus !== "PAID" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            action.mutate({
                              id: e.id,
                              verb: "pay",
                              body: { method: "BANK_TRANSFER" },
                            })
                          }
                        >
                          Pay
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

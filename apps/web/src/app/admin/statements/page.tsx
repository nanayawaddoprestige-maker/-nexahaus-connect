"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { StatementRow } from "@/lib/finance-resources";
import { formatDate, formatMinor } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

const inputCls =
  "h-9 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500";

function monthDefaults() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function AdminStatementsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => ({
    clientId: "",
    propertyId: "",
    ...monthDefaults(),
  }));
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "statements"],
    queryFn: () =>
      api.list<StatementRow>("/statements", { query: { pageSize: 25 } }),
  });

  const generate = useMutation({
    mutationFn: () =>
      api.post("/statements/generate", {
        clientId: form.clientId.trim(),
        propertyId: form.propertyId.trim() || undefined,
        periodStart: form.start,
        periodEnd: form.end,
        idempotencyKey: `stmt:${form.clientId.trim()}:${form.propertyId.trim() || "all"}:${form.start}`,
      }),
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ["admin", "statements"] });
    },
    onError: (e) =>
      setError(
        e instanceof ApiError ? e.message : "Could not generate the statement.",
      ),
  });

  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Statements"
        subtitle={
          meta?.totalItems != null ? `${meta.totalItems} generated` : undefined
        }
      />

      <Card className="mb-6">
        <CardHeader
          title="Generate a statement"
          description="Totals are computed from the transaction ledger. Re-running the same client + period returns the existing statement."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className={inputCls}
            placeholder="Client ID (UUID)"
            value={form.clientId}
            onChange={(e) =>
              setForm((f) => ({ ...f, clientId: e.target.value }))
            }
          />
          <input
            className={inputCls}
            placeholder="Property ID (optional)"
            value={form.propertyId}
            onChange={(e) =>
              setForm((f) => ({ ...f, propertyId: e.target.value }))
            }
          />
          <input
            type="date"
            className={inputCls}
            value={form.start}
            onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
          />
          <input
            type="date"
            className={inputCls}
            value={form.end}
            onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
          />
          <Button
            loading={generate.isPending}
            disabled={!form.clientId.trim()}
            onClick={() => generate.mutate()}
          >
            Generate
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-critical">{error}</p> : null}
      </Card>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No statements yet"
          description="Generate one above."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 text-right font-medium">Net</th>
                <th className="px-4 py-3 text-right font-medium">Closing</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-line last:border-0 hover:bg-surface-sunken"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/finance/statements/${s.id}`}
                      className="font-mono text-xs text-navy-700"
                    >
                      {s.ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{s.property}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-navy-900">
                    {formatMinor(s.netAmountMinor, s.currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-navy-900">
                    {formatMinor(s.closingBalanceMinor, s.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
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

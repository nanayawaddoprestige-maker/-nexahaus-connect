"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { PaymentRow } from "@/lib/finance-resources";
import { formatDate, formatMinor, titleCase } from "@/lib/format";
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

export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const [unreconciledOnly, setUnreconciledOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    leaseId: "",
    cedis: "",
    method: "MOBILE_MONEY",
    reference: "",
  });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "payments", unreconciledOnly],
    queryFn: () =>
      api.list<PaymentRow>("/payments", {
        query: {
          pageSize: 30,
          reconciliationStatus: unreconciledOnly ? "UNRECONCILED" : undefined,
        },
      }),
  });

  const record = useMutation({
    mutationFn: () =>
      api.post("/payments", {
        leaseId: form.leaseId.trim(),
        amount: {
          minor: String(Math.round(Number(form.cedis) * 100)),
          currency: "GHS",
        },
        receivedAt: new Date().toISOString(),
        method: form.method,
        reference: form.reference.trim() || undefined,
        idempotencyKey: `manual:${form.leaseId.trim()}:${form.cedis}:${Date.now()}`,
      }),
    onSuccess: () => {
      setError(null);
      setForm({
        leaseId: "",
        cedis: "",
        method: "MOBILE_MONEY",
        reference: "",
      });
      void qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
    onError: (e) =>
      setError(
        e instanceof ApiError ? e.message : "Could not record the payment.",
      ),
  });

  const reconcile = useMutation({
    mutationFn: () => api.post("/payments/reconcile", { ids: [...selected] }),
    onSuccess: () => {
      setSelected(new Set());
      void qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
  });

  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={
          meta?.totalItems != null ? `${meta.totalItems} recorded` : undefined
        }
      />

      <Card className="mb-6">
        <CardHeader
          title="Record a payment"
          description="For payments received outside the online channel (bank deposit, cash handover, MoMo confirmation)."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className={inputCls}
            placeholder="Lease ID (UUID)"
            value={form.leaseId}
            onChange={(e) =>
              setForm((f) => ({ ...f, leaseId: e.target.value }))
            }
          />
          <input
            className={inputCls}
            placeholder="Amount (GHS)"
            inputMode="decimal"
            value={form.cedis}
            onChange={(e) => setForm((f) => ({ ...f, cedis: e.target.value }))}
          />
          <select
            className={inputCls}
            value={form.method}
            onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
          >
            {[
              "MOBILE_MONEY",
              "BANK_TRANSFER",
              "BANK_DEPOSIT",
              "CASH",
              "OTHER",
            ].map((m) => (
              <option key={m} value={m}>
                {titleCase(m)}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Reference (optional)"
            value={form.reference}
            onChange={(e) =>
              setForm((f) => ({ ...f, reference: e.target.value }))
            }
          />
          <Button
            loading={record.isPending}
            disabled={!form.leaseId.trim() || !Number(form.cedis)}
            onClick={() => record.mutate()}
          >
            Record
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-critical">{error}</p> : null}
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={unreconciledOnly}
            onChange={(e) => setUnreconciledOnly(e.target.checked)}
          />
          Unreconciled only
        </label>
        {selected.size > 0 ? (
          <Button
            size="sm"
            loading={reconcile.isPending}
            onClick={() => reconcile.mutate()}
          >
            Reconcile {selected.size} selected
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No payments"
          description="Recorded and online payments appear here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
                <th className="px-3 py-3"></th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Property / tenant</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Reconciliation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-3">
                    {p.reconciliationStatus !== "RECONCILED" ? (
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={(e) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(p.id);
                            else next.delete(p.id);
                            return next;
                          });
                        }}
                      />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-700">
                    {p.ref}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {p.property?.name ?? "—"}
                    {p.tenant ? ` · ${p.tenant}` : ""}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-navy-900">
                    {formatMinor(p.amount.minor, p.amount.currency)}
                    {p.unallocatedMinor !== "0" ? (
                      <span className="ml-1 text-xs text-warning">+credit</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {titleCase(p.method)}
                    {p.provider ? ` · ${p.provider}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(p.receivedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={p.reconciliationStatus}
                      tone={
                        p.reconciliationStatus === "RECONCILED"
                          ? "positive"
                          : "neutral"
                      }
                    />
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

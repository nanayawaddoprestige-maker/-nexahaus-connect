"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TenantPayment, TenantRent } from "@/lib/tenant-resources";
import { formatDate, formatMinor, formatMoney, titleCase } from "@/lib/format";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

export default function TenantRentPage() {
  const rent = useQuery({
    queryKey: ["tenant", "rent"],
    queryFn: () => api.get<TenantRent>("/tenant/rent"),
  });
  const payments = useQuery({
    queryKey: ["tenant", "payments"],
    queryFn: () => api.list<TenantPayment>("/tenant/payments"),
  });

  if (rent.isLoading) return <Skeleton className="h-96 w-full" />;
  if (rent.isError || !rent.data)
    return <ErrorState onRetry={() => void rent.refetch()} />;

  const r = rent.data;

  return (
    <div>
      <PageHeader
        title="Rent"
        subtitle="What you owe, what you've paid, and how to pay."
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Billed to date"
          value={formatMinor(r.summary.billedMinor, r.currency)}
        />
        <StatCard
          label="Paid"
          value={formatMinor(r.summary.paidMinor, r.currency)}
          tone="positive"
        />
        <StatCard
          label="Outstanding"
          value={formatMinor(r.summary.outstandingMinor, r.currency)}
          tone={r.summary.outstandingMinor === "0" ? "positive" : "warning"}
        />
      </section>

      <Card className="mb-6">
        <CardHeader title="How to pay" />
        <p className="text-sm text-ink">{r.paymentInstructions}</p>
      </Card>

      <Card className="mb-6 overflow-x-auto p-0">
        <div className="border-b border-line px-4 py-3 text-sm font-semibold text-navy-900">
          Rent schedule
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
              <th className="px-4 py-2 font-medium">Period</th>
              <th className="px-4 py-2 font-medium">Due</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
              <th className="px-4 py-2 text-right font-medium">Outstanding</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {r.charges.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink-muted">{c.period}</td>
                <td className="px-4 py-2.5 text-ink-muted">
                  {formatDate(c.dueDate)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-navy-900">
                  {formatMoney(c.amount)}
                </td>
                <td
                  className={
                    "px-4 py-2.5 text-right tabular-nums " +
                    (c.outstandingMinor === "0"
                      ? "text-ink-subtle"
                      : "text-warning")
                  }
                >
                  {formatMinor(c.outstandingMinor, c.amount.currency)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader title="Payment history" />
        {payments.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (payments.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-subtle">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {payments.data!.items.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-2.5"
              >
                <div>
                  <p className="font-medium text-navy-900">
                    {formatMoney(p.amount)}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {titleCase(p.method)} · {formatDate(p.receivedAt)}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </p>
                </div>
                <StatusBadge
                  status={p.status}
                  tone={p.status === "CONFIRMED" ? "positive" : "neutral"}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  OwnerFinancials,
  PaymentRow,
  StatementRow,
} from "@/lib/finance-resources";
import { formatDate, formatMinor, titleCase } from "@/lib/format";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, LoadingCards, PageHeader, Skeleton } from "@/components/ui/states";

const PERIODS = [
  { value: "this_month", label: "This month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
] as const;

export default function FinancePage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("this_month");

  const fin = useQuery({
    queryKey: ["finance", "owner", period],
    queryFn: () => api.get<OwnerFinancials>("/dashboard/owner/financials", { period }),
  });
  const payments = useQuery({
    queryKey: ["finance", "payments"],
    queryFn: () => api.list<PaymentRow>("/payments", { query: { pageSize: 10 } }),
  });
  const statements = useQuery({
    queryKey: ["finance", "statements"],
    queryFn: () => api.list<StatementRow>("/statements", { query: { pageSize: 12 } }),
  });

  return (
    <div>
      <PageHeader
        title="Rent & Finance"
        subtitle="Your income, costs and distributions, straight from the ledger."
        action={
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
        }
      />

      {fin.isLoading ? (
        <LoadingCards count={4} />
      ) : fin.isError || !fin.data ? (
        <ErrorState onRetry={() => void fin.refetch()} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Gross rental income"
              value={formatMinor(fin.data.grossRentalIncomeMinor, fin.data.currency)}
              tone="positive"
            />
            <StatCard
              label="Management fees"
              value={formatMinor(fin.data.managementFeesMinor, fin.data.currency)}
              hint={fin.data.managementFeesProjected ? "projected for this period" : undefined}
            />
            <StatCard
              label="Maintenance"
              value={formatMinor(fin.data.maintenanceExpensesMinor, fin.data.currency)}
            />
            <StatCard
              label="Other expenses"
              value={formatMinor(fin.data.otherExpensesMinor, fin.data.currency)}
            />
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="nx-card lg:col-span-2">
              <p className="nx-label">Net owner income</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-navy-900">
                {formatMinor(fin.data.netOwnerIncomeMinor, fin.data.currency)}
              </p>
              <p className="mt-1 text-xs text-ink-subtle">
                gross rent − management fees − maintenance − other approved expenses
              </p>
            </div>
            <StatCard
              label="Outstanding rent"
              value={formatMinor(fin.data.outstandingRentMinor, fin.data.currency)}
              tone={fin.data.outstandingRentMinor === "0" ? "default" : "warning"}
            />
            <StatCard
              label="Vacancy loss"
              value={formatMinor(fin.data.vacancyLossMinor, fin.data.currency)}
              hint="vacant units × market rent"
            />
          </section>
        </>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent payments" />
          {payments.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (payments.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-subtle">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {payments.data!.items.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium text-navy-900">
                      {formatMinor(p.amount.minor, p.amount.currency)}
                      <span className="ml-2 text-xs text-ink-subtle">{titleCase(p.method)}</span>
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {p.property?.name ?? "—"} · {formatDate(p.receivedAt)}
                      {p.unallocatedMinor !== "0" ? " · credit balance" : ""}
                    </p>
                  </div>
                  <StatusBadge status={p.status} tone={p.status === "CONFIRMED" ? "positive" : "neutral"} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Statements" />
          {statements.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (statements.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-subtle">
              Monthly statements appear here once NexaHaus generates them.
            </p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {statements.data!.items.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <Link href={`/finance/statements/${s.id}`} className="min-w-0">
                    <p className="font-medium text-navy-900">
                      {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {s.property} · net {formatMinor(s.netAmountMinor, s.currency)}
                    </p>
                  </Link>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

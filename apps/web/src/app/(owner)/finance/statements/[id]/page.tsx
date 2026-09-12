"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { StatementDetail } from "@/lib/finance-resources";
import { formatDate, formatMinor } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

export default function StatementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["statement", params.id],
    queryFn: () => api.get<StatementDetail>(`/statements/${params.id}`),
    retry: false,
  });

  const download = useMutation({
    mutationFn: () =>
      api.get<{ url: string }>(
        `/documents/${data!.pdfDocumentId}/download-url`,
      ),
    onSuccess: (res) => window.open(res.url, "_blank", "noopener"),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        title={
          notFound ? "Statement not found" : "We couldn't load this statement."
        }
        onRetry={notFound ? undefined : () => void refetch()}
      />
    );
  }

  const c = data.currency;
  const rows: [string, string, boolean?][] = [
    ["Opening balance", formatMinor(data.openingBalanceMinor, c), true],
    ["Gross rental income", formatMinor(data.grossRentalIncomeMinor, c)],
    ["Management fees", `− ${formatMinor(data.managementFeesMinor, c)}`],
    [
      "Maintenance expenses",
      `− ${formatMinor(data.maintenanceExpensesMinor, c)}`,
    ],
    ["Other approved expenses", `− ${formatMinor(data.otherExpensesMinor, c)}`],
    ["Net for the period", formatMinor(data.netAmountMinor, c), true],
    ["Owner distributions", `− ${formatMinor(data.distributionsMinor, c)}`],
    ["Closing balance", formatMinor(data.closingBalanceMinor, c), true],
  ];

  return (
    <div>
      <button
        onClick={() => router.push("/finance")}
        className="mb-4 text-sm text-ink-muted hover:text-navy-900"
      >
        ← Back to finance
      </button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Owner statement
            <StatusBadge status={data.status} />
          </span>
        }
        subtitle={`${data.ref} · ${data.property?.name ?? "Portfolio"} · ${formatDate(data.periodStart)} – ${formatDate(data.periodEnd)}`}
        action={
          data.pdfDocumentId ? (
            <Button
              size="sm"
              variant="secondary"
              loading={download.isPending}
              onClick={() => download.mutate()}
            >
              Download PDF
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-6">
        <dl className="space-y-2 text-sm">
          {rows.map(([label, value, bold]) => (
            <div
              key={label}
              className={
                "flex items-center justify-between " +
                (bold
                  ? "border-t border-line pt-2 font-semibold text-navy-900"
                  : "text-ink-muted")
              }
            >
              <dt>{label}</dt>
              <dd className="tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-line px-4 py-3 text-sm font-semibold text-navy-900">
          Transactions ({data.lines.length})
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink-muted">
                  {formatDate(l.occurredAt)}
                </td>
                <td className="px-4 py-2.5 text-navy-900">{l.description}</td>
                <td
                  className={
                    "px-4 py-2.5 text-right tabular-nums " +
                    (l.direction === "CREDIT"
                      ? "text-positive"
                      : "text-navy-900")
                  }
                >
                  {l.direction === "CREDIT" ? "" : "− "}
                  {formatMinor(l.amountMinor, c)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="mt-4 text-xs text-ink-subtle">
        Every figure above is computed from recorded transactions and is not
        adjusted manually. Contact NexaHaus with any query about a line item.
      </p>
    </div>
  );
}

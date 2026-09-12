"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { MaintenanceDetail } from "@/lib/ops-resources";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Timeline } from "@/components/ui/timeline";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

export default function MaintenanceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["maintenance", params.id],
    queryFn: () => api.get<MaintenanceDetail>(`/maintenance/${params.id}`),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        title={
          notFound ? "Request not found" : "We couldn't load this request."
        }
        description={
          notFound
            ? "It may have been closed, or is outside your access."
            : "Please try again."
        }
        onRetry={notFound ? undefined : () => void refetch()}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/maintenance")}
        className="mb-4 text-sm text-ink-muted hover:text-navy-900"
      >
        ← All maintenance
      </button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {data.title}
            <StatusBadge status={data.status} />
          </span>
        }
        subtitle={`${data.ref} · ${data.property.name}${data.unit ? ` · ${data.unit.label}` : ""} · ${titleCase(data.category)} · ${titleCase(data.priority)} priority`}
      />

      {data.status === "AWAITING_APPROVAL" ? (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-100">
          This request is waiting for your approval of the estimated cost. Check
          your Approvals to decide.
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Estimated cost"
          value={formatMoney(data.estimatedCost)}
        />
        <StatCard
          label="Approved cost"
          value={formatMoney(data.approvedCost)}
        />
        <StatCard
          label="Actual cost"
          value={formatMoney(data.actualCost)}
          tone={data.actualCost ? "positive" : "default"}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Details" />
          <p className="whitespace-pre-line text-sm text-ink">
            {data.description}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-line pt-4 text-sm">
            <div>
              <dt className="nx-label">Reported by</dt>
              <dd className="mt-0.5 text-navy-900">
                {data.reportedBy.tenant?.fullName ??
                  titleCase(data.reportedBy.type)}
              </dd>
            </div>
            <div>
              <dt className="nx-label">Scheduled</dt>
              <dd className="mt-0.5 text-navy-900">
                {formatDate(data.scheduledFor)}
              </dd>
            </div>
            <div>
              <dt className="nx-label">Completed</dt>
              <dd className="mt-0.5 text-navy-900">
                {formatDate(data.completedAt)}
              </dd>
            </div>
            <div>
              <dt className="nx-label">Verified</dt>
              <dd className="mt-0.5 text-navy-900">
                {formatDate(data.verifiedAt)}
              </dd>
            </div>
          </dl>

          {data.workOrders.length > 0 ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="nx-label mb-2">Work orders</p>
              <ul className="space-y-2 text-sm">
                {data.workOrders.map((w) => (
                  <li key={w.id} className="flex items-center justify-between">
                    <span className="text-navy-900">
                      <span className="font-mono text-xs text-ink-subtle">
                        {w.ref}
                      </span>
                      {w.vendor ? ` · ${w.vendor.name}` : ""}
                      {w.completionNotes ? ` — ${w.completionNotes}` : ""}
                    </span>
                    <span className="flex items-center gap-3 text-ink-subtle">
                      {formatMoney(w.cost)}
                      <StatusBadge status={w.status} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.media.length > 0 ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="nx-label mb-2">Photos ({data.media.length})</p>
              <div className="flex flex-wrap gap-2">
                {data.media.map((m) => (
                  <span
                    key={m.documentId}
                    className="rounded-md border border-line bg-surface-sunken px-2 py-1 text-xs text-ink-subtle"
                  >
                    {titleCase(m.kind)} photo
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <CardHeader title="History" />
          <Timeline
            entries={data.timeline.map((t) => ({
              title: `${t.from ? titleCase(t.from) + " → " : ""}${titleCase(t.to)}`,
              detail: t.note ?? undefined,
              at: t.at,
            }))}
          />
        </Card>
      </div>
    </div>
  );
}

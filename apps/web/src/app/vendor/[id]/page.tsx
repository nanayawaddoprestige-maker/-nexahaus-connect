"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

interface WorkOrderDetail {
  id: string;
  ref: string;
  status: string;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cost: { minor: string; currency: string } | null;
  completionNotes: string | null;
  request: {
    ref: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    location: string;
    address: string;
    photos: { documentId: string; kind: string }[];
  };
}

export default function VendorWorkOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [cedis, setCedis] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wo = useQuery({
    queryKey: ["vendor", "wo", params.id],
    queryFn: () => api.get<WorkOrderDetail>(`/vendor/work-orders/${params.id}`),
    retry: false,
  });

  const start = useMutation({
    mutationFn: () => api.post(`/vendor/work-orders/${params.id}/start`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["vendor"] }),
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Could not start the job."),
  });
  const complete = useMutation({
    mutationFn: () =>
      api.post(`/vendor/work-orders/${params.id}/complete`, {
        actualCost: {
          minor: String(Math.round(Number(cedis) * 100)),
          currency: "GHS",
        },
        completionNotes: notes.trim() || undefined,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["vendor"] }),
    onError: (e) =>
      setError(
        e instanceof ApiError ? e.message : "Could not complete the job.",
      ),
  });

  if (wo.isLoading) return <Skeleton className="h-96 w-full" />;
  if (wo.isError || !wo.data) {
    const notFound = wo.error instanceof ApiError && wo.error.status === 404;
    return (
      <ErrorState
        title={
          notFound
            ? "Work order not found"
            : "We couldn't load this work order."
        }
        onRetry={notFound ? undefined : () => void wo.refetch()}
      />
    );
  }
  const w = wo.data;

  return (
    <div>
      <button
        onClick={() => router.push("/vendor")}
        className="mb-4 text-sm text-ink-muted hover:text-navy-900"
      >
        ← All work orders
      </button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {w.request.title}
            <StatusBadge status={w.status} />
          </span>
        }
        subtitle={`${w.ref} · ${titleCase(w.request.category)} · ${titleCase(w.request.priority)} priority`}
      />

      <Card className="mb-6">
        <CardHeader title="Job details" />
        <p className="whitespace-pre-line text-sm text-ink">
          {w.request.description}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 border-t border-line pt-4 text-sm">
          <div>
            <dt className="nx-label">Location</dt>
            <dd className="mt-0.5 text-navy-900">{w.request.location}</dd>
          </div>
          <div>
            <dt className="nx-label">Address</dt>
            <dd className="mt-0.5 text-navy-900">{w.request.address}</dd>
          </div>
          <div>
            <dt className="nx-label">Scheduled</dt>
            <dd className="mt-0.5 text-navy-900">
              {formatDate(w.scheduledFor)}
            </dd>
          </div>
          <div>
            <dt className="nx-label">Started</dt>
            <dd className="mt-0.5 text-navy-900">{formatDate(w.startedAt)}</dd>
          </div>
        </dl>
        {w.request.photos.length > 0 ? (
          <p className="mt-3 text-xs text-ink-subtle">
            {w.request.photos.length} reported photo(s) available on request.
          </p>
        ) : null}
      </Card>

      {error ? <p className="mb-4 text-sm text-critical">{error}</p> : null}

      {["DRAFT", "ISSUED"].includes(w.status) ? (
        <Card>
          <p className="text-sm text-ink-muted">
            {w.request.status === "AWAITING_APPROVAL"
              ? "This job is waiting for the owner to approve the estimate. You'll be notified when you can start."
              : "When you're on site, mark the job as started."}
          </p>
          <Button
            className="mt-3"
            loading={start.isPending}
            disabled={w.request.status === "AWAITING_APPROVAL"}
            onClick={() => start.mutate()}
          >
            Start job
          </Button>
        </Card>
      ) : w.status === "IN_PROGRESS" ? (
        <Card>
          <CardHeader title="Complete the job" />
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy-900">
                Actual cost (GHS)
              </span>
              <input
                inputMode="decimal"
                value={cedis}
                onChange={(e) => setCedis(e.target.value)}
                className="h-10 w-40 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy-900">
                What did you do?
              </span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
              />
            </label>
            <Button
              loading={complete.isPending}
              disabled={!Number(cedis)}
              onClick={() => complete.mutate()}
            >
              Mark complete
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-navy-900">
            This job is {titleCase(w.status).toLowerCase()}.
          </p>
          {w.cost ? (
            <p className="mt-1 text-sm text-ink-muted">
              Billed: {formatMoney(w.cost)}
            </p>
          ) : null}
          {w.completionNotes ? (
            <p className="mt-1 text-sm text-ink-muted">{w.completionNotes}</p>
          ) : null}
        </Card>
      )}
    </div>
  );
}

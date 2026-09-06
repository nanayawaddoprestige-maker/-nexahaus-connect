"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { ApprovalRow } from "@/lib/ops-resources";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"PENDING" | "ALL">("PENDING");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["approvals", tab],
    queryFn: () =>
      api.list<ApprovalRow>("/approvals", {
        query: { status: tab === "PENDING" ? "PENDING" : undefined, pageSize: 50 },
      }),
  });

  const rows = data?.items ?? [];
  const pendingCount = rows.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle={
          tab === "PENDING" && pendingCount > 0
            ? `${pendingCount} decision${pendingCount === 1 ? "" : "s"} needed`
            : "Decisions NexaHaus needs from you before proceeding."
        }
        action={
          <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
            {(["PENDING", "ALL"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                  (tab === t ? "bg-navy-900 text-white" : "text-ink-muted hover:text-navy-900")
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
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === "PENDING" ? "Nothing needs your decision" : "No approvals yet"}
          description="When a cost exceeds your approval threshold, the request appears here with the details you need to decide."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((a) => (
            <ApprovalCard key={a.id} approval={a} onDecided={() => void qc.invalidateQueries({ queryKey: ["approvals"] })} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalCard({
  approval,
  onDecided,
}: {
  approval: ApprovalRow;
  onDecided: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const decide = useMutation({
    mutationFn: (decision: "APPROVED" | "DECLINED" | "INFO_REQUESTED") =>
      api.post(`/approvals/${approval.id}/decision`, { decision, note: note || undefined }),
    onSuccess: onDecided,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });

  const pending = approval.status === "PENDING" || approval.status === "INFO_REQUESTED";

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-subtle">{approval.ref}</span>
            <StatusBadge status={approval.status} />
          </div>
          <p className="mt-1 font-medium text-navy-900">
            {titleCase(approval.type)}
            {approval.property ? ` · ${approval.property.name}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-navy-900">
            {formatMoney(approval.amount)}
          </p>
          {approval.threshold ? (
            <p className="text-xs text-ink-subtle">
              threshold {formatMoney(approval.threshold)}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 border-t border-line pt-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="nx-label">Requested by</dt>
          <dd className="mt-0.5 text-navy-900">{approval.requestedBy?.fullName ?? "NexaHaus"}</dd>
        </div>
        <div>
          <dt className="nx-label">Raised</dt>
          <dd className="mt-0.5 text-navy-900">{formatDate(approval.createdAt)}</dd>
        </div>
        {approval.dueAt ? (
          <div>
            <dt className="nx-label">Needed by</dt>
            <dd className="mt-0.5 text-navy-900">{formatDate(approval.dueAt)}</dd>
          </div>
        ) : null}
      </dl>

      {pending ? (
        <div className="mt-4 border-t border-line pt-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional — required if requesting more information)"
            rows={2}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          />
          {error ? <p className="mt-2 text-sm text-critical">{error}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" loading={decide.isPending} onClick={() => decide.mutate("APPROVED")}>
              Approve
            </Button>
            <Button size="sm" variant="danger" loading={decide.isPending} onClick={() => decide.mutate("DECLINED")}>
              Decline
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={decide.isPending}
              onClick={() => {
                if (!note.trim()) {
                  setError("Please add a note when requesting more information.");
                  return;
                }
                decide.mutate("INFO_REQUESTED");
              }}
            >
              Request more information
            </Button>
          </div>
        </div>
      ) : approval.status !== "PENDING" ? (
        <p className="mt-3 border-t border-line pt-3 text-sm text-ink-subtle">
          {titleCase(approval.status)}
          {approval.dueAt ? ` · was due ${formatDate(approval.dueAt)}` : ""}
        </p>
      ) : null}
    </Card>
  );
}

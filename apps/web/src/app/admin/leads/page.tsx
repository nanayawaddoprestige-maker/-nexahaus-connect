"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LeadRow, PipelineStage } from "@/lib/crm-resources";
import { GRADE_TONE, LEAD_STAGES } from "@/lib/crm-resources";
import { relativeDays, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

export default function AdminLeadsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [grade, setGrade] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const pipeline = useQuery({
    queryKey: ["leads", "pipeline"],
    queryFn: () => api.list<PipelineStage>("/leads/pipeline"),
  });
  const leads = useQuery({
    queryKey: ["leads", { status, grade, q, page }],
    queryFn: () =>
      api.list<LeadRow>("/leads", {
        query: {
          status: status || undefined,
          grade: grade || undefined,
          q: q || undefined,
          page,
          pageSize: 20,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const byStatus = new Map(
    (pipeline.data?.items ?? []).map((s) => [s.status, s]),
  );
  const meta = leads.data?.meta;
  const rows = leads.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Pre-launch pipeline. Scores update automatically as leads engage."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {LEAD_STAGES.map((s) => {
          const st = byStatus.get(s);
          const active = status === s;
          return (
            <button
              key={s}
              onClick={() => {
                setStatus(active ? "" : s);
                setPage(1);
              }}
              className={
                "rounded-lg border p-2.5 text-left transition-colors " +
                (active
                  ? "border-navy-900 bg-navy-50"
                  : "border-line bg-surface hover:border-navy-200")
              }
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
                {titleCase(s)}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-navy-900">
                {st?.count ?? 0}
              </p>
              {st && st.count > 0 ? (
                <p className="text-[10px] text-ink-subtle">
                  avg {st.averageScore}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email or reference"
          className="h-9 w-64 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        />
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {["", "A", "B", "C", "D"].map((g) => (
            <button
              key={g || "all"}
              onClick={() => {
                setGrade(g);
                setPage(1);
              }}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium " +
                (grade === g
                  ? "bg-navy-900 text-white"
                  : "text-ink-muted hover:text-navy-900")
              }
            >
              {g ? `Grade ${g}` : "All grades"}
            </button>
          ))}
        </div>
      </div>

      {leads.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : leads.isError ? (
        <ErrorState onRetry={() => void leads.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No leads"
          description="Leads from the website, surveys and health checks appear here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Properties</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => router.push(`/admin/leads/${l.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-sunken"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-900">{l.name}</p>
                    <p className="text-xs text-ink-subtle">
                      {l.email} · {l.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {titleCase(l.source)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-navy-900">
                    {l.propertyCount ?? "—"}
                    {l.location ? (
                      <span className="ml-1 text-xs text-ink-subtle">
                        {l.location}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="tabular-nums text-navy-900">
                      {l.score}
                    </span>
                    <StatusBadge
                      status={`Grade ${l.grade}`}
                      tone={GRADE_TONE[l.grade]}
                      className="ml-2"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-subtle">
                    {relativeDays(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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

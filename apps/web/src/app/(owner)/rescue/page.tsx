"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { PropertyListItem } from "@/lib/resources";
import type { RescueAssessment } from "@/lib/intel-resources";
import { formatDate, titleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { isStaff } from "@/lib/nav";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

const SEVERITY_TONE: Record<
  string,
  "critical" | "warning" | "info" | "neutral"
> = {
  URGENT: "critical",
  HIGH: "critical",
  MEDIUM: "warning",
  LOW: "neutral",
};

export default function PropertyRescuePage() {
  const { user } = useAuth();
  const staff = isStaff(user);
  const qc = useQueryClient();
  const [propertyId, setPropertyId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const properties = useQuery({
    queryKey: ["properties", "for-rescue"],
    queryFn: () =>
      api.list<PropertyListItem>("/properties", { query: { pageSize: 50 } }),
  });

  const rescue = useQuery({
    queryKey: ["rescue", propertyId],
    queryFn: () =>
      api.get<{ propertyId: string; assessment: RescueAssessment | null }>(
        `/property-rescue/${propertyId}`,
      ),
    enabled: !!propertyId,
  });

  const run = useMutation({
    mutationFn: () => api.post("/property-rescue/assessments", { propertyId }),
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ["rescue", propertyId] });
    },
    onError: (e) =>
      setError(
        e instanceof ApiError ? e.message : "Could not run the assessment.",
      ),
  });

  const setRec = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/property-rescue/recommendations/${id}`, { status }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["rescue", propertyId] }),
  });

  const download = useMutation({
    mutationFn: (docId: string) =>
      api.get<{ url: string }>(`/documents/${docId}/download-url`),
    onSuccess: (res) => window.open(res.url, "_blank", "noopener"),
  });

  const a = rescue.data?.assessment ?? null;

  return (
    <div>
      <PageHeader
        title="Property Rescue"
        subtitle="A preliminary desk assessment that identifies what is holding a property back and what to do about it."
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-navy-900">
              Property
            </span>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-9 min-w-64 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
            >
              <option value="">Select a property…</option>
              {(properties.data?.items ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.ref})
                </option>
              ))}
            </select>
          </label>
          {staff && propertyId ? (
            <Button loading={run.isPending} onClick={() => run.mutate()}>
              {a ? "Re-run assessment" : "Run assessment"}
            </Button>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-critical">{error}</p> : null}
      </Card>

      {!propertyId ? (
        <EmptyState
          title="Choose a property"
          description="Select a property above to see its latest rescue assessment."
        />
      ) : rescue.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : rescue.isError ? (
        <ErrorState onRetry={() => void rescue.refetch()} />
      ) : !a ? (
        <EmptyState
          title="No assessment yet"
          description={
            staff
              ? "Run one with the button above."
              : "Ask your NexaHaus manager to run a Property Rescue assessment."
          }
        />
      ) : (
        <div className="space-y-6">
          <Card className="flex flex-wrap items-center gap-6">
            <ScoreRing
              score={a.overallScore}
              size={92}
              label={`v${a.ref}`.replace("vPR", "PR")}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-navy-900">
                  Overall score {a.overallScore}/100
                </h2>
                <StatusBadge
                  status={a.status}
                  tone={a.status === "FINAL" ? "positive" : "neutral"}
                />
              </div>
              <p className="text-sm text-ink-subtle">
                Assessed {formatDate(a.assessedAt)} · {a.ref}
              </p>
            </div>
            {a.pdfDocumentId ? (
              <Button
                variant="secondary"
                size="sm"
                loading={download.isPending}
                onClick={() => download.mutate(a.pdfDocumentId!)}
              >
                Download report (PDF)
              </Button>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Findings" />
            <ul className="space-y-2 text-sm">
              {a.findings.map((f) => (
                <li
                  key={f.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-navy-900">{f.problem}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-ink-subtle">
                      {Math.round(f.score * 100)}
                    </span>
                    <StatusBadge
                      status={f.severity}
                      tone={SEVERITY_TONE[f.severity]}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Recommended actions" />
            {a.recommendations.length === 0 ? (
              <p className="text-sm text-ink-subtle">
                No corrective actions needed — this property is performing well.
              </p>
            ) : (
              <ol className="space-y-4">
                {a.recommendations.map((r) => (
                  <li key={r.id} className="border-l-2 border-line pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-navy-900">
                        {r.order + 1}. {r.title}
                      </span>
                      <StatusBadge
                        status={r.priority}
                        tone={SEVERITY_TONE[r.priority]}
                      />
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{r.detail}</p>
                    <div className="mt-2 flex gap-1">
                      {(
                        ["OPEN", "IN_PROGRESS", "DONE", "DISMISSED"] as const
                      ).map((s) => (
                        <button
                          key={s}
                          onClick={() => setRec.mutate({ id: r.id, status: s })}
                          className={
                            "rounded-md px-2 py-0.5 text-[11px] font-medium " +
                            (r.status === s
                              ? "bg-navy-900 text-white"
                              : "border border-line text-ink-muted hover:text-navy-900")
                          }
                        >
                          {titleCase(s)}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <p className="text-xs text-ink-subtle">
            This is a preliminary desk assessment from the data held in NexaHaus
            Connect — not a professional valuation or structural survey. Where
            an action needs professional input, that is noted in the action
            itself.
          </p>
        </div>
      )}
    </div>
  );
}

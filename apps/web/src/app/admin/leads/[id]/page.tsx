"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { LeadDetail } from "@/lib/crm-resources";
import { GRADE_TONE, LEAD_STAGES } from "@/lib/crm-resources";
import { titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Timeline } from "@/components/ui/timeline";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("NOTE");
  const [error, setError] = useState<string | null>(null);

  const lead = useQuery({
    queryKey: ["lead", params.id],
    queryFn: () => api.get<LeadDetail>(`/leads/${params.id}`),
    retry: false,
  });

  const addActivity = useMutation({
    mutationFn: () => api.post(`/leads/${params.id}/activities`, { type: noteType, body: note.trim() }),
    onSuccess: () => {
      setNote("");
      void qc.invalidateQueries({ queryKey: ["lead", params.id] });
    },
  });
  const move = useMutation({
    mutationFn: (status: string) => api.patch(`/leads/${params.id}`, { status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["lead", params.id] }),
  });
  const convert = useMutation({
    mutationFn: () => api.post<{ clientId: string }>(`/leads/${params.id}/convert`, {}),
    onSuccess: (res) => router.push(`/admin/clients/${res.clientId}`),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not convert this lead."),
  });

  if (lead.isLoading) return <Skeleton className="h-96 w-full" />;
  if (lead.isError || !lead.data) {
    const notFound = lead.error instanceof ApiError && lead.error.status === 404;
    return (
      <ErrorState
        title={notFound ? "Lead not found" : "We couldn't load this lead."}
        onRetry={notFound ? undefined : () => void lead.refetch()}
      />
    );
  }
  const l = lead.data;

  return (
    <div>
      <button onClick={() => router.push("/admin/leads")} className="mb-4 text-sm text-ink-muted hover:text-navy-900">
        ← All leads
      </button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {l.name}
            <StatusBadge status={l.status} />
            <StatusBadge status={`Grade ${l.grade}`} tone={GRADE_TONE[l.grade]} />
          </span>
        }
        subtitle={`${l.ref} · ${l.email} · ${l.phone} · via ${titleCase(l.source)}`}
        action={
          l.convertedClientId ? (
            <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/clients/${l.convertedClientId}`)}>
              View client
            </Button>
          ) : (
            <Button size="sm" loading={convert.isPending} onClick={() => convert.mutate()}>
              Convert to client
            </Button>
          )
        }
      />
      {error ? <p className="mb-4 text-sm text-critical">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Details" />
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Row label="Property count" value={l.propertyCount ?? "—"} />
            <Row label="Property type" value={l.propertyType ?? "—"} />
            <Row label="Location" value={l.location ?? "—"} />
            <Row label="Lives in Ghana" value={l.livesInGhana == null ? "—" : l.livesInGhana ? "Yes" : "No"} />
            <Row label="Segment" value={l.segment ? titleCase(l.segment) : "—"} />
            <Row label="Campaign" value={l.campaign ?? "—"} />
          </dl>
          {l.biggestChallenge ? (
            <div className="mt-4 border-t border-line pt-3">
              <p className="nx-label">Biggest challenge</p>
              <p className="mt-1 text-sm text-ink">{l.biggestChallenge}</p>
            </div>
          ) : null}
          {l.serviceInterest.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {l.serviceInterest.map((s) => (
                <span key={s} className="rounded-md border border-line bg-surface-sunken px-2 py-0.5 text-xs text-ink-muted">
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 border-t border-line pt-4">
            <p className="nx-label mb-2">Move stage</p>
            <div className="flex flex-wrap gap-1">
              {LEAD_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => move.mutate(s)}
                  disabled={l.status === s || !!l.convertedClientId}
                  className={
                    "rounded-md px-2 py-1 text-xs font-medium " +
                    (l.status === s ? "bg-navy-900 text-white" : "border border-line text-ink-muted hover:text-navy-900 disabled:opacity-40")
                  }
                >
                  {titleCase(s)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <ScoreRing score={l.score} size={72} />
            <div>
              <p className="text-sm font-semibold text-navy-900">Lead score</p>
              <p className="text-xs text-ink-subtle">Grade {l.grade}</p>
            </div>
          </div>
          {l.scoreBreakdown?.length ? (
            <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-ink-muted">
              {l.scoreBreakdown.map((b) => (
                <li key={b.factor} className="flex justify-between">
                  <span>{titleCase(b.factor)}</span>
                  <span className="tabular-nums">+{b.points}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {l.healthChecks.length > 0 ? (
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-subtle">
              Health check completed · preliminary {l.healthChecks[0].preliminaryScore}/100
            </p>
          ) : null}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Activity" />
        <div className="mb-4 flex gap-2">
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
            className="h-9 rounded-lg border border-line bg-surface px-2 text-sm"
          >
            {["NOTE", "CALL", "EMAIL", "MEETING", "TASK"].map((t) => (
              <option key={t} value={t}>{titleCase(t)}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Log a call, note or next step…"
            className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          />
          <Button size="sm" loading={addActivity.isPending} disabled={!note.trim()} onClick={() => addActivity.mutate()}>
            Log
          </Button>
        </div>
        {l.activities.length === 0 ? (
          <p className="text-sm text-ink-subtle">No activity logged yet.</p>
        ) : (
          <Timeline
            entries={l.activities.map((a) => ({
              title: `${titleCase(a.type)} — ${a.by}`,
              detail: a.body,
              at: a.occurredAt,
            }))}
          />
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="nx-label">{label}</dt>
      <dd className="mt-0.5 text-navy-900">{value}</dd>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { LeadScoreConfig, LeadScoreFactor } from "@/lib/admin-resources";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

const FACTOR_FIELDS: {
  key: keyof NonNullable<LeadScoreConfig["factors"]>;
  label: string;
}[] = [
  { key: "propertyCount", label: "Owns multiple properties" },
  { key: "diaspora", label: "Diaspora / lives abroad" },
  { key: "managementNeed", label: "Stated a management need" },
  { key: "assessmentCompleted", label: "Completed a property assessment" },
  { key: "consultationBooked", label: "Booked a consultation" },
  { key: "engagement", label: "General engagement (touchpoints)" },
  { key: "portfolioValue", label: "Portfolio value above threshold" },
  { key: "serviceInterest", label: "Expressed a service interest" },
];

const GRADE_FIELDS: { key: "A" | "B" | "C" | "D"; label: string }[] = [
  { key: "A", label: "Grade A (hottest) — score at or above" },
  { key: "B", label: "Grade B — score at or above" },
  { key: "C", label: "Grade C — score at or above" },
  { key: "D", label: "Grade D — everything else" },
];

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "settings", "lead-score-config"],
    queryFn: () => api.get<LeadScoreConfig>("/leads/score-config"),
  });

  const [weights, setWeights] = useState<
    Partial<Record<string, number | undefined>>
  >({});
  const [grades, setGrades] = useState<{
    A: number;
    B: number;
    C: number;
    D: number;
  }>({ A: 75, B: 55, C: 35, D: 0 });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data?.factors) return;
    const nextWeights: Record<string, number> = {};
    for (const { key } of FACTOR_FIELDS) {
      const factor = data.factors[key] as LeadScoreFactor | undefined;
      if (factor) nextWeights[key] = factor.weight;
    }
    setWeights(nextWeights);
    setGrades(data.factors.grades);
  }, [data]);

  const save = useMutation({
    mutationFn: () => {
      const factors: Record<string, unknown> = { ...(data?.factors ?? {}) };
      for (const { key } of FACTOR_FIELDS) {
        const weight = weights[key];
        if (weight == null || Number.isNaN(weight)) {
          delete factors[key];
          continue;
        }
        const existing = (factors[key] as LeadScoreFactor | undefined) ?? {};
        factors[key] = { ...existing, weight };
      }
      factors.grades = grades;
      return api.put("/leads/score-config", { factors });
    },
    onSuccess: () => {
      setSaved(true);
      setError(null);
      void qc.invalidateQueries({
        queryKey: ["admin", "settings", "lead-score-config"],
      });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configuration that shapes how NexaHaus operates — changes are audited."
      />

      <Card>
        <CardHeader
          title="Lead scoring"
          description="How much each signal contributes to a lead's score (0–100), and the grade thresholds it maps to. Every save is versioned and recorded in the audit log."
        />

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FACTOR_FIELDS.map(({ key, label }) => (
                <label key={key} className="text-sm">
                  <span className="mb-1 block text-ink-muted">{label}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={weights[key] ?? ""}
                    onChange={(e) =>
                      setWeights((w) => ({
                        ...w,
                        [key]:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      }))
                    }
                    placeholder="off"
                    className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 border-t border-line pt-4">
              <p className="nx-label mb-3">Grade thresholds</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                {GRADE_FIELDS.map(({ key, label }) => (
                  <label key={key} className="text-sm">
                    <span className="mb-1 block text-ink-muted">{label}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={grades[key]}
                      disabled={key === "D"}
                      onChange={(e) =>
                        setGrades((g) => ({
                          ...g,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 disabled:bg-surface-sunken disabled:text-ink-subtle"
                    />
                  </label>
                ))}
              </div>
            </div>

            {error ? (
              <p className="mt-4 text-sm text-critical">{error}</p>
            ) : null}
            {saved ? (
              <p className="mt-4 text-sm text-positive">
                Saved as version {(data?.version ?? 0) + 1}.
              </p>
            ) : null}

            <div className="mt-6">
              <Button loading={save.isPending} onClick={() => save.mutate()}>
                Save changes
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

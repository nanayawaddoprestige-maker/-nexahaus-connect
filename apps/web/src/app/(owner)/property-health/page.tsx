"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PropertyListItem } from "@/lib/resources";
import type { HealthLatest } from "@/lib/intel-resources";
import { HEALTH_COMPONENT_LABELS } from "@/lib/intel-resources";
import { relativeDays, titleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { isStaff } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreRing, Bar } from "@/components/ui/score-ring";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

export default function PropertyHealthPage() {
  const { user } = useAuth();
  const staff = isStaff(user);
  const [openId, setOpenId] = useState<string | null>(null);

  const properties = useQuery({
    queryKey: ["properties", "for-health"],
    queryFn: () =>
      api.list<PropertyListItem>("/properties", { query: { pageSize: 50 } }),
  });

  return (
    <div>
      <PageHeader
        title="Property Health"
        subtitle="A transparent 0–100 score per property, from occupancy, collection, maintenance, condition, documentation and finance."
      />

      {properties.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : properties.isError ? (
        <ErrorState onRetry={() => void properties.refetch()} />
      ) : (properties.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="No properties"
          description="Health scores appear here once properties are onboarded."
        />
      ) : (
        <div className="space-y-3">
          {properties.data!.items.map((p) => (
            <HealthRow
              key={p.id}
              propertyId={p.id}
              name={p.name}
              staff={staff}
              open={openId === p.id}
              onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HealthRow({
  propertyId,
  name,
  staff,
  open,
  onToggle,
}: {
  propertyId: string;
  name: string;
  staff: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const qc = useQueryClient();
  const health = useQuery({
    queryKey: ["health", propertyId],
    queryFn: () => api.get<HealthLatest>(`/property-health/${propertyId}`),
  });

  const recompute = useMutation({
    mutationFn: () => api.post(`/property-health/${propertyId}/recompute`),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["health", propertyId] }),
  });

  const h = health.data;

  return (
    <Card className="p-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <ScoreRing score={h?.score ?? null} size={56} />
        <div className="flex-1">
          <p className="font-medium text-navy-900">{name}</p>
          <p className="text-xs text-ink-subtle">
            {h?.scoredAt
              ? `scored ${relativeDays(h.scoredAt)}`
              : "not yet scored"}
            {h?.methodologyVersion
              ? ` · methodology v${h.methodologyVersion}`
              : ""}
          </p>
        </div>
        <span className="text-ink-subtle">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="border-t border-line p-4">
          {health.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !h || h.components.length === 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-subtle">
                This property has not been scored yet.
              </p>
              {staff ? (
                <Button
                  size="sm"
                  loading={recompute.isPending}
                  onClick={() => recompute.mutate()}
                >
                  Score now
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {h.components.map((c) => (
                  <div key={c.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-navy-900">
                        {HEALTH_COMPONENT_LABELS[c.key] ?? titleCase(c.key)}
                      </span>
                      <span className="tabular-nums text-ink-muted">
                        {Math.round(c.value * 100)}
                      </span>
                    </div>
                    <Bar value={c.value} />
                    <p className="mt-1 text-[11px] text-ink-subtle">
                      {c.basis}
                      {c.confidence !== "actual" ? ` · ${c.confidence}` : ""}
                    </p>
                  </div>
                ))}
              </div>

              {h.recommendations.length > 0 ? (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="nx-label mb-1.5">Recommended actions</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
                    {h.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {staff ? (
                <Button
                  className="mt-4"
                  size="sm"
                  variant="secondary"
                  loading={recompute.isPending}
                  onClick={() => recompute.mutate()}
                >
                  Recompute
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
}

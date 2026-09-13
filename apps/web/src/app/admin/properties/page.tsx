"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PropertyListItem } from "@/lib/resources";
import { formatMinor, formatPercent, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "properties", { q, page }],
    queryFn: () =>
      api.list<PropertyListItem>("/properties", {
        query: { q: q || undefined, page, pageSize: 20 },
      }),
    placeholderData: keepPreviousData,
  });

  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle={
          meta?.totalItems != null
            ? `${meta.totalItems} across the portfolio`
            : undefined
        }
      />

      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="Search name, reference or address"
        className="mb-4 h-9 w-72 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
      />

      {isLoading ? (
        <Card>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-10 w-full" />
          ))}
        </Card>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No properties found"
          description="Properties you are assigned to will appear here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Occupancy</th>
                <th className="px-4 py-3 font-medium">Collected (mo.)</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/properties/${p.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-sunken"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-900">{p.name}</p>
                    <p className="text-xs text-ink-subtle">
                      {p.ref} · {p.city}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {titleCase(p.type)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-navy-900">
                    {formatPercent(p.occupancy.rate)}
                    <span className="ml-1 text-xs text-ink-subtle">
                      ({p.occupancy.occupied}/{p.occupancy.total})
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-navy-900">
                    {formatMinor(
                      p.finance.collectedRentMinor,
                      p.finance.currency,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
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

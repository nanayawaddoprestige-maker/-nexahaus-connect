"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TenantRow } from "@/lib/admin-resources";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

export default function AdminTenantsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "tenants", { q, page }],
    queryFn: () =>
      api.list<TenantRow>("/tenants", {
        query: { q: q || undefined, page, pageSize: 20 },
      }),
    placeholderData: keepPreviousData,
  });
  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Tenants"
        subtitle={
          meta?.totalItems != null ? `${meta.totalItems} on record` : undefined
        }
      />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="Search name, reference or phone"
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
          title="No tenants found"
          description="Tenants appear here once they are on a lease you manage."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Current tenancy</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-line last:border-0 hover:bg-surface-sunken"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">
                      {t.fullName}
                    </div>
                    <div className="font-mono text-[11px] text-ink-subtle">
                      {t.ref}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {t.currentTenancy
                      ? `${t.currentTenancy.property} · ${t.currentTenancy.unit}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.phone}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={t.status}
                      tone={t.status === "ACTIVE" ? "positive" : "neutral"}
                    />
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

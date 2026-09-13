"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuditLogRow } from "@/lib/admin-resources";
import { titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function AdminAuditLogsPage() {
  const [resourceType, setResourceType] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "audit-logs", { resourceType, action, from, to, page }],
    queryFn: () =>
      api.list<AuditLogRow>("/admin/audit-logs", {
        query: {
          resourceType: resourceType || undefined,
          action: action || undefined,
          from: from || undefined,
          to: to ? `${to}T23:59:59.999Z` : undefined,
          page,
          pageSize: 25,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const meta = data?.meta;
  const rows = data?.items ?? [];

  function applyFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Every state-changing action, immutable and append-only."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={resourceType}
          onChange={(e) => applyFilter(setResourceType, e.target.value)}
          placeholder="Resource type (e.g. maintenance)"
          className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        />
        <input
          value={action}
          onChange={(e) => applyFilter(setAction, e.target.value)}
          placeholder="Action contains…"
          className="h-9 w-48 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => applyFilter(setFrom, e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => applyFilter(setTo, e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        />
      </div>

      {isLoading ? (
        <Card>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-9 w-full" />
          ))}
        </Card>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No matching entries"
          description="Every approval, payment, role change and login is recorded here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {formatTimestamp(r.at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-navy-900">
                      {r.actor?.fullName ?? "System"}
                    </p>
                    {r.actorRoleKey ? (
                      <p className="text-xs text-ink-subtle">
                        {titleCase(r.actorRoleKey)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-900">
                    {r.action}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {r.resourceType}
                    {r.resourceId ? (
                      <span className="ml-1 font-mono text-xs text-ink-subtle">
                        {r.resourceId.slice(0, 8)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-subtle">
                    {r.ip ?? "—"}
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
            Page {meta.page} of {meta.totalPages} · {meta.totalItems} entries
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

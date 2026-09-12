"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LeaseRow } from "@/lib/admin-resources";
import { formatDate, formatMinor, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

const FILTERS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRING", label: "Expiring" },
  { value: "DRAFT", label: "Draft" },
  { value: "EXPIRED", label: "Expired" },
  { value: "TERMINATED", label: "Terminated" },
] as const;

export default function AdminLeasesPage() {
  const [status, setStatus] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "leases", { status, expiringOnly, page }],
    queryFn: () =>
      api.list<LeaseRow>("/leases", {
        query: {
          status: status || undefined,
          expiringWithinDays: expiringOnly ? 90 : undefined,
          page,
          pageSize: 20,
        },
      }),
    placeholderData: keepPreviousData,
  });
  const meta = data?.meta;
  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Leases"
        subtitle={
          meta?.totalItems != null ? `${meta.totalItems} on record` : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                (status === f.value
                  ? "bg-navy-900 text-white"
                  : "text-ink-muted hover:text-navy-900")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={expiringOnly}
            onChange={(e) => {
              setExpiringOnly(e.target.checked);
              setPage(1);
            }}
          />
          Expiring within 90 days
        </label>
      </div>

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
          title="No leases found"
          description="Leases you manage will appear here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">Lease</th>
                <th className="px-4 py-3 font-medium">Property / unit</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">Ends</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-line last:border-0 hover:bg-surface-sunken"
                >
                  <td className="px-4 py-3 font-mono text-[12px] text-navy-900">
                    {l.ref}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {l.property.name}
                    <span className="text-ink-subtle"> · {l.unit.label}</span>
                  </td>
                  <td className="px-4 py-3 text-navy-900">
                    {l.primaryTenant?.fullName ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-navy-900">
                    {formatMinor(l.rent.minor, l.rent.currency)}
                    <span className="text-ink-subtle">
                      {" "}
                      / {titleCase(l.frequency).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(l.endDate)}
                    {l.status === "ACTIVE" && l.daysToExpiry <= 90 ? (
                      <span className="ml-2 text-xs text-warning">
                        {l.daysToExpiry}d
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
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

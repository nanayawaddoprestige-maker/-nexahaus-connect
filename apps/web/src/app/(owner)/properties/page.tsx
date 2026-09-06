"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PropertyListItem } from "@/lib/resources";
import type { ListMeta } from "@nexahaus/types";
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

const STATUS_FILTERS = [
  "",
  "OCCUPIED",
  "VACANT",
  "UNDER_MAINTENANCE",
  "UNDER_RENOVATION",
] as const;

export default function PropertiesPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["properties", { status, q, page }],
    queryFn: () =>
      api.list<PropertyListItem>("/properties", {
        query: { status: status || undefined, q: q || undefined, page, pageSize: 12 },
      }),
    placeholderData: keepPreviousData,
  });

  const meta = data?.meta as ListMeta | undefined;
  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="My Properties"
        subtitle={
          meta?.totalItems != null
            ? `${meta.totalItems} propert${meta.totalItems === 1 ? "y" : "ies"} under management`
            : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, reference or address"
          className="h-9 w-64 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        />
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || "all"}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                (status === s
                  ? "bg-navy-900 text-white"
                  : "text-ink-muted hover:text-navy-900")
              }
            >
              {s ? titleCase(s) : "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-3 w-24" />
              <Skeleton className="mt-6 h-8 w-full" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No properties to show"
          description="Your assigned properties will appear here once onboarding is complete."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((p) => (
              <Link key={p.id} href={`/properties/${p.id}`} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-raised">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-navy-900">{p.name}</p>
                      <p className="text-xs text-ink-subtle">
                        {p.ref} · {titleCase(p.type)} · {p.city}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
                    <div>
                      <dt className="nx-label">Occupancy</dt>
                      <dd className="mt-1 font-semibold text-navy-900">
                        {formatPercent(p.occupancy.rate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="nx-label">Collected</dt>
                      <dd className="mt-1 font-semibold text-navy-900">
                        {formatMinor(p.finance.collectedRentMinor, p.finance.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="nx-label">Outstanding</dt>
                      <dd
                        className={
                          "mt-1 font-semibold " +
                          (p.finance.outstandingRentMinor === "0"
                            ? "text-navy-900"
                            : "text-warning")
                        }
                      >
                        {formatMinor(p.finance.outstandingRentMinor, p.finance.currency)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </Link>
            ))}
          </div>

          {meta && (meta.totalPages ?? 1) > 1 ? (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-ink-subtle">
                Page {meta.page} of {meta.totalPages}
                {isFetching ? " · updating…" : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={(meta.page ?? 1) <= 1}
                  onClick={() => setPage((n) => Math.max(1, n - 1))}
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
        </>
      )}
    </div>
  );
}

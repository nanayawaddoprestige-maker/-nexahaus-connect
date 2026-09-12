"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TenantMe, TenantRent } from "@/lib/tenant-resources";
import type { MaintenanceRow } from "@/lib/ops-resources";
import {
  formatDate,
  formatMinor,
  formatMoney,
  relativeDays,
} from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, LoadingCards, PageHeader } from "@/components/ui/states";

export default function TenantHome() {
  const { user } = useAuth();
  const me = useQuery({
    queryKey: ["tenant", "me"],
    queryFn: () => api.get<TenantMe>("/tenant/me"),
  });
  const rent = useQuery({
    queryKey: ["tenant", "rent"],
    queryFn: () => api.get<TenantRent>("/tenant/rent"),
  });
  const maintenance = useQuery({
    queryKey: ["tenant", "maintenance"],
    queryFn: () =>
      api.list<MaintenanceRow>("/maintenance", {
        query: { openOnly: "true", pageSize: 5 },
      }),
  });

  const first = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Hello, ${first}`}
        subtitle="Everything about your tenancy, in one place."
      />

      {me.isLoading ? (
        <LoadingCards count={3} />
      ) : me.isError || !me.data ? (
        <ErrorState onRetry={() => void me.refetch()} />
      ) : !me.data.currentTenancy ? (
        <Card>
          <p className="text-sm text-ink-muted">
            You don&rsquo;t have an active tenancy on file. If that&rsquo;s
            wrong, contact your NexaHaus property manager.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader title="Your home" />
            <p className="text-lg font-semibold text-navy-900">
              {me.data.currentTenancy.propertyName}
            </p>
            <p className="text-sm text-ink-muted">
              {me.data.currentTenancy.unit} · {me.data.currentTenancy.address}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="nx-label">Rent</dt>
                <dd className="mt-0.5 text-navy-900">
                  {formatMoney(me.data.currentTenancy.rent)} /{" "}
                  {me.data.currentTenancy.frequency.toLowerCase()}
                </dd>
              </div>
              <div>
                <dt className="nx-label">Lease</dt>
                <dd className="mt-0.5 text-navy-900">
                  {formatDate(me.data.currentTenancy.startDate)} –{" "}
                  {formatDate(me.data.currentTenancy.endDate)}
                </dd>
              </div>
              <div>
                <dt className="nx-label">Status</dt>
                <dd className="mt-0.5">
                  <StatusBadge status={me.data.currentTenancy.status} />
                </dd>
              </div>
            </dl>
            <Link
              href="/tenant/lease"
              className="mt-4 inline-block text-sm font-medium text-navy-700 hover:underline"
            >
              View full lease →
            </Link>
          </Card>

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Rent outstanding"
              value={
                rent.data
                  ? formatMinor(
                      rent.data.summary.outstandingMinor,
                      rent.data.currency,
                    )
                  : "…"
              }
              tone={
                rent.data && rent.data.summary.outstandingMinor !== "0"
                  ? "warning"
                  : "positive"
              }
            />
            <StatCard
              label="Paid to date"
              value={
                rent.data
                  ? formatMinor(rent.data.summary.paidMinor, rent.data.currency)
                  : "…"
              }
              tone="positive"
            />
            <StatCard
              label="Open maintenance"
              value={maintenance.data?.items.length ?? 0}
            />
          </section>

          <Card>
            <CardHeader
              title="Open maintenance"
              action={
                <Link
                  href="/tenant/maintenance"
                  className="text-sm font-medium text-navy-700 hover:underline"
                >
                  Report an issue
                </Link>
              }
            />
            {(maintenance.data?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-subtle">Nothing open right now.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {maintenance.data!.items.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="font-medium text-navy-900">{m.title}</p>
                      <p className="text-xs text-ink-subtle">
                        reported {relativeDays(m.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

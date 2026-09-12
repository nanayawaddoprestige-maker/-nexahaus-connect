"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { PropertyDetail, UnitRow } from "@/lib/resources";
import {
  formatDate,
  formatMinor,
  formatMoney,
  formatPercent,
  relativeDays,
  titleCase,
} from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["property", params.id],
    queryFn: () => api.get<PropertyDetail>(`/properties/${params.id}`),
    retry: false,
  });

  const units = useQuery({
    queryKey: ["property", params.id, "units"],
    queryFn: () => api.list<UnitRow>(`/properties/${params.id}/units`),
    enabled: !!data,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        title={
          notFound ? "Property not found" : "We couldn't load this property."
        }
        description={
          notFound
            ? "It may have been archived, or you may not have access to it."
            : "Please try again."
        }
        onRetry={notFound ? undefined : () => void refetch()}
      />
    );
  }

  const fee =
    data.agreement == null
      ? "—"
      : data.agreement.feeType === "FIXED_MONTHLY"
        ? `${formatMoney(data.agreement.feeFixed)} / month`
        : `${data.agreement.feePercent ?? 0}% of ${
            data.agreement.feeType === "PERCENT_OF_EXPECTED"
              ? "expected"
              : "collected"
          } rent`;

  return (
    <div>
      <button
        onClick={() => router.push("/properties")}
        className="mb-4 text-sm text-ink-muted hover:text-navy-900"
      >
        ← All properties
      </button>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {data.name}
            <StatusBadge status={data.status} />
          </span>
        }
        subtitle={`${data.ref} · ${titleCase(data.type)} · ${data.address.line}, ${data.address.city}`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/properties/${data.id}/maintenance`)}
          >
            View maintenance
          </Button>
        }
      />

      {/* Diaspora "what is happening" strip */}
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="nx-label">Last inspected</p>
          <p className="mt-1 font-medium text-navy-900">
            {formatDate(data.diaspora.lastInspectedAt)}
          </p>
          <p className="text-xs text-ink-subtle">
            {relativeDays(data.diaspora.lastInspectedAt)}
          </p>
        </div>
        <div>
          <p className="nx-label">Last rent received</p>
          <p className="mt-1 font-medium text-navy-900">
            {formatDate(data.diaspora.lastRentReceivedAt)}
          </p>
          <p className="text-xs text-ink-subtle">
            {relativeDays(data.diaspora.lastRentReceivedAt)}
          </p>
        </div>
        <div>
          <p className="nx-label">Property health</p>
          <p className="mt-1 font-medium text-navy-900">
            {data.healthScore
              ? `${data.healthScore.score}/100`
              : "Not yet scored"}
          </p>
          <p className="text-xs text-ink-subtle">
            {data.healthScore
              ? `scored ${relativeDays(data.healthScore.scoredAt)}`
              : "—"}
          </p>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={formatPercent(data.occupancy.rate)}
          hint={`${data.occupancy.occupied}/${data.occupancy.total} units`}
        />
        <StatCard
          label="Expected rent (mo.)"
          value={formatMinor(
            data.finance.expectedRentMinor,
            data.finance.currency,
          )}
        />
        <StatCard
          label="Collected (mo.)"
          value={formatMinor(
            data.finance.collectedRentMinor,
            data.finance.currency,
          )}
          tone="positive"
        />
        <StatCard
          label="Outstanding"
          value={formatMinor(
            data.finance.outstandingRentMinor,
            data.finance.currency,
          )}
          tone={
            data.finance.outstandingRentMinor === "0" ? "default" : "warning"
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Management" />
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Row
              label="Managing client"
              value={`${data.client.displayName} (${data.client.ref})`}
            />
            <Row label="Management fee" value={fee} />
            <Row
              label="Maintenance approval threshold"
              value={
                data.agreement
                  ? formatMoney(data.agreement.maintenanceApprovalThreshold)
                  : "—"
              }
            />
            <Row
              label="Inspection frequency"
              value={
                data.agreement
                  ? titleCase(data.agreement.inspectionFrequency)
                  : "—"
              }
            />
            <Row
              label="Estimated value"
              value={
                data.estimatedValue ? formatMoney(data.estimatedValue) : "—"
              }
            />
            <Row
              label="Agreement"
              value={
                data.agreement
                  ? `${titleCase(data.agreement.status)} — from ${formatDate(data.agreement.startDate)}`
                  : "None on file"
              }
            />
          </dl>

          <div className="mt-5 border-t border-line pt-4">
            <p className="nx-label mb-2">NexaHaus team</p>
            {data.team.length === 0 ? (
              <p className="text-sm text-ink-subtle">No one assigned yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.team.map((t) => (
                  <li
                    key={`${t.role}-${t.user.id}`}
                    className="flex justify-between"
                  >
                    <span className="text-navy-900">{t.user.fullName}</span>
                    <span className="text-ink-subtle">{titleCase(t.role)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Latest inspection" />
          {data.latestInspection ? (
            <div className="text-sm">
              <p className="font-medium text-navy-900">
                {titleCase(data.latestInspection.type)} inspection
              </p>
              <p className="text-ink-subtle">{data.latestInspection.ref}</p>
              <dl className="mt-3 space-y-2">
                <Row
                  label="Completed"
                  value={formatDate(data.latestInspection.completedAt)}
                />
                <Row
                  label="Overall condition"
                  value={
                    data.latestInspection.overallCondition
                      ? titleCase(data.latestInspection.overallCondition)
                      : "—"
                  }
                />
              </dl>
            </div>
          ) : (
            <p className="text-sm text-ink-subtle">
              No completed inspection yet. The first inspection is part of
              property onboarding.
            </p>
          )}

          <div className="mt-5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Open maintenance</span>
              <span className="font-medium text-navy-900">
                {data.counts.openMaintenance}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink-muted">Units</span>
              <span className="font-medium text-navy-900">
                {data.counts.units}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Units & tenancies"
          description={`${data.counts.units} unit${data.counts.units === 1 ? "" : "s"}`}
        />
        {units.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : units.data && units.data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
                  <th className="py-2 pr-4 font-medium">Unit</th>
                  <th className="py-2 pr-4 font-medium">Beds / baths</th>
                  <th className="py-2 pr-4 font-medium">Tenant</th>
                  <th className="py-2 pr-4 font-medium">Rent</th>
                  <th className="py-2 pr-4 font-medium">Lease ends</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {units.data.items.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-navy-900">
                      {u.label}
                      <span className="ml-2 font-mono text-[10.5px] text-ink-subtle">
                        {u.ref}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-muted">
                      {u.bedrooms ?? "—"} / {u.bathrooms ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-navy-900">
                      {u.activeLease?.tenant?.fullName ?? (
                        <span className="text-ink-subtle">Vacant</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-navy-900">
                      {u.activeLease
                        ? formatMoney(u.activeLease.rent)
                        : u.marketRent
                          ? formatMoney(u.marketRent)
                          : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-muted">
                      {u.activeLease ? formatDate(u.activeLease.endDate) : "—"}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={u.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-subtle">
            No units recorded for this property yet.
          </p>
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

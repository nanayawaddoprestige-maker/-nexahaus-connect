"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TenantLease } from "@/lib/tenant-resources";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

export default function TenantLeasePage() {
  const lease = useQuery({
    queryKey: ["tenant", "lease"],
    queryFn: () => api.get<TenantLease>("/tenant/lease"),
  });

  const download = useMutation({
    mutationFn: (docId: string) =>
      api.get<{ url: string }>(`/documents/${docId}/download-url`),
    onSuccess: (res) => window.open(res.url, "_blank", "noopener"),
  });

  if (lease.isLoading) return <Skeleton className="h-64 w-full" />;
  if (lease.isError) return <ErrorState onRetry={() => void lease.refetch()} />;
  if (!lease.data)
    return (
      <EmptyState
        title="No active lease"
        description="Contact your NexaHaus property manager."
      />
    );

  const l = lease.data;

  return (
    <div>
      <PageHeader
        title="My Lease"
        subtitle={`${l.ref} · ${l.property.name}`}
        action={
          l.documentId ? (
            <Button
              size="sm"
              variant="secondary"
              loading={download.isPending}
              onClick={() => download.mutate(l.documentId!)}
            >
              Download lease (PDF)
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader title="Terms" action={<StatusBadge status={l.status} />} />
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <Row label="Property" value={l.property.name} />
          <Row label="Address" value={l.property.address} />
          <Row
            label="Unit"
            value={`${l.unit.label}${l.unit.bedrooms ? ` · ${l.unit.bedrooms} bed` : ""}${l.unit.bathrooms ? ` · ${l.unit.bathrooms} bath` : ""}`}
          />
          <Row
            label="Term"
            value={`${formatDate(l.startDate)} – ${formatDate(l.endDate)}`}
          />
          <Row
            label="Rent"
            value={`${formatMoney(l.rent)} / ${l.frequency.toLowerCase()}`}
          />
          <Row
            label="Deposit"
            value={l.deposit ? formatMoney(l.deposit) : "—"}
          />
          <Row label="Notice period" value={`${l.noticePeriodDays} days`} />
          <Row label="Renewal" value={titleCase(l.renewalStatus)} />
        </dl>

        {l.coTenants.length > 1 ? (
          <div className="mt-5 border-t border-line pt-4">
            <p className="nx-label mb-2">On this lease</p>
            <ul className="space-y-1 text-sm">
              {l.coTenants.map((t) => (
                <li key={t.name} className="flex justify-between">
                  <span className="text-navy-900">{t.name}</span>
                  {t.isPrimary ? (
                    <span className="text-xs text-ink-subtle">Primary</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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

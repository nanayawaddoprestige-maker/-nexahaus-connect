"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  ClientDetail,
  ClientPortfolioSummary,
} from "@/lib/admin-resources";
import { formatMinor, formatDate, titleCase } from "@/lib/format";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar, StepList } from "@/components/ui/progress";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const client = useQuery({
    queryKey: ["admin", "client", params.id],
    queryFn: () => api.get<ClientDetail>(`/clients/${params.id}`),
    retry: false,
  });
  const portfolio = useQuery({
    queryKey: ["admin", "client", params.id, "portfolio"],
    queryFn: () =>
      api.get<ClientPortfolioSummary>(
        `/clients/${params.id}/portfolio-summary`,
      ),
    enabled: client.isSuccess,
  });

  if (client.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (client.isError || !client.data) {
    const notFound =
      client.error instanceof ApiError && client.error.status === 404;
    return (
      <ErrorState
        title={notFound ? "Client not found" : "We couldn't load this client."}
        description={
          notFound
            ? "It may have been removed, or is outside your access."
            : "Please try again."
        }
        onRetry={notFound ? undefined : () => void client.refetch()}
      />
    );
  }

  const c = client.data;

  return (
    <div>
      <button
        onClick={() => router.push("/admin/clients")}
        className="mb-4 text-sm text-ink-muted hover:text-navy-900"
      >
        ← All clients
      </button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {c.displayName}
            <StatusBadge status={c.status} />
          </span>
        }
        subtitle={`${c.ref} · ${titleCase(c.type)} · ${titleCase(c.segment)}${
          c.countryOfResidence ? ` · resides ${c.countryOfResidence}` : ""
        }`}
      />

      {portfolio.data ? (
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Properties"
            value={portfolio.data.properties.total}
            hint={`${portfolio.data.properties.occupied} occupied · ${portfolio.data.properties.vacant} vacant`}
          />
          <StatCard
            label="Expected rent (mo.)"
            value={formatMinor(
              portfolio.data.rent.expectedMinor,
              portfolio.data.currency,
            )}
          />
          <StatCard
            label="Collected (mo.)"
            value={formatMinor(
              portfolio.data.rent.collectedMinor,
              portfolio.data.currency,
            )}
            tone="positive"
          />
          <StatCard
            label="Open maintenance"
            value={portfolio.data.openMaintenance}
          />
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Profile" />
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Row label="Legal name" value={c.legalName ?? "—"} />
            <Row
              label="Service package"
              value={c.servicePackage ? titleCase(c.servicePackage) : "—"}
            />
            <Row label="Email" value={c.primaryEmail ?? "—"} />
            <Row label="Phone" value={c.primaryPhone ?? "—"} />
            <Row
              label="Account manager"
              value={c.accountManager?.fullName ?? "Unassigned"}
            />
            <Row label="Client since" value={formatDate(c.createdAt)} />
          </dl>

          <div className="mt-5 border-t border-line pt-4">
            <p className="nx-label mb-2">Portal users</p>
            {c.users.length === 0 ? (
              <p className="text-sm text-ink-subtle">No portal users yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {c.users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between">
                    <span className="text-navy-900">
                      {u.fullName}
                      <span className="ml-2 text-xs text-ink-subtle">
                        {u.email}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-ink-subtle">
                      {titleCase(u.relationship)}
                      {u.canApprove ? (
                        <StatusBadge status="Can approve" tone="info" />
                      ) : null}
                      {!u.accepted ? (
                        <StatusBadge status="Invited" tone="warning" />
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {c.contacts.length > 0 ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="nx-label mb-2">Contacts</p>
              <ul className="space-y-1 text-sm">
                {c.contacts.map((ct) => (
                  <li key={ct.id} className="flex justify-between">
                    <span className="text-navy-900">
                      {ct.name}
                      {ct.role ? (
                        <span className="ml-2 text-xs text-ink-subtle">
                          {ct.role}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-ink-subtle">
                      {ct.phone ?? ct.email ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card>
          <CardHeader title="Onboarding" />
          {c.onboarding ? (
            <>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink-muted">
                  Step {c.onboarding.currentStep} of {c.onboarding.steps.length}
                </span>
                <span className="font-semibold text-navy-900">
                  {c.onboarding.completionPercent}%
                </span>
              </div>
              <ProgressBar
                percent={c.onboarding.completionPercent}
                className="mb-4"
              />
              <StepList steps={c.onboarding.steps} />
              <div className="mt-4 border-t border-line pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">KYC</span>
                  <span className="text-navy-900">
                    {titleCase(c.onboarding.kycStatus)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-ink-muted">Agreement</span>
                  <span className="text-navy-900">
                    {c.onboarding.agreementAccepted ? "Accepted" : "Pending"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-subtle">
              Onboarding has not started.
            </p>
          )}
        </Card>
      </div>
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

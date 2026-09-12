"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

interface InspectionDetail {
  id: string;
  ref: string;
  type: string;
  status: string;
  property: { id: string; name: string; ref: string };
  inspector: { id: string; fullName: string } | null;
  overallCondition: string | null;
  scheduledFor: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  reportDocumentId: string | null;
  items: {
    id: string;
    area: string;
    label: string;
    rating: string;
    note: string | null;
    recommendation: string | null;
  }[];
}

const RATING_TONE: Record<
  string,
  "positive" | "warning" | "critical" | "neutral"
> = {
  GOOD: "positive",
  ATTENTION_REQUIRED: "warning",
  URGENT: "critical",
  NOT_APPLICABLE: "neutral",
};

export default function InspectionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["inspection", params.id],
    queryFn: () => api.get<InspectionDetail>(`/inspections/${params.id}`),
    retry: false,
  });

  const download = useMutation({
    mutationFn: () =>
      api.get<{ url: string }>(
        `/documents/${data!.reportDocumentId}/download-url`,
      ),
    onSuccess: (res) => window.open(res.url, "_blank", "noopener"),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        title={
          notFound
            ? "Inspection not found"
            : "We couldn't load this inspection."
        }
        onRetry={notFound ? undefined : () => void refetch()}
      />
    );
  }

  const byArea = data.items.reduce<Record<string, typeof data.items>>(
    (acc, it) => {
      (acc[it.area] ??= []).push(it);
      return acc;
    },
    {},
  );

  return (
    <div>
      <button
        onClick={() => router.push("/inspections")}
        className="mb-4 text-sm text-ink-muted hover:text-navy-900"
      >
        ← All inspections
      </button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {titleCase(data.type)} inspection
            <StatusBadge status={data.status} />
          </span>
        }
        subtitle={`${data.ref} · ${data.property.name}${data.inspector ? ` · ${data.inspector.fullName}` : ""}`}
        action={
          data.reportDocumentId ? (
            <Button
              size="sm"
              variant="secondary"
              loading={download.isPending}
              onClick={() => download.mutate()}
            >
              Download report (PDF)
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="nx-label">Scheduled</p>
          <p className="mt-1 font-medium text-navy-900">
            {formatDate(data.scheduledFor)}
          </p>
        </div>
        <div>
          <p className="nx-label">Completed</p>
          <p className="mt-1 font-medium text-navy-900">
            {formatDate(data.completedAt)}
          </p>
        </div>
        <div>
          <p className="nx-label">Overall condition</p>
          <p className="mt-1 font-medium text-navy-900">
            {data.overallCondition ? titleCase(data.overallCondition) : "—"}
          </p>
        </div>
      </div>

      {data.items.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-subtle">
            This inspection has not been carried out yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byArea).map(([area, items]) => (
            <Card key={area}>
              <CardHeader title={titleCase(area)} />
              <ul className="space-y-3">
                {items.map((it) => (
                  <li key={it.id} className="border-l-2 border-line pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-navy-900">
                        {it.label}
                      </span>
                      <StatusBadge
                        status={it.rating}
                        tone={RATING_TONE[it.rating]}
                      />
                    </div>
                    {it.note ? (
                      <p className="mt-1 text-sm text-ink-muted">{it.note}</p>
                    ) : null}
                    {it.recommendation ? (
                      <p className="mt-0.5 text-sm italic text-ink-subtle">
                        Recommendation: {it.recommendation}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

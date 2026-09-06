"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

interface DocRow {
  id: string;
  title: string;
  category: string;
  mimeType: string;
  createdAt: string;
}

export default function TenantDocumentsPage() {
  const docs = useQuery({
    queryKey: ["tenant", "documents"],
    queryFn: () => api.list<DocRow>("/tenant/documents"),
  });
  const download = useMutation({
    mutationFn: (id: string) => api.get<{ url: string }>(`/documents/${id}/download-url`),
    onSuccess: (res) => window.open(res.url, "_blank", "noopener"),
  });

  const rows = docs.data?.items ?? [];

  return (
    <div>
      <PageHeader title="Documents" subtitle="Your lease and tenancy documents." />

      {docs.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : docs.isError ? (
        <ErrorState onRetry={() => void docs.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No documents yet" description="Documents shared with you appear here." />
      ) : (
        <Card className="divide-y divide-line p-0">
          {rows.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-navy-900">{d.title}</p>
                <p className="text-xs text-ink-subtle">
                  {titleCase(d.category)} · {formatDate(d.createdAt)}
                </p>
              </div>
              <Button size="sm" variant="secondary" loading={download.isPending} onClick={() => download.mutate(d.id)}>
                Download
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

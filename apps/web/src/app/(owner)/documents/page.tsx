"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DocumentRow, PropertyListItem } from "@/lib/resources";
import { formatDate, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

const CATEGORIES = [
  "PROPERTY",
  "OWNERSHIP",
  "TENANCY",
  "INSURANCE",
  "INSPECTION_REPORT",
  "MAINTENANCE_REPORT",
  "INVOICE",
  "RECEIPT",
  "VALUATION",
  "LEGAL",
  "TAX",
  "OTHER",
] as const;

function formatBytes(value: string): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const clientId = user?.clientIds?.[0] ?? null;

  const properties = useQuery({
    queryKey: ["documents", "properties"],
    queryFn: () =>
      api.list<PropertyListItem>("/properties", { query: { pageSize: 100 } }),
  });

  const [scope, setScope] = useState<"CLIENT" | "PROPERTY">("CLIENT");
  const [propertyId, setPropertyId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [expiringOnly, setExpiringOnly] = useState(false);

  const scopeId = scope === "CLIENT" ? clientId : propertyId || null;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["documents", "list", scope, scopeId, category, expiringOnly],
    queryFn: () =>
      api.list<DocumentRow>("/documents", {
        query: {
          scopeType: scope,
          scopeId: scopeId as string,
          category: category || undefined,
          expiringWithinDays: expiringOnly ? 30 : undefined,
          pageSize: 50,
        },
      }),
    enabled: !!scopeId,
  });

  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Everything NexaHaus holds on file for you — leases, reports, insurance and more."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          <button
            onClick={() => setScope("CLIENT")}
            className={
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
              (scope === "CLIENT"
                ? "bg-navy-900 text-white"
                : "text-ink-muted hover:text-navy-900")
            }
          >
            Ownership & account
          </button>
          <button
            onClick={() => setScope("PROPERTY")}
            className={
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
              (scope === "PROPERTY"
                ? "bg-navy-900 text-white"
                : "text-ink-muted hover:text-navy-900")
            }
          >
            By property
          </button>
        </div>

        {scope === "PROPERTY" ? (
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="h-9 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          >
            <option value="">Select a property…</option>
            {(properties.data?.items ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : null}

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {titleCase(c)}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={expiringOnly}
            onChange={(e) => setExpiringOnly(e.target.checked)}
          />
          Expiring within 30 days
        </label>
      </div>

      {scope === "PROPERTY" && !propertyId ? (
        <EmptyState
          title="Choose a property"
          description="Select a property above to see its documents."
        />
      ) : isLoading ? (
        <Card>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-12 w-full" />
          ))}
        </Card>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No documents found"
          description="Leases, reports and other files NexaHaus files for you will appear here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <DocumentRowItem key={d.id} doc={d} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function DocumentRowItem({ doc }: { doc: DocumentRow }) {
  const download = useMutation({
    mutationFn: () =>
      api.get<{ url: string }>(`/documents/${doc.id}/download-url`),
    onSuccess: (res) => window.open(res.url, "_blank", "noopener"),
  });

  const expiringSoon =
    doc.expiresAt &&
    new Date(doc.expiresAt).getTime() - Date.now() < 30 * 86_400_000;

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-navy-900">{doc.title}</p>
        <p className="text-xs text-ink-subtle">
          {formatDate(doc.createdAt)}
          {doc.version > 1 ? ` · v${doc.version}` : ""}
        </p>
      </td>
      <td className="px-4 py-3 text-ink-muted">{titleCase(doc.category)}</td>
      <td className="px-4 py-3 tabular-nums text-ink-muted">
        {formatBytes(doc.sizeBytes)}
      </td>
      <td className="px-4 py-3">
        {doc.expiresAt ? (
          <span className={expiringSoon ? "text-warning" : "text-ink-muted"}>
            {formatDate(doc.expiresAt)}
          </span>
        ) : (
          <span className="text-ink-subtle">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {doc.downloadable ? (
          <Button
            size="sm"
            variant="secondary"
            loading={download.isPending}
            onClick={() => download.mutate()}
          >
            Download
          </Button>
        ) : (
          <StatusBadge status={doc.scanStatus} />
        )}
      </td>
    </tr>
  );
}

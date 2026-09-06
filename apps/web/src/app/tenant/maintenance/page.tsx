"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { MaintenanceRow } from "@/lib/ops-resources";
import type { TenantMe } from "@/lib/tenant-resources";
import { formatDate, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500";

export default function TenantMaintenancePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ category: "PLUMBING", priority: "MEDIUM", title: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const me = useQuery({ queryKey: ["tenant", "me"], queryFn: () => api.get<TenantMe>("/tenant/me") });
  const list = useQuery({
    queryKey: ["tenant", "maintenance", "all"],
    queryFn: () => api.list<MaintenanceRow>("/maintenance", { query: { pageSize: 50 } }),
  });

  const report = useMutation({
    mutationFn: () =>
      api.post("/maintenance", {
        propertyId: me.data?.currentTenancy?.propertyId,
        unitId: me.data?.currentTenancy?.unitId,
        leaseId: me.data?.currentTenancy?.leaseId,
        category: form.category,
        priority: form.priority,
        title: form.title.trim(),
        description: form.description.trim(),
      }),
    onSuccess: () => {
      setForm({ category: "PLUMBING", priority: "MEDIUM", title: "", description: "" });
      setShowForm(false);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["tenant", "maintenance"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not submit your report."),
  });

  const rows = list.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Report an issue and follow it through to completion."
        action={
          !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>Report an issue</Button>
          ) : undefined
        }
      />

      {showForm ? (
        <Card className="mb-6">
          <CardHeader title="Report an issue" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-navy-900">Category</span>
                <select className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {["PLUMBING", "ELECTRICAL", "AIR_CONDITIONING", "APPLIANCE", "STRUCTURAL", "SECURITY", "PEST_CONTROL", "OTHER"].map((c) => (
                    <option key={c} value={c}>{titleCase(c)}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-navy-900">Urgency</span>
                <select className={inputCls} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <option key={p} value={p}>{titleCase(p)}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy-900">Summary</span>
              <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Kitchen tap is leaking" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy-900">What's happening?</span>
              <textarea rows={4} className={inputCls} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </label>
            {error ? <p className="text-sm text-critical">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                loading={report.isPending}
                disabled={!form.title.trim() || !form.description.trim() || !me.data?.currentTenancy}
                onClick={() => report.mutate()}
              >
                Submit report
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      ) : null}

      {list.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No maintenance requests" description="Anything you report will appear here with its status." />
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.priority} tone={m.priority === "URGENT" ? "critical" : m.priority === "HIGH" ? "warning" : "neutral"} />
                  <span className="font-medium text-navy-900">{m.title}</span>
                </div>
                <p className="mt-1 text-xs text-ink-subtle">
                  {titleCase(m.category)} · reported {formatDate(m.createdAt)}
                  {m.scheduledFor ? ` · visit ${formatDate(m.scheduledFor)}` : ""}
                </p>
              </div>
              <StatusBadge status={m.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

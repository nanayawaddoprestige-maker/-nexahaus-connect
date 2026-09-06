"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, getAccessToken } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/states";

interface ImportJob {
  id: string;
  ref: string;
  entity: string;
  status: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: { row: number; field?: string; message: string }[];
  createdRefs: string[];
  commitFailures: { row: number; message: string }[];
  createdAt: string;
  committedAt: string | null;
}

const TEMPLATES: Record<string, string> = {
  CLIENT: "type,displayName,segment,primaryEmail,primaryPhone\nINDIVIDUAL,Kofi Owusu,DIASPORA,kofi@example.com,+233201112223",
  PROPERTY: "clientRef,name,type,addressLine,city,region,bedrooms\nCL-000001,Labone Flat,APARTMENT,12 Labone Cres,Accra,Greater Accra,2",
  UNIT: "propertyRef,label,bedrooms,bathrooms,marketRentMinor,marketRentCurrency,status\nNH-000001,Unit 201,2,2,750000,GHS,VACANT",
  TENANT: "fullName,phone,email\nAma Serwaa,+233241234567,ama@example.com",
};

export default function AdminImportsPage() {
  const qc = useQueryClient();
  const [entity, setEntity] = useState("CLIENT");
  const [csv, setCsv] = useState(TEMPLATES.CLIENT);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useQuery({
    queryKey: ["admin", "imports"],
    queryFn: () => api.list<ImportJob>("/imports"),
  });

  const validate = useMutation({
    mutationFn: () => api.post<ImportJob>("/imports", { entity, csv }),
    onSuccess: (j) => {
      setJob(j);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["admin", "imports"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Validation failed."),
  });

  const commit = useMutation({
    mutationFn: (allowPartial: boolean) =>
      api.post<ImportJob>(`/imports/${job!.id}/commit${allowPartial ? "?allowPartial=true" : ""}`),
    onSuccess: (j) => {
      setJob(j);
      void qc.invalidateQueries({ queryKey: ["admin", "imports"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Commit failed."),
  });

  async function downloadErrors(id: string) {
    const res = await fetch(`/api/v1/imports/${id}/errors`, {
      headers: { authorization: `Bearer ${getAccessToken() ?? ""}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-${id}-errors.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Data import" subtitle="Bring existing records in from a spreadsheet. Validate first, then commit." />

      <Card className="mb-6">
        <CardHeader title="New import" />
        <div className="mb-3 flex gap-1 rounded-lg border border-line bg-surface p-1">
          {Object.keys(TEMPLATES).map((e) => (
            <button
              key={e}
              onClick={() => {
                setEntity(e);
                setCsv(TEMPLATES[e]);
                setJob(null);
              }}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium " +
                (entity === e ? "bg-navy-900 text-white" : "text-ink-muted hover:text-navy-900")
              }
            >
              {titleCase(e)}
            </button>
          ))}
        </div>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          spellCheck={false}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        />
        <p className="mt-1 text-xs text-ink-subtle">
          First row is the header. The template above shows the accepted columns for {titleCase(entity)}.
        </p>
        {error ? <p className="mt-2 text-sm text-critical">{error}</p> : null}
        <div className="mt-3 flex gap-2">
          <Button loading={validate.isPending} onClick={() => validate.mutate()}>
            Validate
          </Button>
        </div>
      </Card>

      {job ? (
        <Card className="mb-6">
          <CardHeader
            title={`Import ${job.ref}`}
            action={<StatusBadge status={job.status} />}
          />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="nx-label">Total rows</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-navy-900">{job.totalRows}</p>
            </div>
            <div>
              <p className="nx-label">Valid</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-positive">{job.validRows}</p>
            </div>
            <div>
              <p className="nx-label">Errors</p>
              <p className={"mt-1 text-lg font-semibold tabular-nums " + (job.errorRows ? "text-critical" : "text-navy-900")}>
                {job.errorRows}
              </p>
            </div>
          </div>

          {job.errors.length > 0 ? (
            <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-line">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-ink-subtle">
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Field</th>
                    <th className="px-3 py-2">Problem</th>
                  </tr>
                </thead>
                <tbody>
                  {job.errors.map((e, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="px-3 py-1.5 tabular-nums">{e.row}</td>
                      <td className="px-3 py-1.5 font-mono">{e.field ?? "—"}</td>
                      <td className="px-3 py-1.5 text-ink-muted">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {job.createdRefs.length > 0 ? (
            <p className="mt-3 text-sm text-positive">
              Created {job.createdRefs.length}: {job.createdRefs.slice(0, 8).join(", ")}
              {job.createdRefs.length > 8 ? "…" : ""}
            </p>
          ) : null}
          {job.commitFailures.length > 0 ? (
            <p className="mt-2 text-sm text-critical">
              {job.commitFailures.length} row(s) failed at commit — download the error report.
            </p>
          ) : null}

          <div className="mt-4 flex gap-2">
            {job.status === "VALIDATED" ? (
              job.errorRows === 0 ? (
                <Button loading={commit.isPending} onClick={() => commit.mutate(false)}>
                  Commit {job.validRows} rows
                </Button>
              ) : (
                <Button variant="danger" loading={commit.isPending} onClick={() => commit.mutate(true)}>
                  Commit {job.validRows} valid rows, skip {job.errorRows}
                </Button>
              )
            ) : null}
            {job.errorRows > 0 || job.commitFailures.length > 0 ? (
              <Button variant="secondary" onClick={() => void downloadErrors(job.id)}>
                Download error report
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-line px-4 py-3 text-sm font-semibold text-navy-900">Recent imports</div>
        {history.isLoading ? (
          <div className="p-4"><Skeleton className="h-24 w-full" /></div>
        ) : history.isError ? (
          <div className="p-4"><ErrorState onRetry={() => void history.refetch()} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-2 font-medium">Ref</th>
                <th className="px-4 py-2 font-medium">Entity</th>
                <th className="px-4 py-2 font-medium">Rows</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {(history.data?.items ?? []).map((h) => (
                <tr key={h.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-navy-700">{h.ref}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{titleCase(h.entity)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-navy-900">
                    {h.validRows}/{h.totalRows}
                    {h.errorRows ? <span className="ml-1 text-xs text-critical">({h.errorRows} err)</span> : null}
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={h.status} /></td>
                  <td className="px-4 py-2.5 text-ink-subtle">{formatDate(h.committedAt ?? h.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

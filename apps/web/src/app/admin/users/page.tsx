"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleKey, STAFF_ROLES } from "@nexahaus/types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { StaffUserRow } from "@/lib/admin-resources";
import { formatDate, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/states";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Administrator",
  MANAGING_DIRECTOR: "Managing Director",
  PROPERTY_MANAGER: "Property Manager",
  FINANCE_OFFICER: "Finance Officer",
  MAINTENANCE_OFFICER: "Maintenance Officer",
  INSPECTOR: "Inspector",
  LEASING_OFFICER: "Leasing Officer",
  SUPPORT_STAFF: "Support Staff",
};

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const isSuperAdmin = me?.roles?.includes("SUPER_ADMIN") ?? false;
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () =>
      api.list<StaffUserRow>("/users", { query: { pageSize: 100 } }),
  });

  const [showInvite, setShowInvite] = useState(false);
  const rows = data?.items ?? [];

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ["admin", "users"] });

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="NexaHaus staff accounts and their roles."
        action={
          <Button size="sm" onClick={() => setShowInvite((v) => !v)}>
            {showInvite ? "Cancel" : "Invite team member"}
          </Button>
        }
      />

      {showInvite ? (
        <InviteForm
          allowSuperAdmin={isSuperAdmin}
          onInvited={() => {
            setShowInvite(false);
            invalidate();
          }}
        />
      ) : null}

      {isLoading ? (
        <Card>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-12 w-full" />
          ))}
        </Card>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Invite a colleague to get them access to the admin console."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <UserRow
                  key={u.id}
                  row={u}
                  isMe={u.id === me?.userId}
                  canModify={u.role?.key !== "SUPER_ADMIN" || isSuperAdmin}
                  isSuperAdmin={isSuperAdmin}
                  onChanged={invalidate}
                />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function InviteForm({
  allowSuperAdmin,
  onInvited,
}: {
  allowSuperAdmin: boolean;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleKey, setRoleKey] = useState<string>(RoleKey.PROPERTY_MANAGER);
  const [error, setError] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () => api.post("/users/invite", { email, fullName, roleKey }),
    onSuccess: onInvited,
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });

  const roles = STAFF_ROLES.filter(
    (r) => r !== RoleKey.SUPER_ADMIN || allowSuperAdmin,
  );

  return (
    <Card className="mb-4">
      <CardHeader
        title="Invite a team member"
        description="They'll receive an email with a link to set their password."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          invite.mutate();
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Full name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Role</span>
          <select
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? titleCase(r)}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <p className="sm:col-span-3 text-sm text-critical">{error}</p>
        ) : null}
        <div className="sm:col-span-3">
          <Button type="submit" loading={invite.isPending}>
            Send invite
          </Button>
        </div>
      </form>
    </Card>
  );
}

function UserRow({
  row,
  isMe,
  canModify,
  isSuperAdmin,
  onChanged,
}: {
  row: StaffUserRow;
  isMe: boolean;
  canModify: boolean;
  isSuperAdmin: boolean;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const resend = useMutation({
    mutationFn: () => api.post(`/users/${row.id}/resend-invite`),
    onSuccess: onChanged,
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });

  const setStatus = useMutation({
    mutationFn: (status: "ACTIVE" | "SUSPENDED" | "DISABLED") =>
      api.patch(`/users/${row.id}/status`, { status }),
    onSuccess: onChanged,
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });

  const roles = STAFF_ROLES.filter(
    (r) => r !== RoleKey.SUPER_ADMIN || isSuperAdmin,
  );
  const setRole = useMutation({
    mutationFn: (nextRoleKey: string) =>
      api.patch(`/users/${row.id}/role`, { roleKey: nextRoleKey }),
    onSuccess: onChanged,
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-navy-900">
          {row.fullName}
          {isMe ? (
            <span className="ml-2 text-xs text-ink-subtle">(you)</span>
          ) : null}
        </p>
        <p className="text-xs text-ink-subtle">{row.email}</p>
        {error ? <p className="mt-1 text-xs text-critical">{error}</p> : null}
      </td>
      <td className="px-4 py-3">
        {canModify ? (
          <select
            value={row.role?.key ?? ""}
            disabled={setRole.isPending}
            onChange={(e) => {
              setError(null);
              setRole.mutate(e.target.value);
            }}
            className="h-8 rounded-lg border border-line bg-surface px-2 text-sm"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? titleCase(r)}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-ink-muted">{row.role?.name ?? "—"}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-4 py-3 text-ink-muted">
        {row.lastLoginAt ? formatDate(row.lastLoginAt) : "Never"}
      </td>
      <td className="px-4 py-3 text-right">
        {row.status === "PENDING_VERIFICATION" ? (
          <Button
            size="sm"
            variant="secondary"
            loading={resend.isPending}
            onClick={() => {
              setError(null);
              resend.mutate();
            }}
          >
            Resend invite
          </Button>
        ) : !isMe && canModify ? (
          <Button
            size="sm"
            variant={row.status === "ACTIVE" ? "danger" : "secondary"}
            loading={setStatus.isPending}
            onClick={() => {
              setError(null);
              setStatus.mutate(
                row.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
              );
            }}
          >
            {row.status === "ACTIVE" ? "Suspend" : "Reactivate"}
          </Button>
        ) : null}
      </td>
    </tr>
  );
}

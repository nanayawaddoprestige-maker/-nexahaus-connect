"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/lib/collab-resources";
import { NOTIFICATION_LABELS } from "@/lib/collab-resources";
import { relativeDays, titleCase } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/states";

export default function TenantNotificationsPage() {
  const qc = useQueryClient();
  const feed = useQuery({
    queryKey: ["notifications", "page"],
    queryFn: () => api.list<NotificationItem>("/notifications", { query: { limit: 50 } }),
  });
  const markAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = feed.data?.items ?? [];
  const unread = (feed.data?.meta as { unread?: number } | undefined)?.unread ?? 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up."}
        action={
          unread > 0 ? (
            <Button size="sm" variant="secondary" onClick={() => markAll.mutate()}>
              Mark all read
            </Button>
          ) : undefined
        }
      />
      {feed.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <EmptyState title="No notifications yet" description="Updates about your tenancy will appear here." />
      ) : (
        <Card className="p-0">
          {items.map((n) => (
            <div key={n.id} className={cn("border-b border-line px-4 py-3 last:border-0", !n.read && "bg-navy-50/40")}>
              <p className="text-sm font-medium text-navy-900">{n.title}</p>
              <p className="text-sm text-ink-muted">{n.body}</p>
              <p className="mt-0.5 text-xs text-ink-subtle">
                {NOTIFICATION_LABELS[n.type] ?? titleCase(n.type)} · {relativeDays(n.createdAt)}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

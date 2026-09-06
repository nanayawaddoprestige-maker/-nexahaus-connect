"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  NotificationItem,
  NotificationPreference,
} from "@/lib/collab-resources";
import { NOTIFICATION_LABELS } from "@/lib/collab-resources";
import { relativeDays, titleCase } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/states";

const CHANNELS: (keyof NotificationPreference)[] = ["inApp", "email", "sms", "whatsapp", "push"];
const CHANNEL_LABELS: Record<string, string> = {
  inApp: "In-app",
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  push: "Push",
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const feed = useQuery({
    queryKey: ["notifications", "page"],
    queryFn: () => api.list<NotificationItem>("/notifications", { query: { limit: 50 } }),
  });
  const prefs = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => api.list<NotificationPreference>("/notifications/preferences"),
  });

  const markAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const savePref = useMutation({
    mutationFn: (p: Partial<NotificationPreference> & { type: string }) =>
      api.put("/notifications/preferences", p),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications", "preferences"] }),
  });

  const items = feed.data?.items ?? [];
  const unread = (feed.data?.meta as { unread?: number } | undefined)?.unread ?? 0;
  const prefRows = prefs.data?.items ?? [];
  const knownTypes = Object.keys(NOTIFICATION_LABELS);

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {feed.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No notifications yet" description="Updates about your properties will appear here." />
          ) : (
            <Card className="p-0">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-b border-line px-4 py-3 last:border-0",
                    !n.read && "bg-navy-50/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-navy-900">{n.title}</p>
                      <p className="text-sm text-ink-muted">{n.body}</p>
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        {NOTIFICATION_LABELS[n.type] ?? titleCase(n.type)} · {relativeDays(n.createdAt)}
                      </p>
                    </div>
                    {!n.read ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-navy-700" />
                    ) : null}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Preferences" description="Choose how you hear about each kind of update." />
          {prefs.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              {knownTypes.map((type) => {
                const row = prefRows.find((r) => r.type === type) ?? {
                  type,
                  inApp: true,
                  email: true,
                  sms: false,
                  whatsapp: false,
                  push: false,
                };
                return (
                  <div key={type}>
                    <p className="text-sm font-medium text-navy-900">
                      {NOTIFICATION_LABELS[type]}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-3">
                      {CHANNELS.map((ch) => (
                        <label key={ch} className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <input
                            type="checkbox"
                            checked={Boolean(row[ch])}
                            onChange={(e) =>
                              savePref.mutate({ type, [ch]: e.target.checked })
                            }
                          />
                          {CHANNEL_LABELS[ch]}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

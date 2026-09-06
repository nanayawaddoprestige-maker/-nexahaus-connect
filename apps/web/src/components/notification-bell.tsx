"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/lib/collab-resources";
import { relativeDays } from "@/lib/format";
import { cn } from "@/lib/cn";

export function NotificationBell({ viewAllHref = "/notifications" }: { viewAllHref?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["notifications", "feed"],
    queryFn: () =>
      api.list<NotificationItem>("/notifications", { query: { limit: 12 } }),
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = (data?.meta as { unread?: number } | undefined)?.unread ?? 0;
  const items = data?.items ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-navy-700 hover:bg-navy-50"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10.5 20a1.8 1.8 0 0 0 3 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-raised">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold text-navy-900">Notifications</span>
            {unread > 0 ? (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs font-medium text-navy-700 hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-subtle">
                You&apos;re all caught up.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n.id);
                  }}
                  className={cn(
                    "block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-surface-sunken",
                    !n.read && "bg-navy-50/50",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read ? (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-700" />
                    ) : (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-navy-900">{n.title}</p>
                      <p className="text-xs text-ink-muted">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-ink-subtle">
                        {relativeDays(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <Link
            href={viewAllHref}
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-sm font-medium text-navy-700 hover:bg-surface-sunken"
          >
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}

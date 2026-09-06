"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ThreadDetail, ThreadRow } from "@/lib/collab-resources";
import { relativeDays, formatDate, titleCase } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/states";

export default function MessagesPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const threads = useQuery({
    queryKey: ["messages", "threads"],
    queryFn: () => api.list<ThreadRow>("/messages/threads", { query: { pageSize: 30 } }),
    refetchInterval: 30_000,
  });

  const thread = useQuery({
    queryKey: ["messages", "thread", selectedId],
    queryFn: () => api.get<ThreadDetail>(`/messages/threads/${selectedId}`),
    enabled: !!selectedId,
  });

  const send = useMutation({
    mutationFn: (body: string) =>
      api.post<ThreadDetail>(`/messages/threads/${selectedId}/messages`, { body }),
    onSuccess: () => {
      setDraft("");
      void qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  useEffect(() => {
    if (selectedId) void api.post(`/messages/threads/${selectedId}/read`).catch(() => {});
  }, [selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data?.messages.length]);

  const rows = threads.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Your direct line to the NexaHaus team."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto p-0">
          {threads.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-subtle">
              No conversations yet.
            </p>
          ) : (
            rows.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-surface-sunken",
                  selectedId === t.id && "bg-navy-50/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-navy-900">{t.title}</span>
                  {t.unread > 0 ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-navy-700 px-1 text-[10px] font-semibold text-white">
                      {t.unread}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-ink-subtle">
                  {t.property ? `${t.property.name} · ` : ""}
                  {t.lastMessage?.preview ?? titleCase(t.type)}
                </p>
                <p className="text-[11px] text-ink-subtle">{relativeDays(t.lastMessageAt)}</p>
              </button>
            ))
          )}
        </Card>

        <Card className="flex max-h-[70vh] flex-col p-0">
          {!selectedId ? (
            <EmptyState
              title="Select a conversation"
              description="Choose a thread on the left to read and reply."
            />
          ) : thread.isLoading || !thread.data ? (
            <div className="flex-1 p-4">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <>
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-navy-900">{thread.data.title}</p>
                <p className="text-xs text-ink-subtle">
                  {thread.data.participants.map((p) => p.name).join(", ")}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.data.messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.fromMe && "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        m.fromMe
                          ? "bg-navy-900 text-white"
                          : "bg-surface-sunken text-ink",
                      )}
                    >
                      {!m.fromMe ? (
                        <p className="mb-0.5 text-[11px] font-medium text-ink-subtle">
                          {m.sender.fullName}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-line">{m.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          m.fromMe ? "text-navy-200" : "text-ink-subtle",
                        )}
                      >
                        {formatDate(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) send.mutate(draft.trim());
                }}
                className="flex gap-2 border-t border-line p-3"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
                />
                <Button type="submit" loading={send.isPending} disabled={!draft.trim()}>
                  Send
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

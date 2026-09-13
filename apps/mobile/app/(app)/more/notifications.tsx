import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { relativeDays, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const NOTIFICATION_LABELS: Record<string, string> = {
  APPROVAL_REQUIRED: "Approval needed",
  APPROVAL_COMPLETED: "Approval decided",
  MAINTENANCE_CREATED: "Maintenance reported",
  MAINTENANCE_ASSIGNED: "Maintenance scheduled",
  MAINTENANCE_COMPLETED: "Maintenance completed",
  RENT_RECEIVED: "Rent received",
  RENT_OVERDUE: "Rent overdue",
  INSPECTION_COMPLETED: "Inspection report ready",
  STATEMENT_GENERATED: "New owner statement",
  DOCUMENT_EXPIRING: "Document expiring",
  LEASE_EXPIRING: "Lease expiring",
  HEALTH_SCORE_UPDATED: "Health score updated",
  MESSAGE_RECEIVED: "New message",
};

export default function Notifications() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["notifications", "feed"],
    queryFn: () =>
      api
        .get<NotificationItem[]>("/notifications", { limit: 50 })
        .catch(() => [] as NotificationItem[]),
  });

  const markAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={{ padding: 16 }}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </Text>
          {unread > 0 ? (
            <Pressable
              onPress={() => markAll.mutate()}
              disabled={markAll.isPending}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.muted}>
          {isLoading
            ? "Loading…"
            : isError
              ? "We couldn't load notifications."
              : "No notifications yet."}
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            if (!item.read) markOne.mutate(item.id);
          }}
          style={[styles.card, !item.read && styles.cardUnread]}
        >
          <View style={styles.cardTop}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read ? <View style={styles.dot} /> : null}
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.meta}>
            {NOTIFICATION_LABELS[item.type] ?? titleCase(item.type)} ·{" "}
            {relativeDays(item.createdAt)}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerText: { fontSize: theme.font.size.sm, color: theme.color.inkMuted },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
  },
  markAllText: {
    fontSize: theme.font.size.xs,
    fontWeight: "600",
    color: theme.color.navy900,
  },
  muted: { color: theme.color.inkSubtle, fontSize: theme.font.size.sm },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: { backgroundColor: theme.color.navy50 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: theme.font.size.base,
    fontWeight: "600",
    color: theme.color.navy900,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.color.navy700,
  },
  body: {
    fontSize: theme.font.size.sm,
    color: theme.color.inkMuted,
    marginTop: 2,
  },
  meta: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 6,
  },
});

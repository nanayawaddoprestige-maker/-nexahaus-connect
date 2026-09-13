import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { relativeDays, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface ThreadRow {
  id: string;
  type: string;
  title: string;
  unread: number;
  lastMessage: { preview: string; at: string } | null;
  lastMessageAt: string;
}

export default function MessagesList() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["messages", "threads"],
    queryFn: () =>
      api
        .get<ThreadRow[]>("/messages/threads", { pageSize: 30 })
        .catch(() => [] as ThreadRow[]),
    refetchInterval: 30_000,
  });

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={{ padding: 16 }}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text style={styles.muted}>
          {isLoading
            ? "Loading…"
            : isError
              ? "We couldn't load your messages."
              : "No conversations yet."}
        </Text>
      }
      renderItem={({ item }) => (
        <Link href={`/messages/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              {item.unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage?.preview ?? titleCase(item.type)}
            </Text>
            <Text style={styles.time}>{relativeDays(item.lastMessageAt)}</Text>
          </Pressable>
        </Link>
      )}
      onRefresh={() => void refetch()}
      refreshing={false}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  muted: { color: theme.color.inkSubtle, fontSize: theme.font.size.sm },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 14,
    marginBottom: 10,
  },
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
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: theme.color.navy700,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  preview: {
    fontSize: theme.font.size.sm,
    color: theme.color.inkMuted,
    marginTop: 2,
  },
  time: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 4,
  },
});

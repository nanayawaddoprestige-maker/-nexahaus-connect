import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { date, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface InspectionRow {
  id: string;
  ref: string;
  type: string;
  status: string;
  property: { id: string; name: string };
  inspector: { id: string; fullName: string } | null;
  overallCondition: string | null;
  scheduledFor: string | null;
  completedAt: string | null;
  reportDocumentId: string | null;
}

const CONDITION_COLOR: Record<string, string> = {
  EXCELLENT: theme.color.positive,
  GOOD: theme.color.positive,
  FAIR: theme.color.warning,
  POOR: theme.color.critical,
};

export default function InspectionsList() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inspections", "list"],
    queryFn: () =>
      api
        .get<InspectionRow[]>("/inspections", { pageSize: 50 })
        .catch(() => [] as InspectionRow[]),
  });

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={{ padding: 16 }}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      onRefresh={() => void refetch()}
      refreshing={false}
      ListEmptyComponent={
        <Text style={styles.muted}>
          {isLoading
            ? "Loading…"
            : isError
              ? "We couldn't load inspections."
              : "No inspections yet."}
        </Text>
      }
      renderItem={({ item }) => (
        <Link href={`/inspections/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.title}>
                {titleCase(item.type)} inspection
              </Text>
              {item.overallCondition ? (
                <Text
                  style={[
                    styles.condition,
                    {
                      color:
                        CONDITION_COLOR[item.overallCondition] ??
                        theme.color.inkMuted,
                    },
                  ]}
                >
                  {titleCase(item.overallCondition)}
                </Text>
              ) : null}
            </View>
            <Text style={styles.sub}>
              {item.ref} · {item.property.name}
              {item.inspector ? ` · ${item.inspector.fullName}` : ""}
              {item.completedAt
                ? ` · completed ${date(item.completedAt)}`
                : item.scheduledFor
                  ? ` · scheduled ${date(item.scheduledFor)}`
                  : ""}
            </Text>
            <View style={styles.cardBottom}>
              {item.reportDocumentId ? (
                <Text style={styles.reportReady}>Report ready</Text>
              ) : (
                <View />
              )}
              <Text style={styles.badge}>{titleCase(item.status)}</Text>
            </View>
          </Pressable>
        </Link>
      )}
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
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: theme.font.size.base,
    fontWeight: "700",
    color: theme.color.navy900,
    flex: 1,
  },
  condition: { fontSize: theme.font.size.xs, fontWeight: "700" },
  sub: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 4,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    paddingTop: 10,
  },
  reportReady: {
    fontSize: theme.font.size.xs,
    fontWeight: "600",
    color: theme.color.navy700,
  },
  badge: {
    fontSize: theme.font.size.xs,
    color: theme.color.navy700,
    backgroundColor: theme.color.navy50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
});

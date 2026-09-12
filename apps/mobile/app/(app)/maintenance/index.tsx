import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Switch,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { date, money, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface MoneyView {
  minor: string;
  currency: string;
}

interface MaintenanceRow {
  id: string;
  ref: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  property: { id: string; name: string };
  unit: string | null;
  estimatedCost: MoneyView | null;
  approvedCost: MoneyView | null;
  actualCost: MoneyView | null;
  scheduledFor: string | null;
}

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: theme.color.critical,
  HIGH: theme.color.warning,
};

export default function MaintenanceList() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const [openOnly, setOpenOnly] = useState(true);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["maintenance", "list", { openOnly, propertyId }],
    queryFn: () =>
      api
        .get<MaintenanceRow[]>("/maintenance", {
          openOnly: openOnly ? "true" : undefined,
          propertyId: propertyId || undefined,
          pageSize: 50,
        })
        .catch(() => [] as MaintenanceRow[]),
  });

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
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Open requests only</Text>
          <Switch value={openOnly} onValueChange={setOpenOnly} />
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.muted}>
          {isLoading
            ? "Loading…"
            : isError
              ? "We couldn't load maintenance requests."
              : openOnly
                ? "No open maintenance requests."
                : "No maintenance requests yet."}
        </Text>
      }
      renderItem={({ item }) => {
        const cost = item.actualCost ?? item.approvedCost ?? item.estimatedCost;
        return (
          <Link href={`/maintenance/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.priority,
                    {
                      color:
                        PRIORITY_COLOR[item.priority] ?? theme.color.inkMuted,
                    },
                  ]}
                >
                  {titleCase(item.priority)}
                </Text>
              </View>
              <Text style={styles.sub}>
                {item.ref} · {item.property.name}
                {item.unit ? ` · ${item.unit}` : ""} ·{" "}
                {titleCase(item.category)}
                {item.scheduledFor ? ` · ${date(item.scheduledFor)}` : ""}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cost}>
                  {money(cost?.minor, cost?.currency)}
                </Text>
                <Text style={styles.badge}>{titleCase(item.status)}</Text>
              </View>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  filterLabel: { fontSize: theme.font.size.sm, color: theme.color.inkMuted },
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
  priority: { fontSize: theme.font.size.xs, fontWeight: "700" },
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
  cost: {
    fontSize: theme.font.size.sm,
    fontWeight: "700",
    color: theme.color.navy900,
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

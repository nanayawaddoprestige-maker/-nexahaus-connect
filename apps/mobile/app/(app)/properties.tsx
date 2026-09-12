import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { money, percent, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface PropertyRow {
  id: string;
  ref: string;
  name: string;
  type: string;
  status: string;
  city: string;
  occupancy: { rate: number };
  finance: {
    collectedRentMinor: string;
    outstandingRentMinor: string;
    currency: string;
  };
}

export default function Properties() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["properties", "list"],
    queryFn: () =>
      api
        .get<PropertyRow[]>("/properties", { pageSize: 50 })
        .catch(() => [] as PropertyRow[]),
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
      ListEmptyComponent={
        <Text style={styles.muted}>
          {isLoading
            ? "Loading…"
            : isError
              ? "We couldn't load your properties."
              : "No properties to show yet."}
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.badge}>{titleCase(item.status)}</Text>
          </View>
          <Text style={styles.sub}>
            {item.ref} · {titleCase(item.type)} · {item.city}
          </Text>
          <View style={styles.metrics}>
            <Metric label="Occupancy" value={percent(item.occupancy.rate)} />
            <Metric
              label="Collected"
              value={money(
                item.finance.collectedRentMinor,
                item.finance.currency,
              )}
            />
            <Metric
              label="Outstanding"
              value={money(
                item.finance.outstandingRentMinor,
                item.finance.currency,
              )}
            />
          </View>
        </View>
      )}
    />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: theme.font.size.base,
    fontWeight: "700",
    color: theme.color.navy900,
    flex: 1,
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
  sub: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 4,
  },
  metrics: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    paddingTop: 12,
  },
  metricLabel: {
    fontSize: 10,
    color: theme.color.inkSubtle,
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: theme.font.size.sm,
    fontWeight: "700",
    color: theme.color.navy900,
    marginTop: 4,
  },
});

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money, percent } from "@/lib/format";
import { theme } from "@/lib/theme";

interface OwnerDashboard {
  currency: string;
  portfolio: {
    totalProperties: number;
    occupancyRate: number;
    occupiedUnits: number;
    totalUnits: number;
  };
  rent: {
    expectedMinor: string;
    collectedMinor: string;
    outstandingMinor: string;
    collectionRate: number;
  };
  attention: {
    openMaintenance: number;
    urgentMaintenance: number;
    pendingApprovals: number;
    inspectionsDue: number;
  };
  portfolioHealthScore: number | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", "owner"],
    queryFn: () => api.get<OwnerDashboard>("/dashboard/owner"),
  });

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
        />
      }
    >
      <Text style={styles.greeting}>Good day, {firstName}</Text>
      <Text style={styles.sub}>Here is where your portfolio stands today.</Text>

      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : isError || !data ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            We couldn&apos;t load your dashboard.
          </Text>
          <Pressable onPress={() => void refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <Stat
              label="Properties"
              value={String(data.portfolio.totalProperties)}
            />
            <Stat
              label="Occupancy"
              value={percent(data.portfolio.occupancyRate)}
            />
            <Stat
              label="Collected"
              value={money(data.rent.collectedMinor, data.currency)}
            />
            <Stat
              label="Outstanding"
              value={money(data.rent.outstandingMinor, data.currency)}
              tone={data.rent.outstandingMinor === "0" ? undefined : "warning"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Needs attention</Text>
            <Row
              label="Open maintenance"
              value={data.attention.openMaintenance}
              onPress={() => router.push("/maintenance")}
            />
            <Row
              label="Urgent"
              value={data.attention.urgentMaintenance}
              tone={data.attention.urgentMaintenance ? "critical" : undefined}
              onPress={() => router.push("/maintenance")}
            />
            <Row
              label="Pending approvals"
              value={data.attention.pendingApprovals}
              tone={data.attention.pendingApprovals ? "warning" : undefined}
              onPress={() => router.push("/more/approvals")}
            />
            <Row
              label="Inspections due"
              value={data.attention.inspectionsDue}
              onPress={() => router.push("/more/inspections")}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Portfolio health</Text>
            <Text style={styles.healthScore}>
              {data.portfolioHealthScore == null
                ? "—"
                : `${data.portfolioHealthScore} / 100`}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "critical";
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text
        style={[
          styles.statValue,
          tone === "warning" && { color: theme.color.warning },
          tone === "critical" && { color: theme.color.critical },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  tone,
  onPress,
}: {
  label: string;
  value: number;
  tone?: "warning" | "critical";
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.rowLine}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          tone === "warning" && { color: theme.color.warning },
          tone === "critical" && { color: theme.color.critical },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  greeting: {
    fontSize: theme.font.size.xl,
    fontWeight: "700",
    color: theme.color.navy900,
  },
  sub: {
    fontSize: theme.font.size.sm,
    color: theme.color.inkMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  muted: { color: theme.color.inkSubtle, fontSize: theme.font.size.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: {
    width: "47%",
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 14,
  },
  statLabel: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: theme.font.size.lg,
    fontWeight: "700",
    color: theme.color.navy900,
    marginTop: 6,
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 16,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: theme.font.size.sm,
    fontWeight: "700",
    color: theme.color.navy900,
    marginBottom: 10,
  },
  rowLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  rowLabel: { color: theme.color.inkMuted, fontSize: theme.font.size.base },
  rowValue: {
    color: theme.color.navy900,
    fontWeight: "600",
    fontSize: theme.font.size.base,
  },
  healthScore: {
    fontSize: theme.font.size.xxl,
    fontWeight: "700",
    color: theme.color.navy900,
  },
  retry: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
  },
  retryText: { color: theme.color.navy900, fontWeight: "600" },
});

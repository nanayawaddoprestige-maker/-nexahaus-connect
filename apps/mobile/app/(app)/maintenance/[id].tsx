import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { date, money, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface MoneyView {
  minor: string;
  currency: string;
}

interface MaintenanceDetail {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  property: { id: string; name: string };
  unit: { id: string; label: string } | null;
  estimatedCost: MoneyView | null;
  approvedCost: MoneyView | null;
  actualCost: MoneyView | null;
  scheduledFor: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
  reportedBy: { type: string; tenant: { fullName: string } | null };
  workOrders: {
    id: string;
    ref: string;
    status: string;
    vendor: { name: string } | null;
    cost: MoneyView | null;
    completionNotes: string | null;
  }[];
  timeline: {
    from: string | null;
    to: string;
    note: string | null;
    at: string;
  }[];
}

export default function MaintenanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["maintenance", id],
    queryFn: () => api.get<MaintenanceDetail>(`/maintenance/${id}`),
    retry: false,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          {notFound ? "Request not found." : "We couldn't load this request."}
        </Text>
        {!notFound ? (
          <Pressable onPress={() => void refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.badge}>{titleCase(data.status)}</Text>
      </View>
      <Text style={styles.sub}>
        {data.ref} · {data.property.name}
        {data.unit ? ` · ${data.unit.label}` : ""} · {titleCase(data.category)}{" "}
        · {titleCase(data.priority)} priority
      </Text>

      {data.status === "AWAITING_APPROVAL" ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            This request is waiting for your approval of the estimated cost.
          </Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <Stat
          label="Estimated"
          value={money(data.estimatedCost?.minor, data.estimatedCost?.currency)}
        />
        <Stat
          label="Approved"
          value={money(data.approvedCost?.minor, data.approvedCost?.currency)}
        />
        <Stat
          label="Actual"
          value={money(data.actualCost?.minor, data.actualCost?.currency)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <Text style={styles.description}>{data.description}</Text>
        <Row
          label="Reported by"
          value={
            data.reportedBy.tenant?.fullName ?? titleCase(data.reportedBy.type)
          }
        />
        <Row label="Scheduled" value={date(data.scheduledFor)} />
        <Row label="Completed" value={date(data.completedAt)} />
        <Row label="Verified" value={date(data.verifiedAt)} />
      </View>

      {data.workOrders.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Work orders</Text>
          {data.workOrders.map((w) => (
            <View key={w.id} style={styles.workOrderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workOrderText}>
                  {w.ref}
                  {w.vendor ? ` · ${w.vendor.name}` : ""}
                </Text>
                {w.completionNotes ? (
                  <Text style={styles.workOrderNotes}>{w.completionNotes}</Text>
                ) : null}
              </View>
              <Text style={styles.workOrderCost}>
                {money(w.cost?.minor, w.cost?.currency)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.timeline.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>History</Text>
          {data.timeline.map((t, i) => (
            <View key={i} style={styles.timelineRow}>
              <Text style={styles.timelineStatus}>
                {t.from ? `${titleCase(t.from)} → ` : ""}
                {titleCase(t.to)}
              </Text>
              <Text style={styles.timelineDate}>{date(t.at)}</Text>
              {t.note ? (
                <Text style={styles.timelineNote}>{t.note}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowLine}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.surfaceSunken,
    padding: 24,
  },
  muted: { color: theme.color.inkSubtle, fontSize: theme.font.size.sm },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontSize: theme.font.size.lg,
    fontWeight: "700",
    color: theme.color.navy900,
    flexShrink: 1,
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
    fontSize: theme.font.size.sm,
    color: theme.color.inkSubtle,
    marginTop: 4,
    marginBottom: 16,
  },
  notice: {
    backgroundColor: "#fffbeb",
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    color: theme.color.warning,
    fontSize: theme.font.size.sm,
    fontWeight: "600",
  },
  grid: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
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
    fontSize: theme.font.size.base,
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
  description: {
    fontSize: theme.font.size.base,
    color: theme.color.ink,
    marginBottom: 10,
  },
  rowLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  rowLabel: { color: theme.color.inkMuted, fontSize: theme.font.size.sm },
  rowValue: {
    color: theme.color.navy900,
    fontWeight: "600",
    fontSize: theme.font.size.sm,
  },
  workOrderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  workOrderText: {
    fontSize: theme.font.size.sm,
    color: theme.color.navy900,
    fontWeight: "600",
  },
  workOrderNotes: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 2,
  },
  workOrderCost: {
    fontSize: theme.font.size.sm,
    fontWeight: "700",
    color: theme.color.navy900,
  },
  timelineRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  timelineStatus: {
    fontSize: theme.font.size.sm,
    fontWeight: "600",
    color: theme.color.navy900,
  },
  timelineDate: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 2,
  },
  timelineNote: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkMuted,
    marginTop: 4,
  },
  retry: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
  },
  retryText: { color: theme.color.navy900, fontWeight: "600" },
});

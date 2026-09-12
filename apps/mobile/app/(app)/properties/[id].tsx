import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { date, money, percent, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface MoneyView {
  minor: string;
  currency: string;
}

interface PropertyDetail {
  id: string;
  ref: string;
  name: string;
  type: string;
  status: string;
  address: { line: string; city: string; region: string; country: string };
  client: { id: string; ref: string; displayName: string };
  counts: { units: number; openMaintenance: number; inspections: number };
  occupancy: { total: number; occupied: number; rate: number };
  finance: {
    currency: string;
    expectedRentMinor: string;
    collectedRentMinor: string;
    outstandingRentMinor: string;
  };
  diaspora: {
    lastInspectedAt: string | null;
    lastRentReceivedAt: string | null;
  };
  healthScore: { score: number; scoredAt: string } | null;
  agreement: {
    feeType: string;
    feePercent: number | null;
    feeFixed: MoneyView | null;
    maintenanceApprovalThreshold: MoneyView;
    status: string;
  } | null;
}

interface UnitRow {
  id: string;
  label: string;
  status: string;
  activeLease: {
    rent: MoneyView;
    endDate: string;
    tenant: { fullName: string } | null;
  } | null;
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["property", id],
    queryFn: () => api.get<PropertyDetail>(`/properties/${id}`),
    retry: false,
  });

  const units = useQuery({
    queryKey: ["property", id, "units"],
    queryFn: () => api.get<UnitRow[]>(`/properties/${id}/units`),
    enabled: !!data,
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
          {notFound ? "Property not found." : "We couldn't load this property."}
        </Text>
        {!notFound ? (
          <Pressable onPress={() => void refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const fee =
    data.agreement == null
      ? "—"
      : data.agreement.feeType === "FIXED_MONTHLY"
        ? `${money(data.agreement.feeFixed?.minor, data.agreement.feeFixed?.currency)} / month`
        : `${data.agreement.feePercent ?? 0}% of rent`;

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
      <View style={styles.headerRow}>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={styles.badge}>{titleCase(data.status)}</Text>
      </View>
      <Text style={styles.sub}>
        {data.ref} · {titleCase(data.type)} · {data.address.line},{" "}
        {data.address.city}
      </Text>

      <View style={styles.stripCard}>
        <StripItem
          label="Last inspected"
          value={date(data.diaspora.lastInspectedAt)}
        />
        <StripItem
          label="Last rent received"
          value={date(data.diaspora.lastRentReceivedAt)}
        />
        <StripItem
          label="Property health"
          value={
            data.healthScore ? `${data.healthScore.score}/100` : "Not scored"
          }
        />
      </View>

      <View style={styles.grid}>
        <Stat label="Occupancy" value={percent(data.occupancy.rate)} />
        <Stat
          label="Expected"
          value={money(data.finance.expectedRentMinor, data.finance.currency)}
        />
        <Stat
          label="Collected"
          value={money(data.finance.collectedRentMinor, data.finance.currency)}
        />
        <Stat
          label="Outstanding"
          value={money(
            data.finance.outstandingRentMinor,
            data.finance.currency,
          )}
          tone={
            data.finance.outstandingRentMinor === "0" ? undefined : "warning"
          }
        />
      </View>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/maintenance",
            params: { propertyId: data.id },
          })
        }
        style={styles.linkCard}
      >
        <Text style={styles.linkCardText}>
          Open maintenance: {data.counts.openMaintenance}
        </Text>
        <Text style={styles.linkCardChevron}>›</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Management</Text>
        <Row label="Managing client" value={data.client.displayName} />
        <Row label="Management fee" value={fee} />
        <Row
          label="Agreement"
          value={
            data.agreement ? titleCase(data.agreement.status) : "None on file"
          }
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Units & tenancies ({data.counts.units})
        </Text>
        {units.isLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : units.data && units.data.length > 0 ? (
          units.data.map((u) => (
            <View key={u.id} style={styles.unitRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.unitLabel}>{u.label}</Text>
                <Text style={styles.unitSub}>
                  {u.activeLease?.tenant?.fullName ?? "Vacant"}
                </Text>
              </View>
              <Text style={styles.unitRent}>
                {u.activeLease
                  ? money(u.activeLease.rent.minor, u.activeLease.rent.currency)
                  : "—"}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>No units recorded yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function StripItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.stripLabel}>{label}</Text>
      <Text style={styles.stripValue}>{value}</Text>
    </View>
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
    fontSize: theme.font.size.xl,
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
  stripCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 14,
    marginBottom: 16,
  },
  stripLabel: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
  },
  stripValue: {
    fontSize: theme.font.size.sm,
    fontWeight: "600",
    color: theme.color.navy900,
    marginTop: 4,
  },
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
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 16,
    marginTop: 16,
  },
  linkCardText: {
    fontSize: theme.font.size.base,
    fontWeight: "600",
    color: theme.color.navy900,
  },
  linkCardChevron: {
    fontSize: theme.font.size.lg,
    color: theme.color.inkSubtle,
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
  unitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  unitLabel: {
    fontSize: theme.font.size.base,
    fontWeight: "600",
    color: theme.color.navy900,
  },
  unitSub: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 2,
  },
  unitRent: {
    fontSize: theme.font.size.sm,
    fontWeight: "700",
    color: theme.color.navy900,
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

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { date, money, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface OwnerFinancials {
  currency: string;
  grossRentalIncomeMinor: string;
  managementFeesMinor: string;
  managementFeesProjected: boolean;
  maintenanceExpensesMinor: string;
  otherExpensesMinor: string;
  netOwnerIncomeMinor: string;
  outstandingRentMinor: string;
  vacancyLossMinor: string;
}

interface PaymentRow {
  id: string;
  amount: { minor: string; currency: string };
  method: string;
  status: string;
  receivedAt: string;
  property: { name: string } | null;
}

interface StatementRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  property: string;
  currency: string;
  netAmountMinor: string;
  status: string;
}

const PERIODS = [
  { value: "this_month", label: "This month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
] as const;

export default function Finance() {
  const [period, setPeriod] =
    useState<(typeof PERIODS)[number]["value"]>("this_month");

  const fin = useQuery({
    queryKey: ["finance", "owner", period],
    queryFn: () =>
      api.get<OwnerFinancials>("/dashboard/owner/financials", { period }),
  });
  const payments = useQuery({
    queryKey: ["finance", "payments"],
    queryFn: () =>
      api
        .get<PaymentRow[]>("/payments", { pageSize: 10 })
        .catch(() => [] as PaymentRow[]),
  });
  const statements = useQuery({
    queryKey: ["finance", "statements"],
    queryFn: () =>
      api
        .get<StatementRow[]>("/statements", { pageSize: 12 })
        .catch(() => [] as StatementRow[]),
  });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            void fin.refetch();
            void payments.refetch();
            void statements.refetch();
          }}
        />
      }
    >
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => setPeriod(p.value)}
            style={[
              styles.periodButton,
              period === p.value && styles.periodButtonActive,
            ]}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === p.value && styles.periodButtonTextActive,
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {fin.isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : fin.isError || !fin.data ? (
        <Text style={styles.muted}>We couldn't load your finances.</Text>
      ) : (
        <>
          <View style={styles.grid}>
            <Stat
              label="Gross rental income"
              value={money(fin.data.grossRentalIncomeMinor, fin.data.currency)}
            />
            <Stat
              label="Management fees"
              value={money(fin.data.managementFeesMinor, fin.data.currency)}
            />
            <Stat
              label="Maintenance"
              value={money(
                fin.data.maintenanceExpensesMinor,
                fin.data.currency,
              )}
            />
            <Stat
              label="Other expenses"
              value={money(fin.data.otherExpensesMinor, fin.data.currency)}
            />
          </View>

          <View style={styles.netCard}>
            <Text style={styles.netLabel}>Net owner income</Text>
            <Text style={styles.netValue}>
              {money(fin.data.netOwnerIncomeMinor, fin.data.currency)}
            </Text>
            <Text style={styles.netHint}>
              gross rent − management fees − maintenance − other approved
              expenses
            </Text>
          </View>

          <View style={styles.grid}>
            <Stat
              label="Outstanding rent"
              value={money(fin.data.outstandingRentMinor, fin.data.currency)}
              tone={
                fin.data.outstandingRentMinor === "0" ? undefined : "warning"
              }
            />
            <Stat
              label="Vacancy loss"
              value={money(fin.data.vacancyLossMinor, fin.data.currency)}
            />
          </View>
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent payments</Text>
        {payments.isLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : (payments.data ?? []).length === 0 ? (
          <Text style={styles.muted}>No payments recorded yet.</Text>
        ) : (
          payments.data!.map((p) => (
            <View key={p.id} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listRowTitle}>
                  {money(p.amount.minor, p.amount.currency)}{" "}
                  <Text style={styles.listRowMethod}>
                    {titleCase(p.method)}
                  </Text>
                </Text>
                <Text style={styles.listRowSub}>
                  {p.property?.name ?? "—"} · {date(p.receivedAt)}
                </Text>
              </View>
              <Text style={styles.badge}>{titleCase(p.status)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Statements</Text>
        {statements.isLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : (statements.data ?? []).length === 0 ? (
          <Text style={styles.muted}>
            Monthly statements appear here once NexaHaus generates them.
          </Text>
        ) : (
          statements.data!.map((s) => (
            <Link key={s.id} href={`/more/finance/${s.id}`} asChild>
              <Pressable style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>
                    {date(s.periodStart)} – {date(s.periodEnd)}
                  </Text>
                  <Text style={styles.listRowSub}>
                    {s.property} · net {money(s.netAmountMinor, s.currency)}
                  </Text>
                </View>
                <Text style={styles.badge}>{titleCase(s.status)}</Text>
              </Pressable>
            </Link>
          ))
        )}
      </View>
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
  tone?: "warning";
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text
        style={[
          styles.statValue,
          tone === "warning" && { color: theme.color.warning },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 4,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  periodButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  periodButtonActive: { backgroundColor: theme.color.navy900 },
  periodButtonText: {
    fontSize: theme.font.size.xs,
    fontWeight: "600",
    color: theme.color.inkMuted,
  },
  periodButtonTextActive: { color: "#fff" },
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
    fontSize: theme.font.size.base,
    fontWeight: "700",
    color: theme.color.navy900,
    marginTop: 6,
  },
  netCard: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 16,
    marginVertical: 12,
  },
  netLabel: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    letterSpacing: 0.5,
  },
  netValue: {
    fontSize: theme.font.size.xxl,
    fontWeight: "700",
    color: theme.color.navy900,
    marginTop: 6,
  },
  netHint: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 4,
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
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  listRowTitle: {
    fontSize: theme.font.size.sm,
    fontWeight: "600",
    color: theme.color.navy900,
  },
  listRowMethod: {
    fontSize: theme.font.size.xs,
    fontWeight: "400",
    color: theme.color.inkSubtle,
  },
  listRowSub: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 2,
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

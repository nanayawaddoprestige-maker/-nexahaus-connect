import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { money, percent } from "@/lib/format";
import { theme } from "@/lib/theme";

interface TabularReport {
  title: string;
  columns: {
    key: string;
    label: string;
    kind?: "money" | "number" | "percent" | "text";
  }[];
  rows: Record<string, string | number>[];
  notes?: string[];
}

const REPORT_KINDS = [
  { value: "portfolio-summary", label: "Portfolio summary" },
  { value: "rent-collection", label: "Rent collection" },
  { value: "outstanding-rent", label: "Outstanding rent" },
  { value: "expenses", label: "Expenses" },
  { value: "occupancy", label: "Occupancy" },
  { value: "maintenance", label: "Maintenance" },
  { value: "asset-performance", label: "Asset performance" },
] as const;

const PERIODS = [
  { value: "this_month", label: "This month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
] as const;

function cell(value: string | number, kind?: string): string {
  if (kind === "money") return money(String(value), "GHS");
  if (kind === "percent") return percent(Number(value));
  return String(value);
}

export default function Reports() {
  const [kind, setKind] = useState<string>(REPORT_KINDS[0].value);
  const [period, setPeriod] = useState<string>("this_month");

  const report = useQuery({
    queryKey: ["report", kind, period],
    queryFn: () => api.get<TabularReport>(`/reports/owner/${kind}`, { period }),
  });

  const r = report.data;

  return (
    <ScrollView
      style={styles.root}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => void report.refetch()}
        />
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={{ marginTop: 16 }}
      >
        {REPORT_KINDS.map((k) => (
          <Pressable
            key={k.value}
            onPress={() => setKind(k.value)}
            style={[styles.chip, kind === k.value && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                kind === k.value && styles.chipTextActive,
              ]}
            >
              {k.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

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

      {report.isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : report.isError ? (
        <Text style={styles.muted}>We couldn't load this report.</Text>
      ) : !r || r.columns.length === 0 ? (
        <Text style={styles.muted}>No data for this report and period.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{r.title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.tableHeaderRow}>
                {r.columns.map((c) => (
                  <Text
                    key={c.key}
                    style={[
                      styles.tableHeaderCell,
                      c.kind && c.kind !== "text" && styles.numericCell,
                    ]}
                  >
                    {c.label}
                  </Text>
                ))}
              </View>
              {r.rows.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  {r.columns.map((c) => (
                    <Text
                      key={c.key}
                      style={[
                        styles.tableCell,
                        c.kind && c.kind !== "text" && styles.numericCell,
                      ]}
                    >
                      {cell(row[c.key] ?? "", c.kind)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          {r.notes?.length ? (
            <View style={styles.notes}>
              {r.notes.map((n, i) => (
                <Text key={i} style={styles.noteText}>
                  {n}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken, padding: 16 },
  chipRow: { gap: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surface,
  },
  chipActive: {
    backgroundColor: theme.color.navy900,
    borderColor: theme.color.navy900,
  },
  chipText: {
    fontSize: theme.font.size.xs,
    fontWeight: "600",
    color: theme.color.inkMuted,
  },
  chipTextActive: { color: "#fff" },
  periodRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 4,
    marginTop: 12,
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
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: theme.font.size.sm,
    fontWeight: "700",
    color: theme.color.navy900,
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.color.line,
    paddingBottom: 8,
  },
  tableHeaderCell: {
    minWidth: 110,
    fontSize: 10.5,
    fontWeight: "600",
    color: theme.color.inkSubtle,
    textTransform: "uppercase",
    paddingRight: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.color.line,
    paddingVertical: 10,
  },
  tableCell: {
    minWidth: 110,
    fontSize: theme.font.size.sm,
    color: theme.color.inkMuted,
    paddingRight: 16,
  },
  numericCell: {
    textAlign: "right",
    color: theme.color.navy900,
    fontVariant: ["tabular-nums"],
  },
  notes: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  noteText: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 2,
  },
});

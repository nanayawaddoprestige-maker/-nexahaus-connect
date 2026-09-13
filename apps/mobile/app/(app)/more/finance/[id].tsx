import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { date, money, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface StatementDetail {
  id: string;
  status: string;
  property: { id: string; name: string } | null;
  periodStart: string;
  periodEnd: string;
  currency: string;
  openingBalanceMinor: string;
  grossRentalIncomeMinor: string;
  managementFeesMinor: string;
  maintenanceExpensesMinor: string;
  otherExpensesMinor: string;
  netAmountMinor: string;
  distributionsMinor: string;
  closingBalanceMinor: string;
  pdfDocumentId: string | null;
  lines: {
    occurredAt: string;
    description: string;
    direction: "CREDIT" | "DEBIT";
    amountMinor: string;
  }[];
}

export default function StatementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["statement", id],
    queryFn: () => api.get<StatementDetail>(`/statements/${id}`),
    retry: false,
  });

  const download = useMutation({
    mutationFn: () =>
      api.get<{ url: string }>(
        `/documents/${data!.pdfDocumentId}/download-url`,
      ),
    onSuccess: (res) => void Linking.openURL(res.url),
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
          {notFound
            ? "Statement not found."
            : "We couldn't load this statement."}
        </Text>
        {!notFound ? (
          <Pressable onPress={() => void refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const c = data.currency;
  const rows: [string, string, boolean?][] = [
    ["Opening balance", money(data.openingBalanceMinor, c), true],
    ["Gross rental income", money(data.grossRentalIncomeMinor, c)],
    ["Management fees", `− ${money(data.managementFeesMinor, c)}`],
    ["Maintenance expenses", `− ${money(data.maintenanceExpensesMinor, c)}`],
    ["Other approved expenses", `− ${money(data.otherExpensesMinor, c)}`],
    ["Net for the period", money(data.netAmountMinor, c), true],
    ["Owner distributions", `− ${money(data.distributionsMinor, c)}`],
    ["Closing balance", money(data.closingBalanceMinor, c), true],
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Owner statement</Text>
        <Text style={styles.badge}>{titleCase(data.status)}</Text>
      </View>
      <Text style={styles.sub}>
        {data.property?.name ?? "Portfolio"} · {date(data.periodStart)} –{" "}
        {date(data.periodEnd)}
      </Text>

      {data.pdfDocumentId ? (
        <Pressable
          onPress={() => download.mutate()}
          disabled={download.isPending}
          style={styles.downloadButton}
        >
          <Text style={styles.downloadButtonText}>
            {download.isPending ? "Opening…" : "Download PDF"}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.card}>
        {rows.map(([label, value, bold]) => (
          <View
            key={label}
            style={[styles.summaryRow, bold && styles.summaryRowBold]}
          >
            <Text
              style={[styles.summaryLabel, bold && styles.summaryLabelBold]}
            >
              {label}
            </Text>
            <Text
              style={[styles.summaryValue, bold && styles.summaryLabelBold]}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transactions ({data.lines.length})</Text>
        {data.lines.map((l, i) => (
          <View key={i} style={styles.lineRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineDescription}>{l.description}</Text>
              <Text style={styles.lineDate}>{date(l.occurredAt)}</Text>
            </View>
            <Text
              style={[
                styles.lineAmount,
                l.direction === "CREDIT" && { color: theme.color.positive },
              ]}
            >
              {l.direction === "CREDIT" ? "" : "− "}
              {money(l.amountMinor, c)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>
        Every figure above is computed from recorded transactions and is not
        adjusted manually. Contact NexaHaus with any query about a line item.
      </Text>
    </ScrollView>
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
  },
  downloadButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surface,
  },
  downloadButtonText: {
    fontSize: theme.font.size.sm,
    fontWeight: "600",
    color: theme.color.navy900,
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryRowBold: {
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    paddingTop: 10,
    marginTop: 4,
  },
  summaryLabel: { fontSize: theme.font.size.sm, color: theme.color.inkMuted },
  summaryLabelBold: { fontWeight: "700", color: theme.color.navy900 },
  summaryValue: {
    fontSize: theme.font.size.sm,
    color: theme.color.inkMuted,
    fontWeight: "600",
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  lineDescription: {
    fontSize: theme.font.size.sm,
    color: theme.color.navy900,
  },
  lineDate: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 2,
  },
  lineAmount: {
    fontSize: theme.font.size.sm,
    fontWeight: "700",
    color: theme.color.navy900,
  },
  footnote: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 16,
    marginBottom: 8,
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

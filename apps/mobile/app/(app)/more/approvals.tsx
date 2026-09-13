import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { date, money, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface MoneyView {
  minor: string;
  currency: string;
}

interface ApprovalRow {
  id: string;
  ref: string;
  type: string;
  status: string;
  property: { id: string; name: string } | null;
  amount: MoneyView | null;
  threshold: MoneyView | null;
  requestedBy: { id: string; fullName: string } | null;
  dueAt: string | null;
  createdAt: string;
}

type Tab = "PENDING" | "ALL";

export default function Approvals() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["approvals", tab],
    queryFn: () =>
      api
        .get<ApprovalRow[]>("/approvals", {
          status: tab === "PENDING" ? "PENDING" : undefined,
          pageSize: 50,
        })
        .catch(() => [] as ApprovalRow[]),
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
        <View style={styles.tabRow}>
          {(["PENDING", "ALL"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  tab === t && styles.tabButtonTextActive,
                ]}
              >
                {t === "PENDING" ? "Pending" : "All"}
              </Text>
            </Pressable>
          ))}
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.muted}>
          {isLoading
            ? "Loading…"
            : isError
              ? "We couldn't load approvals."
              : tab === "PENDING"
                ? "Nothing needs your decision."
                : "No approvals yet."}
        </Text>
      }
      renderItem={({ item }) => (
        <ApprovalCard
          approval={item}
          onDecided={() =>
            void qc.invalidateQueries({ queryKey: ["approvals"] })
          }
        />
      )}
    />
  );
}

function ApprovalCard({
  approval,
  onDecided,
}: {
  approval: ApprovalRow;
  onDecided: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const decide = useMutation({
    mutationFn: (decision: "APPROVED" | "DECLINED" | "INFO_REQUESTED") =>
      api.post(`/approvals/${approval.id}/decision`, {
        decision,
        note: note || undefined,
      }),
    onSuccess: onDecided,
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });

  const pending =
    approval.status === "PENDING" || approval.status === "INFO_REQUESTED";

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.refRow}>
            <Text style={styles.ref}>{approval.ref}</Text>
            <Text style={styles.badge}>{titleCase(approval.status)}</Text>
          </View>
          <Text style={styles.type}>
            {titleCase(approval.type)}
            {approval.property ? ` · ${approval.property.name}` : ""}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.amount}>
            {money(approval.amount?.minor, approval.amount?.currency)}
          </Text>
          {approval.threshold ? (
            <Text style={styles.thresholdText}>
              threshold{" "}
              {money(approval.threshold.minor, approval.threshold.currency)}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          Requested by {approval.requestedBy?.fullName ?? "NexaHaus"} ·{" "}
          {date(approval.createdAt)}
          {approval.dueAt ? ` · needed by ${date(approval.dueAt)}` : ""}
        </Text>
      </View>

      {pending ? (
        <View style={styles.actions}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional — required if requesting more information)"
            multiline
            style={styles.noteInput}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.buttonRow}>
            <Pressable
              disabled={decide.isPending}
              onPress={() => decide.mutate("APPROVED")}
              style={[styles.button, styles.buttonPrimary]}
            >
              <Text style={styles.buttonTextPrimary}>Approve</Text>
            </Pressable>
            <Pressable
              disabled={decide.isPending}
              onPress={() => decide.mutate("DECLINED")}
              style={[styles.button, styles.buttonDanger]}
            >
              <Text style={styles.buttonTextPrimary}>Decline</Text>
            </Pressable>
            <Pressable
              disabled={decide.isPending}
              onPress={() => {
                if (!note.trim()) {
                  setError(
                    "Please add a note when requesting more information.",
                  );
                  return;
                }
                decide.mutate("INFO_REQUESTED");
              }}
              style={[styles.button, styles.buttonSecondary]}
            >
              <Text style={styles.buttonTextSecondary}>Ask for info</Text>
            </Pressable>
          </View>
        </View>
      ) : approval.status !== "PENDING" ? (
        <Text style={styles.decidedText}>
          {titleCase(approval.status)}
          {approval.dueAt ? ` · was due ${date(approval.dueAt)}` : ""}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  tabRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 4,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  tabButton: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  tabButtonActive: { backgroundColor: theme.color.navy900 },
  tabButtonText: {
    fontSize: theme.font.size.xs,
    fontWeight: "600",
    color: theme.color.inkMuted,
  },
  tabButtonTextActive: { color: "#fff" },
  muted: { color: theme.color.inkSubtle, fontSize: theme.font.size.sm },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  refRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ref: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
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
  type: {
    fontSize: theme.font.size.base,
    fontWeight: "600",
    color: theme.color.navy900,
    marginTop: 4,
  },
  amount: {
    fontSize: theme.font.size.lg,
    fontWeight: "700",
    color: theme.color.navy900,
  },
  thresholdText: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 2,
  },
  metaRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  metaText: { fontSize: theme.font.size.xs, color: theme.color.inkSubtle },
  actions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    padding: 10,
    fontSize: theme.font.size.sm,
    color: theme.color.ink,
    minHeight: 44,
    textAlignVertical: "top",
  },
  error: {
    color: theme.color.critical,
    fontSize: theme.font.size.xs,
    marginTop: 8,
  },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
  },
  buttonPrimary: { backgroundColor: theme.color.navy900 },
  buttonDanger: { backgroundColor: theme.color.critical },
  buttonSecondary: { borderWidth: 1, borderColor: theme.color.line },
  buttonTextPrimary: {
    color: "#fff",
    fontWeight: "600",
    fontSize: theme.font.size.sm,
  },
  buttonTextSecondary: {
    color: theme.color.navy900,
    fontWeight: "600",
    fontSize: theme.font.size.sm,
  },
  decidedText: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    fontSize: theme.font.size.sm,
    color: theme.color.inkSubtle,
  },
});

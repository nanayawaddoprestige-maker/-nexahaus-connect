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
import { date, titleCase } from "@/lib/format";
import { theme } from "@/lib/theme";

interface InspectionDetail {
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
  items: {
    id: string;
    area: string;
    label: string;
    rating: string;
    note: string | null;
    recommendation: string | null;
  }[];
}

const RATING_COLOR: Record<string, string> = {
  GOOD: theme.color.positive,
  ATTENTION_REQUIRED: theme.color.warning,
  URGENT: theme.color.critical,
};

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["inspection", id],
    queryFn: () => api.get<InspectionDetail>(`/inspections/${id}`),
    retry: false,
  });

  const download = useMutation({
    mutationFn: () =>
      api.get<{ url: string }>(
        `/documents/${data!.reportDocumentId}/download-url`,
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
            ? "Inspection not found."
            : "We couldn't load this inspection."}
        </Text>
        {!notFound ? (
          <Pressable onPress={() => void refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const byArea = data.items.reduce<Record<string, typeof data.items>>(
    (acc, it) => {
      (acc[it.area] ??= []).push(it);
      return acc;
    },
    {},
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{titleCase(data.type)} inspection</Text>
        <Text style={styles.badge}>{titleCase(data.status)}</Text>
      </View>
      <Text style={styles.sub}>
        {data.ref} · {data.property.name}
        {data.inspector ? ` · ${data.inspector.fullName}` : ""}
      </Text>

      {data.reportDocumentId ? (
        <Pressable
          onPress={() => download.mutate()}
          disabled={download.isPending}
          style={styles.downloadButton}
        >
          <Text style={styles.downloadButtonText}>
            {download.isPending ? "Opening…" : "Download report (PDF)"}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.stripCard}>
        <StripItem label="Scheduled" value={date(data.scheduledFor)} />
        <StripItem label="Completed" value={date(data.completedAt)} />
        <StripItem
          label="Overall condition"
          value={data.overallCondition ? titleCase(data.overallCondition) : "—"}
        />
      </View>

      {data.items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            This inspection has not been carried out yet.
          </Text>
        </View>
      ) : (
        Object.entries(byArea).map(([area, items]) => (
          <View key={area} style={styles.card}>
            <Text style={styles.cardTitle}>{titleCase(area)}</Text>
            {items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemLabel}>{it.label}</Text>
                  <Text
                    style={[
                      styles.itemRating,
                      {
                        color: RATING_COLOR[it.rating] ?? theme.color.inkMuted,
                      },
                    ]}
                  >
                    {titleCase(it.rating)}
                  </Text>
                </View>
                {it.note ? (
                  <Text style={styles.itemNote}>{it.note}</Text>
                ) : null}
                {it.recommendation ? (
                  <Text style={styles.itemRecommendation}>
                    Recommendation: {it.recommendation}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ))
      )}
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
  stripCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 14,
    marginTop: 16,
  },
  stripLabel: { fontSize: theme.font.size.xs, color: theme.color.inkSubtle },
  stripValue: {
    fontSize: theme.font.size.sm,
    fontWeight: "600",
    color: theme.color.navy900,
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
  itemRow: {
    borderLeftWidth: 2,
    borderLeftColor: theme.color.line,
    paddingLeft: 10,
    marginBottom: 10,
  },
  itemTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemLabel: {
    fontSize: theme.font.size.sm,
    fontWeight: "600",
    color: theme.color.navy900,
  },
  itemRating: { fontSize: theme.font.size.xs, fontWeight: "700" },
  itemNote: {
    fontSize: theme.font.size.sm,
    color: theme.color.inkMuted,
    marginTop: 2,
  },
  itemRecommendation: {
    fontSize: theme.font.size.xs,
    fontStyle: "italic",
    color: theme.color.inkSubtle,
    marginTop: 2,
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

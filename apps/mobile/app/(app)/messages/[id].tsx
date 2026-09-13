import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { date } from "@/lib/format";
import { theme } from "@/lib/theme";

interface ThreadDetail {
  id: string;
  title: string;
  participants: { userId: string; name: string }[];
  messages: {
    id: string;
    body: string;
    sender: { id: string; fullName: string };
    fromMe: boolean;
    createdAt: string;
  }[];
}

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["messages", "thread", id],
    queryFn: () => api.get<ThreadDetail>(`/messages/threads/${id}`),
    enabled: !!id,
  });

  const send = useMutation({
    mutationFn: (body: string) =>
      api.post(`/messages/threads/${id}/messages`, { body }),
    onSuccess: () => {
      setDraft("");
      void qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  useEffect(() => {
    if (id) void api.post(`/messages/threads/${id}/read`).catch(() => {});
  }, [id]);

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const messages = [...data.messages].reverse();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item: m }) => (
          <View style={[styles.bubbleRow, m.fromMe && styles.bubbleRowMe]}>
            <View style={[styles.bubble, m.fromMe && styles.bubbleMe]}>
              {!m.fromMe ? (
                <Text style={styles.senderName}>{m.sender.fullName}</Text>
              ) : null}
              <Text
                style={[styles.bubbleText, m.fromMe && styles.bubbleTextMe]}
              >
                {m.body}
              </Text>
              <Text
                style={[styles.bubbleTime, m.fromMe && styles.bubbleTimeMe]}
              >
                {date(m.createdAt)}
              </Text>
            </View>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message…"
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={() => {
            if (draft.trim()) send.mutate(draft.trim());
          }}
          disabled={!draft.trim() || send.isPending}
          style={[
            styles.sendButton,
            (!draft.trim() || send.isPending) && { opacity: 0.5 },
          ]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.surfaceSunken,
  },
  muted: { color: theme.color.inkSubtle, fontSize: theme.font.size.sm },
  bubbleRow: { marginBottom: 10, alignItems: "flex-start" },
  bubbleRowMe: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "80%",
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 12,
  },
  bubbleMe: {
    backgroundColor: theme.color.navy900,
    borderColor: theme.color.navy900,
  },
  senderName: {
    fontSize: theme.font.size.xs,
    fontWeight: "600",
    color: theme.color.inkSubtle,
    marginBottom: 2,
  },
  bubbleText: { fontSize: theme.font.size.sm, color: theme.color.ink },
  bubbleTextMe: { color: "#fff" },
  bubbleTime: {
    fontSize: 10,
    color: theme.color.inkSubtle,
    marginTop: 4,
  },
  bubbleTimeMe: { color: theme.color.navy100 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    backgroundColor: theme.color.surface,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: theme.font.size.base,
    color: theme.color.ink,
  },
  sendButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.navy900,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});

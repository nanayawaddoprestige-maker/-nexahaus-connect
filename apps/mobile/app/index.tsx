import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { theme } from "@/lib/theme";

export default function Splash() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.replace("/(app)/dashboard");
    else if (status === "unauthenticated") router.replace("/login");
  }, [status]);

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>NexaHaus Connect</Text>
      <Text style={styles.tag}>Managing Properties. Maximizing Assets.</Text>
      <ActivityIndicator color={theme.color.gold400} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.navy900,
    padding: 24,
  },
  brand: { color: "#fff", fontSize: theme.font.size.xl, fontWeight: "700" },
  tag: { color: theme.color.navy100, fontSize: theme.font.size.sm, marginTop: 8 },
});

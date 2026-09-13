import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Tabs, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { theme } from "@/lib/theme";

export default function AppLayout() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status]);

  if (status !== "authenticated") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.color.navy700} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.navy900 },
        headerTintColor: "#fff",
        tabBarActiveTintColor: theme.color.navy900,
        tabBarInactiveTintColor: theme.color.inkSubtle,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Home" }} />
      <Tabs.Screen
        name="properties"
        options={{ title: "Properties", headerShown: false }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{ title: "Maintenance", headerShown: false }}
      />
      <Tabs.Screen name="approvals" options={{ title: "Approvals" }} />
      <Tabs.Screen
        name="messages"
        options={{ title: "Messages", headerShown: false }}
      />
      <Tabs.Screen name="notifications" options={{ title: "Notifications" }} />
      <Tabs.Screen
        name="inspections"
        options={{ title: "Inspections", headerShown: false }}
      />
      <Tabs.Screen
        name="finance"
        options={{ title: "Finance", headerShown: false }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.surfaceSunken,
  },
});

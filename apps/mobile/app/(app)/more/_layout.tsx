import { Stack } from "expo-router";
import { theme } from "@/lib/theme";

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.navy900 },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: theme.color.surfaceSunken },
      }}
    >
      <Stack.Screen name="index" options={{ title: "More" }} />
      <Stack.Screen name="approvals" options={{ title: "Approvals" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="reports" options={{ title: "Reports" }} />
      <Stack.Screen name="inspections" options={{ headerShown: false }} />
      <Stack.Screen name="finance" options={{ headerShown: false }} />
    </Stack>
  );
}

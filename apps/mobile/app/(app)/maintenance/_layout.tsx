import { Stack } from "expo-router";
import { theme } from "@/lib/theme";

export default function MaintenanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.navy900 },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: theme.color.surfaceSunken },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Maintenance" }} />
      <Stack.Screen name="[id]" options={{ title: "Request" }} />
    </Stack>
  );
}

import { Stack } from "expo-router";
import { theme } from "@/lib/theme";

export default function PropertiesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.navy900 },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: theme.color.surfaceSunken },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Properties" }} />
      <Stack.Screen name="[id]" options={{ title: "Property" }} />
    </Stack>
  );
}

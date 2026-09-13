import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/lib/auth";
import { theme } from "@/lib/theme";

const ITEMS: {
  href:
    | "/more/approvals"
    | "/more/notifications"
    | "/more/inspections"
    | "/more/finance"
    | "/more/reports";
  label: string;
  description: string;
}[] = [
  {
    href: "/more/approvals",
    label: "Approvals",
    description: "Decisions NexaHaus needs from you.",
  },
  {
    href: "/more/notifications",
    label: "Notifications",
    description: "Updates about your properties.",
  },
  {
    href: "/more/inspections",
    label: "Inspections",
    description: "Scheduled and completed inspections.",
  },
  {
    href: "/more/finance",
    label: "Rent & Finance",
    description: "Income, costs and owner statements.",
  },
  {
    href: "/more/reports",
    label: "Reports",
    description: "Portfolio and property figures on demand.",
  },
];

export default function More() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      {user ? (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{user.fullName}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        {ITEMS.map((item, i) => (
          <Link key={item.href} href={item.href} asChild>
            <Pressable style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowDescription}>{item.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Pressable onPress={() => void logout()} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.surfaceSunken },
  profileCard: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 16,
    marginBottom: 16,
  },
  profileName: {
    fontSize: theme.font.size.lg,
    fontWeight: "700",
    color: theme.color.navy900,
  },
  profileEmail: {
    fontSize: theme.font.size.sm,
    color: theme.color.inkSubtle,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: theme.color.line },
  rowLabel: {
    fontSize: theme.font.size.base,
    fontWeight: "600",
    color: theme.color.navy900,
  },
  rowDescription: {
    fontSize: theme.font.size.xs,
    color: theme.color.inkSubtle,
    marginTop: 2,
  },
  chevron: { fontSize: theme.font.size.lg, color: theme.color.inkSubtle },
  signOut: { marginTop: 24, alignItems: "center", padding: 12 },
  signOutText: { color: theme.color.inkSubtle, fontSize: theme.font.size.sm },
});

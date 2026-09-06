import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { theme } from "@/lib/theme";

export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const result = await login(identifier.trim(), password, mfaCode || undefined);
      if (result.mfaRequired) setMfaRequired(true);
      else router.replace("/(app)/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>NexaHaus Connect</Text>
        <Text style={styles.heroText}>
          Know exactly what is happening with your property — wherever you are.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Sign in</Text>

        <Text style={styles.label}>Email or phone</Text>
        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {mfaRequired ? (
          <>
            <Text style={styles.label}>Authentication code</Text>
            <TextInput
              value={mfaCode}
              onChangeText={(t) => setMfaCode(t.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={submit}
          disabled={busy}
          style={[styles.button, busy && { opacity: 0.6 }]}
        >
          <Text style={styles.buttonText}>
            {busy ? "Please wait…" : mfaRequired ? "Verify and continue" : "Sign in"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.navy900 },
  hero: { padding: 28, paddingTop: 88 },
  brand: { color: "#fff", fontSize: theme.font.size.xl, fontWeight: "700" },
  heroText: {
    color: theme.color.navy100,
    fontSize: theme.font.size.base,
    marginTop: 12,
    lineHeight: 22,
  },
  card: {
    flex: 1,
    backgroundColor: theme.color.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 24,
    padding: 24,
  },
  title: {
    fontSize: theme.font.size.lg,
    fontWeight: "700",
    color: theme.color.navy900,
    marginBottom: 16,
  },
  label: {
    fontSize: theme.font.size.sm,
    fontWeight: "600",
    color: theme.color.navy900,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    fontSize: theme.font.size.base,
    color: theme.color.ink,
  },
  error: { color: theme.color.critical, marginTop: 12, fontSize: theme.font.size.sm },
  button: {
    marginTop: 20,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.navy900,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: theme.font.size.base },
});

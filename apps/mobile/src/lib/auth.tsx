import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@nexahaus/types";
import {
  api,
  setAccessToken,
  storeRefreshToken,
  tryRefresh,
} from "./api";

interface LoginResponse {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken?: string };
  mfaRequired: boolean;
}

interface AuthState {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (identifier: string, password: string, mfaCode?: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await tryRefresh();
      if (cancelled) return;
      if (!ok) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const me = await api.get<AuthUser>("/auth/me");
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) setStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string, mfaCode?: string) => {
      const result = await api.post<LoginResponse>("/auth/login", {
        identifier,
        password,
        ...(mfaCode ? { mfaCode } : {}),
      });
      if (!result.mfaRequired && result.tokens.accessToken) {
        setAccessToken(result.tokens.accessToken);
        if (result.tokens.refreshToken) {
          await storeRefreshToken(result.tokens.refreshToken);
        }
        setUser(result.user);
        setStatus("authenticated");
      }
      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    setAccessToken(null);
    await storeRefreshToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

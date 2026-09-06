"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken } from "./api";
import type { AuthUser, LoginResponse } from "./resources";

interface AuthState {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (identifier: string, password: string, mfaCode?: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  const loadMe = useCallback(async () => {
    try {
      const me = await api.get<AuthUser>("/auth/me");
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  // On mount: try to mint an access token from the refresh cookie, then load /me.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await api.refresh();
      if (cancelled) return;
      if (ok) {
        await loadMe();
      } else {
        setStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe]);

  const login = useCallback(
    async (identifier: string, password: string, mfaCode?: string) => {
      const result = await api.post<LoginResponse>("/auth/login", {
        identifier,
        password,
        ...(mfaCode ? { mfaCode } : {}),
      });
      if (!result.mfaRequired && result.tokens.accessToken) {
        setAccessToken(result.tokens.accessToken);
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
      // ignore — clear locally regardless
    }
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthState>(
    () => ({ user, status, login, logout, refreshUser: loadMe }),
    [user, status, login, logout, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

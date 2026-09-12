import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type {
  ErrorResponse,
  ListResponse,
  SuccessResponse,
} from "@nexahaus/types";

/**
 * Mobile API client. Unlike the web app there is no cookie: the refresh token is
 * kept in the device keychain (expo-secure-store) and sent in the request body.
 * The access token stays in memory. On a 401 the client silently refreshes once
 * and retries.
 */
const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:4000";
const BASE = `${API_URL}/api/v1`;
const REFRESH_KEY = "nexahaus.refreshToken";

let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function onAuthChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(): void {
  listeners.forEach((l) => l());
}

export function getAccessToken(): string | null {
  return accessToken;
}
export function setAccessToken(token: string | null): void {
  accessToken = token;
  emit();
}
export async function storeRefreshToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(REFRESH_KEY, token);
  else await SecureStore.deleteItemAsync(REFRESH_KEY);
}
export function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, body: ErrorResponse["error"]) {
    super(body.message);
    this.code = body.code;
    this.status = status;
  }
}

interface Options {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  retry?: boolean;
}

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const url = new URL(BASE + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.body !== undefined
        ? { "content-type": "application/json" }
        : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  const json = (await res.json()) as
    | SuccessResponse<T>
    | ListResponse<unknown>
    | ErrorResponse;

  if (!res.ok || json.success === false) {
    const err = (json as ErrorResponse).error;
    if (
      res.status === 401 &&
      (opts.retry ?? true) &&
      err.code !== "UNAUTHENTICATED"
    ) {
      const ok = await tryRefresh();
      if (ok) return request<T>(path, { ...opts, retry: false });
    }
    if (res.status === 401) {
      setAccessToken(null);
      await storeRefreshToken(null);
    }
    throw new ApiError(res.status, err);
  }
  return (json as SuccessResponse<T>).data;
}

let refreshInFlight: Promise<boolean> | null = null;
export async function tryRefresh(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const stored = await getStoredRefreshToken();
      if (!stored) return false;
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: stored }),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as SuccessResponse<{
        accessToken: string;
        refreshToken?: string;
      }>;
      if (json.success && json.data.accessToken) {
        setAccessToken(json.data.accessToken);
        if (json.data.refreshToken)
          await storeRefreshToken(json.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshInFlight = null), 0);
    }
  })();
  return refreshInFlight;
}

export const api = {
  get: <T>(path: string, query?: Options["query"]) =>
    request<T>(path, { query }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
};

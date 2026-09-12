import type {
  ApiErrorCode,
  ErrorResponse,
  ListResponse,
  SuccessResponse,
} from "@nexahaus/types";

/**
 * Typed API client for the NexaHaus REST API. Calls go to `/api/v1/*`, which
 * Next.js rewrites to the NestJS service (same-origin, so the HttpOnly refresh
 * cookie is sent automatically).
 *
 * The access token lives in memory only. On a 401 the client attempts one
 * silent refresh (via the cookie) and retries; if that fails it clears the
 * token and notifies subscribers so the app can redirect to /login.
 */

const BASE = "/api/v1";

let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((l) => l());
}
export function getAccessToken(): string | null {
  return accessToken;
}
export function onAuthChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: { path: string; message: string }[];
  constructor(status: number, body: ErrorResponse["error"]) {
    super(body.message);
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  /** Set false to skip the automatic refresh-and-retry (used by refresh itself). */
  retryOnUnauthorized?: boolean;
  signal?: AbortSignal;
}

async function raw<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== "")
        url.searchParams.set(k, String(v));
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
    credentials: "include",
    signal: opts.signal,
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
      (opts.retryOnUnauthorized ?? true) &&
      err.code !== "UNAUTHENTICATED"
    ) {
      const refreshed = await tryRefresh();
      if (refreshed)
        return raw<T>(path, { ...opts, retryOnUnauthorized: false });
    }
    if (res.status === 401) setAccessToken(null);
    throw new ApiError(res.status, err);
  }

  return (json as SuccessResponse<T>).data;
}

/** For list endpoints — returns data plus the list meta. */
async function list<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<{ items: T[]; meta: ListResponse<T>["meta"] }> {
  const url = new URL(BASE + path, window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== "")
        url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
    credentials: "include",
    signal: opts.signal,
  });
  const json = (await res.json()) as ListResponse<T> | ErrorResponse;
  if (!res.ok || json.success === false) {
    const err = (json as ErrorResponse).error;
    if (res.status === 401 && (opts.retryOnUnauthorized ?? true)) {
      const refreshed = await tryRefresh();
      if (refreshed)
        return list<T>(path, { ...opts, retryOnUnauthorized: false });
      setAccessToken(null);
    }
    throw new ApiError(res.status, err);
  }
  return { items: json.data, meta: json.meta };
}

let refreshInFlight: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      if (!res.ok) return false;
      const json = (await res.json()) as SuccessResponse<{
        accessToken: string;
      }>;
      if (json.success && json.data.accessToken) {
        setAccessToken(json.data.accessToken);
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
  get: <T>(path: string, query?: RequestOptions["query"]) =>
    raw<T>(path, { query }),
  list,
  post: <T>(path: string, body?: unknown) =>
    raw<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    raw<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) =>
    raw<T>(path, { method: "PUT", body }),
  del: <T>(path: string) => raw<T>(path, { method: "DELETE" }),
  refresh: tryRefresh,
};

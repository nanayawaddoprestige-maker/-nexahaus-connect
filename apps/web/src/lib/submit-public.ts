import { PUBLIC_API_BASE } from "@/lib/site-config";
import { getAttribution } from "@/lib/utm";

export interface SubmitResult<T> {
  ok: boolean;
  data?: T;
  /** User-facing message; safe to render. */
  error?: string;
}

/**
 * POST a lead-capture payload to the NestJS public API. Adds first-touch
 * campaign attribution, normalises the response envelope, and never throws —
 * callers render `ok` / `error` directly.
 *
 * `path` is relative to PUBLIC_API_BASE, e.g. "/contact".
 */
export async function submitPublic<T = unknown>(
  path: string,
  payload: object,
  opts: { includeAttribution?: boolean; signal?: AbortSignal } = {},
): Promise<SubmitResult<T>> {
  const body: Record<string, unknown> = { ...payload };
  if (opts.includeAttribution !== false) {
    const attr = getAttribution();
    if (Object.keys(attr).length > 0) {
      // Only the campaign fields — never the timestamps/derived keys.
      body.attribution = {
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        utm_content: attr.utm_content,
        utm_term: attr.utm_term,
        click_id: attr.click_id,
        landing_path: attr.landing_path,
        referrer: attr.referrer,
      };
    }
  }

  try {
    const res = await fetch(`${PUBLIC_API_BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      data?: T;
      error?: { message?: string };
    } | null;

    if (!res.ok || json?.success === false) {
      return {
        ok: false,
        error:
          json?.error?.message ??
          (res.status === 429
            ? "Too many attempts. Please wait a moment and try again."
            : "Something went wrong sending your details. Please try again."),
      };
    }
    return { ok: true, data: json?.data ?? (json as T) };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "The request was cancelled." };
    }
    return {
      ok: false,
      error:
        "We couldn't reach the server. Check your connection and try again.",
    };
  }
}

/**
 * Campaign attribution (brief §27). On the first page of a visit we read the
 * `utm_*` params plus a few common click ids and store them for the session, so
 * every lead form can attach where the visitor came from without putting PII in
 * any URL. First-touch wins; we do not overwrite an existing attribution.
 */

const KEY = "nx_attribution";

const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const CLICK_IDS = [
  "gclid",
  "fbclid",
  "ttclid",
  "li_fat_id",
  "msclkid",
] as const;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  click_id?: string;
  /** First page the visitor landed on (path only, no query). */
  landing_path?: string;
  referrer?: string;
  captured_at?: string;
}

function safeGet(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

function safeSet(value: Attribution): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* private mode / storage disabled — attribution is best-effort */
  }
}

/** Call once per page load (from the client analytics provider). Idempotent. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const existing = safeGet();
  if (existing.captured_at) return; // first-touch only

  const params = new URLSearchParams(window.location.search);
  const next: Attribution = {};

  for (const f of UTM_FIELDS) {
    const v = params.get(f);
    if (v) next[f] = v.slice(0, 200);
  }
  for (const c of CLICK_IDS) {
    const v = params.get(c);
    if (v) {
      next.click_id = `${c}:${v.slice(0, 200)}`;
      break;
    }
  }

  const hasCampaignData = Object.keys(next).length > 0;
  const referrer =
    document.referrer && !document.referrer.startsWith(window.location.origin)
      ? document.referrer.slice(0, 300)
      : undefined;

  if (!hasCampaignData && !referrer) return; // nothing worth recording

  safeSet({
    ...next,
    landing_path: window.location.pathname,
    referrer,
    captured_at: new Date().toISOString(),
  });
}

/** Attribution to merge into a lead payload / analytics event. */
export function getAttribution(): Attribution {
  return safeGet();
}

/** Flat string map for hidden form fields. */
export function attributionFields(): Record<string, string> {
  const a = getAttribution();
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) if (v) out[k] = String(v);
  return out;
}

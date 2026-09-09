/**
 * Cookie consent state (brief §58). Three categories; "necessary" is always on.
 * Nothing that sets marketing/analytics cookies may run until the visitor has
 * made a choice and granted the relevant category.
 *
 * Stored in localStorage (per-device, per-browser). Reads are defensive: a
 * missing or unreadable value means "undecided" and the banner shows.
 */

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of the decision. Absent = undecided. */
  decidedAt?: string;
  /** Bump when the consent copy/categories change to re-prompt. */
  version: number;
}

export const CONSENT_VERSION = 1;
const KEY = "nx_consent";
export const CONSENT_EVENT = "nx:consent-change";

export const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
};

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION || !parsed.decidedAt) return null;
    return { ...DEFAULT_CONSENT, ...parsed };
  } catch {
    return null;
  }
}

export function hasDecided(): boolean {
  return readConsent() !== null;
}

export function consentGranted(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  return readConsent()?.[category] === true;
}

export function writeConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  } catch {
    /* storage disabled — consent is session-only, banner will reappear */
  }
  return state;
}

export function acceptAll(): ConsentState {
  return writeConsent({ analytics: true, marketing: true });
}

export function rejectNonEssential(): ConsentState {
  return writeConsent({ analytics: false, marketing: false });
}

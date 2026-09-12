/**
 * Analytics provider abstraction. No IDs are hard-coded and nothing loads until
 * (a) a provider is configured via NEXT_PUBLIC_ANALYTICS_PROVIDER and (b) the
 * visitor has accepted analytics cookies. The default provider is "noop".
 *
 * Swapping providers is a one-file change: implement `AnalyticsAdapter` and add
 * it to `ADAPTERS`.
 */
import { ANALYTICS } from "@/lib/site-config";
import { getAttribution } from "@/lib/utm";

/** Canonical event names (brief §26). Keep this list closed. */
export type AnalyticsEvent =
  | "page_view"
  | "cta_clicked"
  | "form_started"
  | "form_completed"
  | "assessment_requested"
  | "health_check_completed"
  | "survey_completed"
  | "early_access_joined"
  | "property_rescue_requested"
  | "contact_submitted"
  | "client_login_clicked"
  | "connect_preview_viewed";

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

interface AnalyticsAdapter {
  init(): void | Promise<void>;
  track(event: AnalyticsEvent, props?: AnalyticsProps): void;
  pageView(path: string): void;
}

const noopAdapter: AnalyticsAdapter = {
  init() {},
  track() {},
  pageView() {},
};

/**
 * PostHog adapter. Wire the real client (`posthog-js`, added as a dependency)
 * inside `init()` when a provider is actually chosen; until then this forwards
 * events to `window.posthog` if a snippet is present and is otherwise inert.
 * Kept dependency-free so the default build carries no analytics code.
 */
function createPosthogAdapter(): AnalyticsAdapter {
  type PH = { capture: (e: string, p?: object) => void };
  const ph = (): PH | undefined =>
    typeof window !== "undefined"
      ? (window as unknown as { posthog?: PH }).posthog
      : undefined;
  return {
    init() {
      /* Intentionally empty until posthog-js is added. See docs/SEO.md. */
    },
    track(event, props) {
      ph()?.capture(event, { ...getAttribution(), ...props });
    },
    pageView(path) {
      ph()?.capture("page_view", { path, ...getAttribution() });
    },
  };
}

const noopFactory = (): AnalyticsAdapter => noopAdapter;

const ADAPTERS: Record<string, () => AnalyticsAdapter> = {
  noop: noopFactory,
  posthog: createPosthogAdapter,
};

let adapter: AnalyticsAdapter = noopAdapter;
let initialised = false;

export function initAnalytics(): void {
  if (initialised || typeof window === "undefined") return;
  const factory = ADAPTERS[ANALYTICS.provider] ?? noopFactory;
  adapter = factory();
  void adapter.init();
  initialised = true;
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  try {
    adapter.track(event, props);
  } catch {
    /* swallow */
  }
}

export function trackPageView(path: string): void {
  try {
    adapter.pageView(path);
  } catch {
    /* swallow */
  }
}

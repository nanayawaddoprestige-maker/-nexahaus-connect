"use client";

import { ANALYTICS } from "@/lib/site-config";

/**
 * Re-opens the consent panel. When no tracking provider is configured there is
 * nothing to manage, so we say so plainly instead of showing a dead button.
 */
export function ManageCookiesButton() {
  const trackingConfigured = ANALYTICS.provider !== "noop";

  if (!trackingConfigured) {
    return (
      <p className="text-sm text-ink-subtle">
        This deployment loads no analytics or marketing cookies, so there is
        nothing to manage. Only necessary cookies are used.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("nx:open-consent"))}
      className="h-11 rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-navy-900 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
    >
      Manage cookie preferences
    </button>
  );
}

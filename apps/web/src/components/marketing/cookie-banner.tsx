"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { ANALYTICS } from "@/lib/site-config";
import {
  acceptAll,
  hasDecided,
  readConsent,
  rejectNonEssential,
  writeConsent,
  CONSENT_EVENT,
} from "@/lib/consent";

/**
 * Consent banner. Shows only when a tracking provider is configured AND the
 * visitor has not yet decided. "Reject" is as prominent as "Accept" (no dark
 * patterns). Preferences can be reopened from the footer Cookie Policy page.
 */
export function CookieBanner() {
  const trackingConfigured = ANALYTICS.provider !== "noop";
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!trackingConfigured) return;
    setVisible(!hasDecided());
    const onChange = () => setVisible(!hasDecided());
    window.addEventListener(CONSENT_EVENT, onChange);
    window.addEventListener("nx:open-consent", () => {
      const c = readConsent();
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
      setManaging(true);
      setVisible(true);
    });
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, [trackingConfigured]);

  if (!trackingConfigured || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-modal="false"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
    >
      <div className="nx-container py-4">
        {!managing ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-sm text-ink-muted">
              We use essential cookies to run this site. With your permission we also
              use analytics cookies to understand what is useful. See our{" "}
              <Link href={routes.cookies} className="font-medium text-navy-700 underline underline-offset-2">
                Cookie Policy
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setManaging(true)}
                className="h-10 rounded-lg px-4 text-sm font-medium text-navy-800 hover:bg-navy-50"
              >
                Manage
              </button>
              <button
                type="button"
                onClick={() => rejectNonEssential()}
                className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-navy-900 hover:bg-surface-sunken"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() => acceptAll()}
                className="h-10 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              writeConsent({ analytics, marketing });
              setManaging(false);
            }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-navy-900">Cookie preferences</p>
            <fieldset className="space-y-2 text-sm">
              <label className="flex items-start gap-2 text-ink-muted">
                <input type="checkbox" checked disabled className="mt-1" />
                <span>
                  <span className="font-medium text-navy-900">Necessary</span> — always on.
                  Required for the site to work.
                </span>
              </label>
              <label className="flex items-start gap-2 text-ink-muted">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <span>
                  <span className="font-medium text-navy-900">Analytics</span> — anonymous
                  usage measurement to improve the site.
                </span>
              </label>
              <label className="flex items-start gap-2 text-ink-muted">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
                <span>
                  <span className="font-medium text-navy-900">Marketing</span> — measure
                  campaign performance.
                </span>
              </label>
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setManaging(false)}
                className="h-10 rounded-lg px-4 text-sm font-medium text-navy-800 hover:bg-navy-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
              >
                Save preferences
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

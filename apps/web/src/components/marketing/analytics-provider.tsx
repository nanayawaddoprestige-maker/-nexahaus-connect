"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/utm";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { consentGranted, CONSENT_EVENT } from "@/lib/consent";

/**
 * Client bootstrap for the marketing site:
 *  - captures first-touch campaign attribution (sessionStorage only, no network)
 *  - initialises the analytics provider ONLY after analytics consent
 *  - emits a page_view on every client navigation
 *
 * Wrapped in Suspense because useSearchParams opts the subtree into CSR.
 */
function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // First-touch attribution — safe pre-consent (first-party, no cookies set).
  useEffect(() => {
    captureAttribution();
  }, [pathname, searchParams]);

  // Initialise analytics on load and whenever consent changes.
  useEffect(() => {
    const maybeInit = () => {
      if (consentGranted("analytics")) initAnalytics();
    };
    maybeInit();
    window.addEventListener(CONSENT_EVENT, maybeInit);
    return () => window.removeEventListener(CONSENT_EVENT, maybeInit);
  }, []);

  // Page views (no-op until a provider is active).
  useEffect(() => {
    if (!consentGranted("analytics")) return;
    const qs = searchParams.toString();
    trackPageView(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}

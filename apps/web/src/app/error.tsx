"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";

/**
 * Root error boundary (brief §56). Keeps the message calm and offers a way
 * forward; the technical detail goes to the console / monitoring, not the user.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line">
        <div className="nx-container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-sm font-semibold text-navy-900">
              NexaHaus
            </span>
          </Link>
        </div>
      </header>

      <main id="main" className="flex flex-1 items-center">
        <div className="nx-container py-20">
          <p className="nx-eyebrow">Something went wrong</p>
          <h1 className="nx-display mt-3 text-display-lg text-navy-900">
            We hit an unexpected problem.
          </h1>
          <p className="mt-4 max-w-prose text-lg text-ink-muted">
            The page didn&rsquo;t load properly. You can try again, or head back
            to the homepage.
          </p>
          {error.digest ? (
            <p className="mt-2 text-xs text-ink-subtle">
              Reference: {error.digest}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-5 text-sm font-semibold text-navy-900 hover:bg-surface-sunken"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line">
        <div className="nx-container flex h-16 items-center">
          <Link
            href={routes.home}
            className="flex items-center gap-2.5"
            aria-label="NexaHaus home"
          >
            <BrandMark className="h-8 w-8" />
            <span className="text-sm font-semibold text-navy-900">
              NexaHaus
            </span>
          </Link>
        </div>
      </header>

      <main id="main" className="flex flex-1 items-center">
        <div className="nx-container py-20">
          <p className="nx-eyebrow">Error 404</p>
          <h1 className="nx-display mt-3 text-display-lg text-navy-900">
            Looks like this property page has moved.
          </h1>
          <p className="mt-4 max-w-prose text-lg text-ink-muted">
            The page you were looking for isn&rsquo;t here. It may have been
            renamed or is still being built ahead of our December 2027 launch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={routes.home}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Return Home
            </Link>
            <Link
              href={routes.propertyHealthCheck}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-5 text-sm font-semibold text-navy-900 hover:bg-surface-sunken"
            >
              Request a Property Assessment
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

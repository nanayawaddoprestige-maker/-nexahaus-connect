import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 text-sm leading-relaxed text-ink">
      <h1 className="text-3xl font-semibold text-navy-900">Terms</h1>
      <p className="mt-2 text-xs text-ink-subtle">
        Summary — full terms will be published before launch.
      </p>
      <div className="mt-6 space-y-4">
        <p>
          NexaHaus Connect is a management platform. It does not provide
          professional legal advice, property valuation, tax advice, investment
          advice, or regulated real-estate brokerage.
        </p>
        <p>
          Automated figures — including the Property Health Score, Property Rescue
          score and any estimated values or yields — are indicative, generated from
          the data held in the platform. They are not verified valuations. Where
          professional review is required, the platform says so.
        </p>
        <p>
          Regulated real-estate agency activities are provided only where NexaHaus
          holds the required Ghanaian licensing and qualified personnel.
        </p>
        <p>
          Client and property funds are administered separately from NexaHaus
          operating funds. Owner statements are generated from recorded
          transactions and are not adjusted manually.
        </p>
      </div>
    </div>
  );
}

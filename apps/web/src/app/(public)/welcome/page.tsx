import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NexaHaus — Property & Asset Management in Ghana",
  description:
    "Own property in Ghana? Know what's happening with your asset — wherever you are. Professional property and asset management for owners and the Ghanaian diaspora.",
};

export default function WelcomePage() {
  return (
    <>
      <section className="bg-navy-900 text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-gold-400">
            NexaHaus Properties &amp; Asset Management
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Own property in Ghana? Know what&rsquo;s happening with your asset —
            wherever you are.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-navy-100">
            NexaHaus helps property owners protect their properties, improve rental
            performance and manage their assets with confidence — with transparent
            reporting you can see any time, from anywhere.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/health-check"
              className="rounded-lg bg-gold-400 px-5 py-3 text-sm font-semibold text-navy-900 hover:bg-gold-300"
            >
              Request a property assessment
            </Link>
            <Link
              href="/early-access"
              className="rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Join NexaHaus Early Access
            </Link>
          </div>
          <p className="mt-6 text-xs text-navy-300">
            First office opening in Accra, December 2027. Founding clients onboarded first.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold text-navy-900">
          One question, answered in seconds: <span className="text-ink-muted">what is happening with my property?</span>
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Visibility", "Property status, tenants, rent, maintenance and inspections — with clear dates, not phone calls."],
            ["Transparency", "Monthly owner statements you can reproduce from every transaction. Nothing edited by hand."],
            ["Accountability", "Maintenance tracked from report to completion. Every approval and decision logged."],
            ["Performance", "A Property Health Score, Property Rescue diagnostics and asset-performance reporting."],
            ["Control", "Approve costs above your threshold. Nothing significant happens without your say-so."],
            ["Built for diaspora", "Designed for owners who don't live near their property. Manage it from another country."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-line p-5">
              <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface-sunken">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-navy-900">
                Start with a free Property Health Check
              </h2>
              <p className="mt-3 max-w-xl text-ink-muted">
                Answer a few questions about your property and get a preliminary
                health score straight away, plus the areas most likely to need
                attention. It takes about two minutes.
              </p>
              <p className="mt-3 text-sm text-ink-subtle">
                The Health Check is a preliminary digital assessment — it is not a
                professional property assessment or valuation.
              </p>
            </div>
            <Link
              href="/health-check"
              className="inline-flex items-center justify-center rounded-lg bg-navy-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Take the Property Health Check
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-2xl bg-navy-900 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-semibold">
            Own property in Ghana while living abroad?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-100">
            Stay informed without being physically present. See your property&rsquo;s
            status, rent, maintenance and finances in one secure place.
          </p>
          <Link
            href="/early-access"
            className="mt-6 inline-flex rounded-lg bg-gold-400 px-5 py-3 text-sm font-semibold text-navy-900 hover:bg-gold-300"
          >
            Join Early Access
          </Link>
        </div>
      </section>
    </>
  );
}

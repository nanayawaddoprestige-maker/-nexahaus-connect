import Link from "next/link";

export function ServicePage({
  eyebrow,
  title,
  intro,
  points,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  points: [string, string][];
}) {
  return (
    <>
      <section className="border-b border-line bg-surface-sunken">
        <div className="mx-auto max-w-4xl px-5 py-16">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-gold-500">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy-900">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-muted">{intro}</p>
          <div className="mt-8 flex gap-3">
            <Link href="/health-check" className="rounded-lg bg-navy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800">
              Request a property assessment
            </Link>
            <Link href="/early-access" className="rounded-lg border border-line px-5 py-3 text-sm font-semibold text-navy-900 hover:bg-surface">
              Join Early Access
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 py-14">
        <div className="grid gap-6 sm:grid-cols-2">
          {points.map(([h, b]) => (
            <div key={h} className="rounded-xl border border-line p-5">
              <h2 className="text-sm font-semibold text-navy-900">{h}</h2>
              <p className="mt-1.5 text-sm text-ink-muted">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-ink-subtle">
          NexaHaus does not provide legal, valuation, tax or investment advice.
          Regulated agency activities are offered only where NexaHaus holds the
          required Ghanaian licensing and qualified personnel.
        </p>
      </section>
    </>
  );
}

import Link from "next/link";
import { Section, SectionHeader } from "@/components/marketing/primitives";
import { Reveal } from "@/components/marketing/reveal";
import { services } from "./content";

export function Services() {
  return (
    <Section id="services">
      <SectionHeader
        eyebrow="Services"
        title={services.headline}
        lede="Property management, asset management, facilities, leasing, short-stay and advisory — coordinated by one accountable partner."
      />

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {services.items.map((service, i) => (
          <Reveal key={service.title} delay={i * 50}>
            <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-raised">
              <h3 className="text-base font-semibold text-navy-900">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {service.summary}
              </p>

              <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm text-ink-muted sm:grid-cols-2">
                {service.includes.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              {"note" in service && service.note ? (
                <p className="mt-4 text-xs text-ink-subtle">{service.note}</p>
              ) : null}

              <div className="mt-5 flex-1" />
              <Link
                href={service.href}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-navy-800 hover:text-navy-900"
              >
                {service.cta}
                <span aria-hidden>→</span>
              </Link>
            </article>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 max-w-prose text-xs text-ink-subtle">
        Leasing and other regulated real-estate agency activities are provided
        only where NexaHaus holds the required Ghanaian licensing and qualified
        personnel. NexaHaus does not provide legal, valuation, tax or investment
        advice.
      </p>
    </Section>
  );
}

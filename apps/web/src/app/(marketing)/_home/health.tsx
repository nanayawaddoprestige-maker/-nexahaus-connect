import { Section, SectionHeader } from "@/components/marketing/primitives";
import { Cta } from "@/components/marketing/cta";
import { HealthGauge } from "@/components/marketing/health-gauge";
import { health } from "./content";

export function HealthSection() {
  return (
    <Section id="property-health">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div className="order-2 flex flex-col items-center rounded-2xl bg-navy-900 p-8 text-white lg:order-1">
          <HealthGauge
            score={health.exampleScore}
            caption="Illustrative example"
            onNavy
          />
          <p className="mt-4 text-center text-xs text-navy-300">
            One score, updated as your property&rsquo;s occupancy, collection,
            maintenance and finances change.
          </p>
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeader
            eyebrow={health.eyebrow}
            title={health.headline}
            lede={health.body}
          />

          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-ink-muted sm:grid-cols-4 lg:grid-cols-2">
            {health.categories.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-1 w-1 shrink-0 rounded-full bg-gold-500"
                />
                {c}
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-prose text-xs text-ink-subtle">
            {health.disclaimer}
          </p>

          <div className="mt-6">
            <Cta
              href={health.cta.href}
              size="lg"
              event="assessment_requested"
              eventProps={{ location: "home_health" }}
            >
              {health.cta.label}
            </Cta>
          </div>
        </div>
      </div>
    </Section>
  );
}

import { Section, SectionHeader } from "@/components/marketing/primitives";
import { Cta } from "@/components/marketing/cta";
import { FlowSteps } from "@/components/marketing/flow-steps";
import { HealthGauge } from "@/components/marketing/health-gauge";
import { rescue } from "./content";

export function RescueSection() {
  return (
    <Section tone="sunken" id="property-rescue">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <SectionHeader
            eyebrow={rescue.eyebrow}
            title={rescue.headline}
            lede={rescue.body}
          />
          <p className="mt-4 max-w-xl text-ink-muted">{rescue.detail}</p>
          <FlowSteps steps={rescue.flow} className="mt-8" />
          <div className="mt-8">
            <Cta
              href={rescue.cta.href}
              size="lg"
              event="property_rescue_requested"
              eventProps={{ location: "home" }}
            >
              {rescue.cta.label}
            </Cta>
          </div>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-8 shadow-card">
          <HealthGauge
            score={rescue.exampleScore}
            caption={rescue.exampleLabel}
          />
          <p className="mt-3 text-center text-xs text-ink-subtle">
            A Property Rescue assessment produces an overall score and a ranked
            list of corrective actions.
          </p>
        </div>
      </div>
    </Section>
  );
}

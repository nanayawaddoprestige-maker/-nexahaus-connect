import { Section, SectionHeader } from "@/components/marketing/primitives";
import { Cta } from "@/components/marketing/cta";
import { FlowSteps } from "@/components/marketing/flow-steps";
import { diaspora } from "./content";

export function DiasporaSection() {
  return (
    <Section tone="navy" id="diaspora">
      <SectionHeader
        eyebrow={diaspora.eyebrow}
        title={diaspora.headline}
        lede={diaspora.lede}
        onNavy
      />
      <p className="mt-4 max-w-2xl text-navy-100">{diaspora.body}</p>

      <FlowSteps steps={diaspora.flow} onNavy className="mt-10" />

      <div className="mt-10">
        <Cta href={diaspora.cta.href} variant="gold" size="lg" eventProps={{ location: "home_diaspora" }}>
          {diaspora.cta.label}
        </Cta>
      </div>
    </Section>
  );
}

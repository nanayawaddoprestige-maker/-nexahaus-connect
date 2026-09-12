import { Section, SectionHeader } from "@/components/marketing/primitives";
import { Reveal } from "@/components/marketing/reveal";
import { whyNexahaus } from "./content";

export function WhyNexaHaus() {
  return (
    <Section tone="sunken" id="why-nexahaus">
      <SectionHeader
        eyebrow={whyNexahaus.eyebrow}
        title={whyNexahaus.headline}
        lede={whyNexahaus.body}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {whyNexahaus.pillars.map((pillar, i) => (
          <Reveal key={pillar.title} delay={i * 50}>
            <div className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-card">
              <h3 className="text-sm font-semibold text-navy-900">
                {pillar.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {pillar.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

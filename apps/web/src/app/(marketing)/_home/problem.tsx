import {
  Section,
  SectionHeader,
  Card,
} from "@/components/marketing/primitives";
import { Reveal } from "@/components/marketing/reveal";
import { problem } from "./content";

export function Problem() {
  return (
    <Section tone="sunken" id="the-problem">
      <SectionHeader
        eyebrow="The problem"
        title={problem.headline}
        lede={problem.body}
      />
      <p className="mt-4 text-lg font-semibold text-navy-900">
        {problem.bridge}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {problem.cards.map((card, i) => (
          <Reveal key={card.title} delay={i * 60}>
            <Card className="h-full">
              <h3 className="text-sm font-semibold text-navy-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {card.body}
              </p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

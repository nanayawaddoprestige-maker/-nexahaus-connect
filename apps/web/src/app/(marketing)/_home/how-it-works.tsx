import { Section, SectionHeader } from "@/components/marketing/primitives";
import { Reveal } from "@/components/marketing/reveal";
import { howItWorks } from "./content";

export function HowItWorks() {
  return (
    <Section tone="sunken" id="how-it-works">
      <SectionHeader eyebrow={howItWorks.eyebrow} title={howItWorks.headline} />

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {howItWorks.steps.map((step, i) => (
          <li key={step.title} className="h-full">
            <Reveal
              delay={i * 50}
              className="flex h-full flex-col rounded-xl border border-line bg-surface p-6 shadow-card"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-sm font-semibold tabular-nums text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-navy-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

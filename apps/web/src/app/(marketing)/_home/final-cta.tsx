import { Section } from "@/components/marketing/primitives";
import { Cta } from "@/components/marketing/cta";
import { finalCta } from "./content";

export function FinalCta() {
  return (
    <Section tone="navy" ariaLabel="Get started">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="nx-display text-display-md text-white">
          {finalCta.headline}
        </h2>
        <p className="mt-3 text-navy-100">{finalCta.body}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Cta
            href={finalCta.primary.href}
            variant="gold"
            size="lg"
            event="assessment_requested"
            eventProps={{ location: "footer_cta" }}
          >
            {finalCta.primary.label}
          </Cta>
          <Cta
            href={finalCta.secondary.href}
            variant="onNavy"
            size="lg"
            eventProps={{ location: "footer_cta" }}
          >
            {finalCta.secondary.label}
          </Cta>
        </div>
      </div>
    </Section>
  );
}

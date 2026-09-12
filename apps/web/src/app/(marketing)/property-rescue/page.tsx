import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Section, SectionHeader } from "@/components/marketing/primitives";
import { ServiceHero } from "@/components/marketing/service-hero";
import { CheckList } from "@/components/marketing/feature-list";
import { FlowSteps } from "@/components/marketing/flow-steps";
import { HealthGauge } from "@/components/marketing/health-gauge";
import { FaqAccordion, FaqJsonLd } from "@/components/marketing/faq-accordion";
import { CtaBand } from "@/components/marketing/cta-band";
import { PropertyRescueForm } from "@/components/forms/property-rescue-form";
import { faqsForTopic } from "@/content/faq";

const DESCRIPTION =
  "Property Rescue is a structured NexaHaus assessment for an underperforming property in Ghana — it identifies the management, maintenance, occupancy and rental problems affecting the asset and gives a ranked list of corrective actions.";

export const metadata: Metadata = buildMetadata({
  title: "Property Rescue",
  description: DESCRIPTION,
  path: routes.propertyRescue,
  keywords: [
    "underperforming rental property Ghana",
    "property management review Ghana",
    "property assessment Ghana",
  ],
});

const EXAMINES = [
  "Occupancy and vacancy",
  "Rental pricing vs the local market",
  "Rent collection and arrears",
  "Maintenance backlog and condition",
  "Preventive maintenance gaps",
  "Tenant management and turnover",
  "Documentation — title, tenancy, insurance",
  "Revenue leakage and operating costs",
];

export default function PropertyRescuePage() {
  const faqs = faqsForTopic("property-rescue");
  return (
    <>
      <ServiceHero
        eyebrow="Property Rescue"
        title="Is Your Property Underperforming?"
        lede="Some properties do not need another caretaker. They need a proper assessment. Property Rescue is a structured way to find out what is holding an asset back — and what to do about it."
        breadcrumb={[{ label: "Property Rescue", href: routes.propertyRescue }]}
        jsonLd={{
          name: "Property Rescue",
          description: DESCRIPTION,
          path: routes.propertyRescue,
        }}
        primary={{ label: "Start the assessment", href: "#assess" }}
        secondary={{ label: "How it works", href: "#approach" }}
      />

      <Section id="approach">
        <SectionHeader eyebrow="The approach" title="Assess, then act." />
        <FlowSteps
          className="mt-10"
          steps={[
            {
              label: "Assess",
              detail: "Review the property against the areas below.",
            },
            {
              label: "Identify",
              detail: "Name the specific problems, with evidence.",
            },
            {
              label: "Prioritize",
              detail: "Rank the corrective actions by impact.",
            },
            {
              label: "Improve",
              detail:
                "Work through the actions — pricing, maintenance, tenancy.",
            },
            {
              label: "Monitor",
              detail: "Re-assess and track the score over time.",
            },
          ]}
        />
      </Section>

      <Section tone="sunken">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="What we examine"
              title="Where underperformance usually hides."
            />
            <CheckList items={EXAMINES} columns={2} className="mt-8" />
            <p className="mt-6 max-w-prose text-xs text-ink-subtle">
              This preliminary digital result is an indicative management
              assessment and does not constitute a professional property
              valuation, legal advice or investment advice.
            </p>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-8 shadow-card">
            <HealthGauge score={72} caption="Illustrative example" />
            <p className="mt-3 text-center text-xs text-ink-subtle">
              A Property Rescue assessment produces an overall score out of 100
              and the specific problems behind it.
            </p>
          </div>
        </div>
      </Section>

      <Section id="assess">
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            eyebrow="The assessment"
            title="Answer six short steps."
            lede="You'll get a preliminary Property Rescue score and the specific problems behind it. About three minutes."
          />
          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <PropertyRescueForm />
          </div>
          <p className="mt-4 text-xs text-ink-subtle">
            A written report and a professional assessment are the next step.
            This preliminary digital result is an indicative management
            assessment and does not constitute a professional property
            valuation, legal advice or investment advice.
          </p>
        </div>
      </Section>

      {faqs.length > 0 ? (
        <Section tone="sunken">
          <FaqJsonLd items={faqs} />
          <SectionHeader eyebrow="FAQ" title="Property Rescue questions." />
          <FaqAccordion items={faqs} className="mt-8" />
        </Section>
      ) : null}

      <CtaBand
        title="Find out what your property is really doing."
        body="Answer six short steps and get an indicative Property Rescue score, then request a professional assessment."
        primary={{ label: "Start the assessment", href: "#assess" }}
        primaryEvent="property_rescue_requested"
      />
    </>
  );
}

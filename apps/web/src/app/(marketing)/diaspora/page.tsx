import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Section, SectionHeader } from "@/components/marketing/primitives";
import { ServiceHero } from "@/components/marketing/service-hero";
import { CheckList } from "@/components/marketing/feature-list";
import { FlowSteps } from "@/components/marketing/flow-steps";
import { FaqAccordion, FaqJsonLd } from "@/components/marketing/faq-accordion";
import { CtaBand } from "@/components/marketing/cta-band";
import { PortfolioPanel } from "@/components/connect-preview/portfolio-panel";
import { faqsForTopic } from "@/content/faq";

const DESCRIPTION =
  "Property management for the Ghanaian diaspora. NexaHaus is the professional layer between you and your property in Ghana — visibility into status, rent, maintenance, inspections, documents and finances from wherever you live.";

export const metadata: Metadata = buildMetadata({
  title: "Diaspora Property Management",
  description: DESCRIPTION,
  path: routes.diaspora,
  keywords: [
    "diaspora property management Ghana",
    "property management for diaspora Ghana",
    "manage property in Ghana from abroad",
  ],
});

const PAIN_POINTS = [
  "A relative managing the property as a favour, with no time to do it properly",
  "An unreliable caretaker and no way to check the work",
  "Rent collection you cannot see or verify",
  "Maintenance problems you hear about late, or not at all",
  "Vacant units you did not know were vacant",
  "No inspections, no photos, no condition record",
  "No financial reporting you can reconcile",
  "Communication that depends on who picks up the phone",
];

const WHAT_YOU_CAN_SEE = [
  "Property status",
  "Tenant status",
  "Rent — expected, collected, outstanding",
  "Maintenance — from report to completion",
  "Inspection reports",
  "Photos",
  "Documents",
  "Monthly statements",
  "Approvals you need to action",
  "Property performance over time",
];

export default function DiasporaPage() {
  const faqs = faqsForTopic("diaspora");
  return (
    <>
      <ServiceHero
        eyebrow="For owners abroad"
        title="Own Property in Ghana. Stay Connected From Anywhere."
        lede="You should be able to own property in Ghana without the stress of managing it from abroad. NexaHaus is built to be the professional layer between you and your property — so distance does not mean uncertainty."
        breadcrumb={[{ label: "Diaspora", href: routes.diaspora }]}
        jsonLd={{
          name: "Diaspora Property Management",
          description: DESCRIPTION,
          path: routes.diaspora,
        }}
        primary={{
          label: "Request Diaspora Property Assessment",
          href: routes.propertyHealthCheck,
        }}
      />

      <Section>
        <SectionHeader
          eyebrow="The reality"
          title="Managing property from another country is hard."
          lede="If any of this sounds familiar, you are not alone — it is the norm for diaspora owners."
        />
        <CheckList items={PAIN_POINTS} columns={2} className="mt-8" />
      </Section>

      <Section tone="navy">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader
              eyebrow="What you can see"
              title="One place for the answer to “what is happening with my property?”"
              onNavy
            />
            <CheckList
              items={WHAT_YOU_CAN_SEE}
              columns={2}
              className="mt-8 [&_li]:text-navy-100"
            />
          </div>
          <PortfolioPanel
            tone="dark"
            data={{
              label: "Illustrative interface — example data",
              stats: [
                { label: "Properties", value: "3" },
                { label: "Occupied", value: "3" },
                { label: "Vacant", value: "0" },
                { label: "Open maintenance", value: "1" },
              ],
              finance: [
                { label: "Expected rent", value: "GHS 16,500" },
                { label: "Collected", value: "GHS 16,500" },
                { label: "Outstanding", value: "GHS 0" },
              ],
              portfolioHealth: 92,
            }}
          />
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeader
          eyebrow="How it works"
          title="Your property, your team, your updates."
        />
        <FlowSteps
          className="mt-10"
          steps={[
            {
              label: "Assessment",
              detail: "We review the property and how it is managed now.",
            },
            {
              label: "Onboarding",
              detail:
                "Property, tenants and documents set up in NexaHaus Connect.",
            },
            {
              label: "Management",
              detail:
                "Rent, maintenance and inspections handled on the ground.",
            },
            {
              label: "Visibility",
              detail: "You see status, finances and reports from anywhere.",
            },
            {
              label: "Approvals",
              detail: "You sign off significant costs from your phone.",
            },
          ]}
        />
      </Section>

      {faqs.length > 0 ? (
        <Section>
          <FaqJsonLd items={faqs} />
          <SectionHeader eyebrow="FAQ" title="Diaspora owner questions." />
          <FaqAccordion items={faqs} className="mt-8" />
        </Section>
      ) : null}

      <CtaBand
        title="You don't need to be in Ghana to know what is happening."
        body="Tell us where the property is and how it is managed today. We'll come back with an assessment."
        primary={{
          label: "Request Diaspora Property Assessment",
          href: routes.propertyHealthCheck,
        }}
      />
    </>
  );
}

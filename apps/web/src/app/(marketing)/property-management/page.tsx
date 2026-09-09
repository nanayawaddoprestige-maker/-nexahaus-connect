import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Section, SectionHeader } from "@/components/marketing/primitives";
import { ServiceHero } from "@/components/marketing/service-hero";
import { FeatureList, CheckList } from "@/components/marketing/feature-list";
import { FaqAccordion, FaqJsonLd } from "@/components/marketing/faq-accordion";
import { CtaBand } from "@/components/marketing/cta-band";
import { faqsForTopic } from "@/content/faq";

const DESCRIPTION =
  "Structured, professional property management in Ghana — tenant and rent management, maintenance, inspections, documentation and owner reporting, with transparent figures you can see any time.";

export const metadata: Metadata = buildMetadata({
  title: "Property Management",
  description: DESCRIPTION,
  path: routes.propertyManagement,
  keywords: [
    "property management services Ghana",
    "rental property management Ghana",
    "property management for landlords Ghana",
    "property managers Accra",
  ],
});

const AREAS = [
  { title: "Tenant management", body: "Tenant records, screening processes, lease coordination and a professional channel for tenant communication." },
  { title: "Rent collection", body: "Rent tracking and receipts, with clear monthly figures for what was expected, collected and outstanding." },
  { title: "Property inspections", body: "Scheduled inspections with area-by-area findings, photos and a branded report in NexaHaus Connect." },
  { title: "Maintenance", body: "Issues tracked from first report to completion, with vendor coordination and your approval for costs above your threshold." },
  { title: "Reporting", body: "A monthly owner statement reproducible from every transaction — nothing edited by hand." },
  { title: "Documentation", body: "Secure storage for title, tenancy, insurance and inspection documents, with expiry reminders." },
  { title: "Owner communication", body: "A single place for updates and approvals, so you are not chasing a caretaker for a status." },
  { title: "Property performance", body: "Occupancy, collection rate and Property Health tracked over time, not just this month." },
];

const PROPERTY_TYPES = [
  "Residential homes",
  "Apartments",
  "Multi-unit buildings",
  "Commercial property",
  "Mixed-use property",
  "Short-stay properties",
];

export default function PropertyManagementPage() {
  const faqs = faqsForTopic("property-management");
  return (
    <>
      <ServiceHero
        eyebrow="Service"
        title="Professional Management for Properties That Matter."
        lede="NexaHaus provides structured property management designed to protect your asset, improve operational efficiency and give you confidence in what is happening on the ground."
        breadcrumb={[{ label: "Property Management", href: routes.propertyManagement }]}
        jsonLd={{ name: "Property Management", description: DESCRIPTION, path: routes.propertyManagement }}
        primary={{ label: "Request Property Management", href: routes.propertyHealthCheck }}
      />

      <Section>
        <SectionHeader
          eyebrow="What we do"
          title="Day-to-day management, handled properly."
          lede="Eight areas of work, coordinated by one accountable team and visible to you in NexaHaus Connect."
        />
        <FeatureList features={AREAS} columns={2} className="mt-10" />
      </Section>

      <Section tone="sunken" id="maintenance">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <SectionHeader
            eyebrow="What we manage"
            title="One partner across property types."
            lede="The management plan is tailored to the property and its tenancies. Regulated agency activities such as leasing are offered only where NexaHaus holds the required Ghanaian licensing and qualified personnel."
          />
          <CheckList items={PROPERTY_TYPES} columns={2} className="lg:pt-2" />
        </div>
      </Section>

      {faqs.length > 0 ? (
        <Section>
          <FaqJsonLd items={faqs} />
          <SectionHeader eyebrow="FAQ" title="Property management questions." />
          <FaqAccordion items={faqs} className="mt-8" />
        </Section>
      ) : null}

      <CtaBand
        title="Let's start with your property."
        body="Tell us about the property and what you want solved. We'll come back with a property assessment."
        primary={{ label: "Request Property Management", href: routes.propertyHealthCheck }}
      />
    </>
  );
}

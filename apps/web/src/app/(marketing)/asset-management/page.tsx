import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Section, SectionHeader } from "@/components/marketing/primitives";
import { ServiceHero } from "@/components/marketing/service-hero";
import { FeatureList } from "@/components/marketing/feature-list";
import { FaqAccordion, FaqJsonLd } from "@/components/marketing/faq-accordion";
import { CtaBand } from "@/components/marketing/cta-band";
import { PerformancePanel } from "@/components/connect-preview/performance-panel";
import { faqsForTopic } from "@/content/faq";

const DESCRIPTION =
  "Property asset management for owners in Ghana — portfolio oversight, rental performance, occupancy, expense analysis, maintenance planning and asset reporting, so you can see how a property performs, not just that rent came in.";

export const metadata: Metadata = buildMetadata({
  title: "Asset Management",
  description: DESCRIPTION,
  path: routes.assetManagement,
  keywords: [
    "property asset management Ghana",
    "property investment Ghana",
    "rental performance Ghana",
  ],
});

const AREAS = [
  {
    title: "Portfolio oversight",
    body: "A single view across every property you own, with property- and portfolio-level reporting.",
  },
  {
    title: "Rental performance",
    body: "Rent achieved vs market, arrears, vacancy loss and collection rate over time.",
  },
  {
    title: "Occupancy",
    body: "Occupied vs vacant units, lease expiry pipeline and re-letting time.",
  },
  {
    title: "Expense analysis",
    body: "Operating costs by category, so recurring drains are visible and can be addressed.",
  },
  {
    title: "Maintenance planning",
    body: "Preventive maintenance scheduled ahead of time to protect condition and value.",
  },
  {
    title: "Property improvement",
    body: "Targeted work that improves rentability or reduces running costs, with the case set out.",
  },
  {
    title: "Asset reporting",
    body: "Income, expenses, net operating income and an estimated yield — actuals and estimates clearly labelled.",
  },
  {
    title: "Strategic recommendations",
    body: "Practical options for each property: hold, improve, re-position or review.",
  },
];

export default function AssetManagementPage() {
  const faqs = faqsForTopic("asset-management");
  return (
    <>
      <ServiceHero
        eyebrow="Service"
        title="Manage the Property. Understand the Asset."
        lede="Property management keeps day-to-day operations running. Asset management is about long-term performance and value. NexaHaus connects both."
        breadcrumb={[
          { label: "Asset Management", href: routes.assetManagement },
        ]}
        jsonLd={{
          name: "Asset Management",
          description: DESCRIPTION,
          path: routes.assetManagement,
        }}
        primary={{ label: "Discuss Your Portfolio", href: routes.contact }}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Property management
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Day-to-day operations: tenants, rent, maintenance, inspections,
              reporting. Protects the property.
            </p>
          </div>
          <div className="rounded-xl border border-navy-200 bg-navy-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-700">
              Asset management
            </p>
            <p className="mt-2 text-sm text-navy-800">
              Long-term performance and value: how the property does as an
              asset, and what would make it do better. Seeks to improve
              performance.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="sunken" id="advisory">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="What we do"
              title="An asset-performance mindset, not just rent collection."
            />
            <FeatureList features={AREAS} columns={2} className="mt-8" />
          </div>
          <PerformancePanel
            occupancy={80}
            rows={[
              {
                label: "Gross rental income",
                value: "GHS 342,000",
                note: "12-mo",
              },
              { label: "Operating expenses", value: "GHS 88,000" },
              { label: "Net operating income", value: "GHS 254,000" },
              { label: "Vacancy loss", value: "GHS 21,000" },
              {
                label: "Estimated gross yield",
                value: "7.4%",
                note: "estimate",
              },
            ]}
          />
        </div>
        <p className="mt-6 max-w-prose text-xs text-ink-subtle">
          Figures above are an illustrative example only. NexaHaus does not
          provide valuation, tax or investment advice; estimated yields are not
          a valuation.
        </p>
      </Section>

      {faqs.length > 0 ? (
        <Section>
          <FaqJsonLd items={faqs} />
          <SectionHeader eyebrow="FAQ" title="Asset management questions." />
          <FaqAccordion items={faqs} className="mt-8" />
        </Section>
      ) : null}

      <CtaBand
        title="Let's look at your portfolio."
        body="Tell us what you own and where. We'll come back with an assessment and where the performance gaps are."
        primary={{ label: "Discuss Your Portfolio", href: routes.contact }}
      />
    </>
  );
}

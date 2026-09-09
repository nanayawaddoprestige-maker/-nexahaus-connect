import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Section, SectionHeader, Container } from "@/components/marketing/primitives";
import { ServiceHero } from "@/components/marketing/service-hero";
import { FeatureList } from "@/components/marketing/feature-list";
import { CtaBand } from "@/components/marketing/cta-band";
import { ClientLoginLink } from "@/components/marketing/client-login-link";
import { Cta } from "@/components/marketing/cta";
import { ConnectShowcase } from "@/components/connect-preview/showcase";
import { COMPANY } from "@/lib/site-config";

const DESCRIPTION =
  "NexaHaus Connect is the technology platform being built to give property owners in Ghana a secure digital view of their assets: portfolio, rent and finance, maintenance, inspections, documents, approvals, reports and Property Health.";

export const metadata: Metadata = buildMetadata({
  title: "NexaHaus Connect",
  description: DESCRIPTION,
  path: routes.nexahausConnect,
  keywords: ["property management platform Ghana", "property management software Ghana", "property technology Ghana"],
});

const FEATURES = [
  { title: "Portfolio dashboard", body: "Every property in one view — occupancy, rent, maintenance and Portfolio Health." },
  { title: "Property profiles", body: "The full picture for each property: units, tenants, leases, documents and activity." },
  { title: "Rent & finance", body: "What was expected, collected and outstanding, with monthly owner statements." },
  { title: "Maintenance tracking", body: "Issues from first report to completion, with photos and vendor detail." },
  { title: "Inspections", body: "Scheduled inspections with area-by-area findings, photos and a branded report." },
  { title: "Documents", body: "Title, tenancy, insurance and inspection documents stored privately, with expiry reminders." },
  { title: "Owner approvals", body: "Review costs and photos and approve or decline from your phone." },
  { title: "Notifications", body: "Told about the things that matter — approvals, arrears, expiries — not noise." },
  { title: "Reports", body: "Portfolio reporting with filters, date ranges and CSV export." },
  { title: "Property Health", body: "A 0–100 read per property and across the portfolio, updated as things change." },
  { title: "Asset performance", body: "Income, expenses, occupancy and estimated yield — actuals and estimates clearly labelled." },
];

const MODULES = [
  "Properties",
  "Finance",
  "Maintenance",
  "Inspections",
  "Documents",
  "Approvals",
  "Reports",
  "Property Health",
];

export default function NexaHausConnectPage() {
  return (
    <>
      <ServiceHero
        eyebrow="NexaHaus Connect"
        title="Your Property. Your Data. Your Control."
        lede="NexaHaus Connect is our technology platform being built to give property owners a secure digital view of their assets — financial updates, maintenance activity, inspection reports, documents and portfolio performance, in one place."
        breadcrumb={[{ label: "NexaHaus Connect", href: routes.nexahausConnect }]}
        jsonLd={{ name: "NexaHaus Connect", description: DESCRIPTION, path: routes.nexahausConnect }}
        primary={{ label: "Join Early Access", href: routes.earlyAccess }}
        secondary={{ label: "See the screens", href: "#preview" }}
      />

      <Section id="preview">
        <SectionHeader
          eyebrow="A tour"
          title="What owners see."
          lede="A preview of the screens being built. Every name, figure and activity below is fictional and clearly labelled — it is not a real account."
        />
        <div className="mt-8">
          <ConnectShowcase />
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeader eyebrow="Features" title="Built around one question: what is happening with my property?" />
        <FeatureList features={FEATURES} columns={3} className="mt-8" />
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeader eyebrow="Your data" title="Private by default." />
            <div className="nx-prose mt-4">
              <p>
                Your property information belongs to you. NexaHaus Connect is being built
                with access controls, encryption in transit, audit logging and
                least-privilege access. Documents are stored privately and are never
                exposed through public links.
              </p>
              <p>
                The platform is designed to support compliance with Ghana&rsquo;s Data
                Protection Act, 2012 (Act 843). See our{" "}
                <a href={routes.privacy}>Privacy Policy</a>.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3">
            {MODULES.map((m) => (
              <li
                key={m}
                className="rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-navy-900 shadow-card"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="navy" ariaLabel="Access NexaHaus Connect">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="nx-display text-display-md text-white">Coming with the {COMPANY.shortName} launch.</h2>
          <p className="mt-3 text-navy-100">
            NexaHaus Connect is being built now and rolls out to clients as NexaHaus
            onboards them. Join Early Access to be among the first.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Cta href={routes.earlyAccess} variant="gold" size="lg" event="early_access_joined" eventProps={{ location: "connect_page" }}>
              Join Early Access
            </Cta>
            <ClientLoginLink className="border border-white/25 text-white hover:bg-white/10" />
          </div>
        </div>
      </Section>

      <CtaBand
        title="See how NexaHaus would manage your property."
        body="Start with a property assessment — the first step to onboarding into NexaHaus Connect."
        primary={{ label: "Request Property Assessment", href: routes.propertyHealthCheck }}
      />
    </>
  );
}

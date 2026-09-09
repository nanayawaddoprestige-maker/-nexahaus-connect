import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Section, SectionHeader, Container, Eyebrow } from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CtaBand } from "@/components/marketing/cta-band";
import { LaunchBadge } from "@/components/marketing/launch-badge";
import { COMPANY, LAUNCH } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "About NexaHaus",
  description:
    "NexaHaus Properties & Asset Management Ltd. is a technology-enabled property and asset management company being built for Ghana, with its first office opening in Accra in December 2027.",
  path: routes.about,
  keywords: ["property management company Accra", "property management company Ghana"],
});

const VALUES: [string, string][] = [
  ["Integrity", "We do what we say, and we say what is true — including when it is inconvenient."],
  ["Professionalism", "Structured processes and clear standards, not ad-hoc caretaking."],
  ["Transparency", "Owners can see what is happening and reconcile every figure."],
  ["Accountability", "Every decision, approval and action is recorded and owned."],
  ["Excellence", "The work is done properly the first time and checked."],
  ["Innovation", "We use technology to give owners visibility they could not get before."],
  ["Client focus", "The owner's asset and the owner's confidence come first."],
  ["Responsibility", "We treat someone's property as if the outcome were ours."],
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line bg-surface-sunken">
        <Container className="py-10">
          <Breadcrumbs trail={[{ label: "About", href: routes.about }]} />
        </Container>
        <Container className="pb-16 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>About</Eyebrow>
            <LaunchBadge />
          </div>
          <h1 className="nx-display mt-4 max-w-3xl text-display-lg text-navy-900">
            Building a Better Standard for Property Management in Ghana.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
            NexaHaus was created around a simple idea: property owners deserve
            professional management, transparent information and better systems.
          </p>
        </Container>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-8 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gold-600">Mission</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              To provide professional, transparent and technology-enabled property and
              asset management services that protect properties, improve performance and
              give owners confidence.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-8 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gold-600">Vision</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              To become one of Ghana&rsquo;s most trusted and technology-enabled property
              and asset management companies.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeader eyebrow="Values" title="What we hold ourselves to." />
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(([title, body]) => (
            <div key={title} className="bg-surface p-6">
              <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="In our words" title="What NexaHaus is." />
        <div className="nx-prose mt-6">
          <p>
            {COMPANY.legalName} is a modern, professional property and asset management
            company built to help property owners protect their properties, improve
            rental performance and manage their assets with confidence.
          </p>
          <p>
            Our approach combines professional property management, structured
            maintenance, transparent reporting, technology and an asset-performance
            mindset. For property owners living outside Ghana, we provide the visibility
            and accountability needed to manage property from wherever you are.
          </p>
          <p>
            Our technology platform, {COMPANY.product}, is being built to give clients
            secure digital access to their property information, financial updates,
            maintenance activity, inspection reports, documents and portfolio performance.
          </p>
          <p>
            Our first office is scheduled to open in {LAUNCH.city} in {LAUNCH.label}.
            NexaHaus does not provide legal, valuation, tax or investment advice, and
            regulated real-estate agency activities are offered only where NexaHaus holds
            the required Ghanaian licensing and qualified personnel.
          </p>
        </div>
      </Section>

      <CtaBand
        title="Help us build it."
        body="We are speaking with property owners now to shape NexaHaus around real needs."
        primary={{ label: "Join Early Access", href: routes.earlyAccess }}
        secondary={{ label: "Take the Property Owner Survey", href: routes.propertyOwnerSurvey }}
        primaryEvent="early_access_joined"
      />
    </>
  );
}

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Container, Eyebrow } from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { LaunchBadge } from "@/components/marketing/launch-badge";
import { EarlyAccessForm } from "@/components/forms/early-access-form";

export const metadata: Metadata = buildMetadata({
  title: "The NexaHaus Founding 100",
  description:
    "Be among the first 100 property owners to join the NexaHaus journey — early access, priority onboarding, a voice in property-owner research and early product feedback.",
  path: routes.founding100,
});

const BENEFITS = [
  "Early access to NexaHaus services and NexaHaus Connect",
  "Priority onboarding when the Accra office opens",
  "Participation in property-owner research",
  "Early product feedback",
  "Access to selected property education and events",
  "Launch communications",
];

export default function Founding100Page() {
  return (
    <div className="bg-surface">
      <Container className="py-10">
        <Breadcrumbs
          trail={[
            { label: "Early Access", href: routes.earlyAccess },
            { label: "Founding 100", href: routes.founding100 },
          ]}
        />
      </Container>

      <Container className="grid gap-12 pb-20 pt-2 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>The NexaHaus Founding 100</Eyebrow>
            <LaunchBadge />
          </div>
          <h1 className="nx-display mt-3 text-display-md text-navy-900">
            Be Among the First 100 Property Owners to Join the NexaHaus Journey.
          </h1>
          <p className="mt-4 text-ink-muted">
            The Founding 100 is a small group of owners who help shape NexaHaus before it
            opens. Members get in early and have a real voice in how the service works.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink-muted">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-ink-subtle">
            No financial commitment, and no promise of a discount — the value is early
            access and influence.
          </p>
        </div>

        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6 sm:p-8">
          <EarlyAccessForm lockCampaign="FOUNDING_100" />
        </div>
      </Container>
    </div>
  );
}

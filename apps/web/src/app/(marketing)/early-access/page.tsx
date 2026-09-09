import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Container, Eyebrow } from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { LaunchBadge } from "@/components/marketing/launch-badge";
import { EarlyAccessForm } from "@/components/forms/early-access-form";
import { LAUNCH } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Early Access",
  description:
    "NexaHaus is being built with property owners, not just for them. Join Early Access to help shape the service and be among the first owners onboarded when the Accra office opens.",
  path: routes.earlyAccess,
});

export default function EarlyAccessPage() {
  return (
    <div className="bg-surface">
      <Container className="py-10">
        <Breadcrumbs trail={[{ label: "Early Access", href: routes.earlyAccess }]} />
      </Container>

      <Container className="grid gap-12 pb-20 pt-2 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>Early Access</Eyebrow>
            <LaunchBadge />
          </div>
          <h1 className="nx-display mt-3 text-display-md text-navy-900">
            NexaHaus Is Being Built With Property Owners, Not Just For Them.
          </h1>
          <p className="mt-4 text-ink-muted">
            Our first office is scheduled to open in {LAUNCH.city} in {LAUNCH.label}. The
            work starts before the doors open — we are speaking with property owners now to
            understand the real challenges they face and build our services around those
            needs.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink-muted">
            {[
              "Early access to NexaHaus services and NexaHaus Connect",
              "Priority onboarding when the Accra office opens",
              "A say in property-owner research and early product feedback",
              "Launch communications",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-subtle">
            Prefer to help with research first?{" "}
            <a href={routes.propertyOwnerSurvey} className="font-medium text-navy-700 underline underline-offset-2">
              Take the Property Owner Survey
            </a>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <EarlyAccessForm />
        </div>
      </Container>
    </div>
  );
}

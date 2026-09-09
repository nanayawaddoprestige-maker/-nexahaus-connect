import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Container, Eyebrow } from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { PropertyOwnerSurveyForm } from "@/components/forms/property-owner-survey-form";

export const metadata: Metadata = buildMetadata({
  title: "Property Owner Survey",
  description:
    "Help shape professional property management in Ghana. A five-step survey about how you own and manage property, the challenges you face, and what you would want from a professional partner.",
  path: routes.propertyOwnerSurvey,
});

export default function PropertyOwnerSurveyPage() {
  return (
    <div className="bg-surface">
      <Container className="py-10">
        <Breadcrumbs trail={[{ label: "Property Owner Survey", href: routes.propertyOwnerSurvey }]} />
      </Container>

      <Container className="grid gap-12 pb-20 pt-2 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <Eyebrow>Property Owner Survey</Eyebrow>
          <h1 className="nx-display mt-3 text-display-md text-navy-900">
            NexaHaus is being built with property owners, not just for them.
          </h1>
          <p className="mt-4 text-ink-muted">
            We are speaking with owners now to understand the real challenges of owning
            and managing property in Ghana. Five short steps, about four minutes. Your
            answers directly shape the services we build.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink-muted">
            {[
              "About you and where you are based",
              "Your properties and how they are managed",
              "The challenges you face",
              "What you would value from a professional partner",
              "How to reach you",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-prose text-xs text-ink-subtle">
            Your responses are used to understand demand and improve our services. We only
            collect what is needed for that purpose, and you can withdraw consent at any
            time. See our{" "}
            <a href={routes.privacy} className="underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <PropertyOwnerSurveyForm />
        </div>
      </Container>
    </div>
  );
}

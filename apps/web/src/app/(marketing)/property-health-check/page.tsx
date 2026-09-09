import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Container, Eyebrow } from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { HealthCheckForm } from "@/components/forms/health-check-form";

const CATEGORIES = [
  "Occupancy",
  "Rent Collection",
  "Maintenance",
  "Property Condition",
  "Tenant Experience",
  "Documentation",
  "Security",
  "Financial Performance",
];

export const metadata: Metadata = buildMetadata({
  title: "Property Health Check",
  description:
    "Answer a few questions about your property in Ghana and get a preliminary Property Health Score straight away, plus the areas most likely to need attention. About two minutes.",
  path: routes.propertyHealthCheck,
  keywords: ["property assessment Ghana", "property health check", "rental property review Ghana"],
});

export default function PropertyHealthCheckPage() {
  return (
    <div className="bg-surface">
      <Container className="py-10">
        <Breadcrumbs trail={[{ label: "Property Health Check", href: routes.propertyHealthCheck }]} />
      </Container>

      <Container className="grid gap-12 pb-20 pt-2 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <Eyebrow>Property Health Check</Eyebrow>
          <h1 className="nx-display mt-3 text-display-md text-navy-900">
            Know the Health of Your Property.
          </h1>
          <p className="mt-4 text-ink-muted">
            Six short steps, about two minutes. You&rsquo;ll get a preliminary Property
            Health Score straight away, plus the areas most likely to need attention.
          </p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            What the score looks at
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-ink-muted">
            {CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-gold-500" />
                {c}
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-prose text-xs text-ink-subtle">
            The Property Health Score is a NexaHaus management assessment framework. It is
            a preliminary digital assessment based on your own answers — not a professional
            property assessment, valuation, legal opinion or investment recommendation.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <HealthCheckForm />
        </div>
      </Container>
    </div>
  );
}

import { Container, Eyebrow } from "./primitives";
import { Cta } from "./cta";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { ServiceJsonLd } from "./jsonld";
import { cta as siteCta } from "@/lib/routes";

/**
 * Shared top-of-page block for service / audience pages: breadcrumb + eyebrow +
 * H1 + lede + primary/secondary CTAs, and (optionally) Service structured data.
 */
export function ServiceHero({
  eyebrow,
  title,
  lede,
  breadcrumb,
  jsonLd,
  primary = {
    label: "Request Property Assessment",
    href: siteCta.primary.href,
  },
  secondary = { label: "Join Early Access", href: siteCta.secondary.href },
}: {
  eyebrow: string;
  title: string;
  lede: string;
  breadcrumb: Crumb[];
  jsonLd?: { name: string; description: string; path: string };
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="border-b border-line bg-surface-sunken">
      {jsonLd ? <ServiceJsonLd {...jsonLd} /> : null}
      <Container className="py-10">
        <Breadcrumbs trail={breadcrumb} />
      </Container>
      <Container className="pb-16 pt-2">
        <div className="max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="nx-display mt-3 text-display-lg text-navy-900">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{lede}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta
              href={primary.href}
              size="lg"
              event="assessment_requested"
              eventProps={{ location: "service_hero" }}
            >
              {primary.label}
            </Cta>
            <Cta href={secondary.href} variant="secondary" size="lg">
              {secondary.label}
            </Cta>
          </div>
        </div>
      </Container>
    </section>
  );
}

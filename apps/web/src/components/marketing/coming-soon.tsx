import { Container, Eyebrow } from "./primitives";
import { Cta } from "./cta";
import { LaunchBadge } from "./launch-badge";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/**
 * Honest placeholder for a page whose full build lands in a later phase
 * (brief §69: clearly labelled "Coming Soon", never a fake). Still gives the
 * visitor a real next step.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  bullets,
  breadcrumb,
  primary = { label: "Join Early Access", href: "/early-access" },
  secondary = { label: "Request Property Assessment", href: "/property-health-check" },
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  breadcrumb: Crumb[];
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="bg-surface">
      <Container className="py-10">
        <Breadcrumbs trail={breadcrumb} />
      </Container>
      <Container className="pb-20 pt-2">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>{eyebrow}</Eyebrow>
            <LaunchBadge />
          </div>
          <h1 className="nx-display mt-4 text-display-lg text-navy-900">{title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{description}</p>

          {bullets?.length ? (
            <ul className="mt-6 space-y-2 text-sm text-ink-muted">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={primary.href} size="lg">
              {primary.label}
            </Cta>
            <Cta href={secondary.href} variant="secondary" size="lg">
              {secondary.label}
            </Cta>
          </div>

          <p className="mt-6 text-xs text-ink-subtle">
            This page is being built. Nothing on it is final and no details shown are
            promotional commitments.
          </p>
        </div>
      </Container>
    </div>
  );
}

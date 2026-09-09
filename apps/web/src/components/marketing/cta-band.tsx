import { Section } from "./primitives";
import { Cta } from "./cta";
import { cta as siteCta } from "@/lib/routes";
import type { AnalyticsEvent } from "@/lib/analytics";

/** Standard closing call-to-action band used at the foot of most pages. */
export function CtaBand({
  title,
  body,
  primary = { label: siteCta.primary.label, href: siteCta.primary.href },
  secondary = { label: siteCta.secondary.label, href: siteCta.secondary.href },
  primaryEvent = "assessment_requested",
  location = "page_footer",
}: {
  title: string;
  body?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string } | null;
  primaryEvent?: AnalyticsEvent;
  location?: string;
}) {
  return (
    <Section tone="navy" ariaLabel="Get started">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="nx-display text-display-md text-white">{title}</h2>
        {body ? <p className="mt-3 text-navy-100">{body}</p> : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Cta href={primary.href} variant="gold" size="lg" event={primaryEvent} eventProps={{ location }}>
            {primary.label}
          </Cta>
          {secondary ? (
            <Cta href={secondary.href} variant="onNavy" size="lg" eventProps={{ location }}>
              {secondary.label}
            </Cta>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

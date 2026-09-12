import { Section, SectionHeader } from "@/components/marketing/primitives";
import { Cta } from "@/components/marketing/cta";
import { earlyAccess, founding100 } from "./content";

export function EarlyAccess() {
  return (
    <Section id="early-access">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow={earlyAccess.eyebrow}
            title={earlyAccess.headline}
          />
          {earlyAccess.body.map((p) => (
            <p key={p} className="mt-4 max-w-xl text-ink-muted">
              {p}
            </p>
          ))}
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta
              href={earlyAccess.primary.href}
              size="lg"
              event="early_access_joined"
              eventProps={{ location: "home" }}
            >
              {earlyAccess.primary.label}
            </Cta>
            <Cta
              href={earlyAccess.secondary.href}
              variant="secondary"
              size="lg"
            >
              {earlyAccess.secondary.label}
            </Cta>
          </div>
        </div>

        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-8">
          <p className="nx-eyebrow">{founding100.eyebrow}</p>
          <h3 className="nx-display mt-2 text-display-md text-navy-900">
            {founding100.headline}
          </h3>
          <p className="mt-3 text-sm text-ink-muted">{founding100.body}</p>
          <ul className="mt-5 space-y-2 text-sm text-ink-muted">
            {founding100.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"
                />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Cta
              href={founding100.cta.href}
              variant="primary"
              size="md"
              eventProps={{ location: "home_founding" }}
            >
              {founding100.cta.label}
            </Cta>
          </div>
        </div>
      </div>
    </Section>
  );
}

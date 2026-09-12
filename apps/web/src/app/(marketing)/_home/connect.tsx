import { Section, SectionHeader } from "@/components/marketing/primitives";
import { Cta } from "@/components/marketing/cta";
import { ClientLoginLink } from "@/components/marketing/client-login-link";
import { PortfolioPanel } from "@/components/connect-preview/portfolio-panel";
import { connect } from "./content";

export function ConnectSection() {
  return (
    <Section id="nexahaus-connect">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeader
            eyebrow={connect.eyebrow}
            title={connect.headline}
            lede={connect.body}
          />

          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-ink-muted sm:grid-cols-4 lg:grid-cols-2">
            {connect.modules.map((m) => (
              <li key={m} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-1 w-1 shrink-0 rounded-full bg-gold-500"
                />
                {m}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Cta
              href={connect.primary.href}
              size="lg"
              event="connect_preview_viewed"
              eventProps={{ location: "home" }}
            >
              {connect.primary.label}
            </Cta>
            <ClientLoginLink className="border border-line text-navy-800 hover:bg-surface-sunken" />
          </div>
        </div>

        <PortfolioPanel
          data={{
            label: connect.dashboard.label,
            stats: [...connect.dashboard.stats],
            finance: [...connect.dashboard.finance],
            portfolioHealth: connect.dashboard.portfolioHealth,
          }}
        />
      </div>
    </Section>
  );
}

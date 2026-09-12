import Image from "next/image";
import { Container, Eyebrow } from "@/components/marketing/primitives";
import { Cta } from "@/components/marketing/cta";
import { LaunchBadge } from "@/components/marketing/launch-badge";
import { COMPANY, MEDIA } from "@/lib/site-config";
import { hero } from "./content";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      {/* restrained depth — no loud gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(60rem 40rem at 85% -10%, rgba(201,162,39,0.12), transparent 60%)",
        }}
      />
      <Container className="relative py-20 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow onNavy>{COMPANY.legalName.replace(" Ltd.", "")}</Eyebrow>
              <LaunchBadge onNavy />
            </div>

            <h1 className="nx-display mt-5 text-display-2xl text-white">
              {hero.headline}
            </h1>
            <p className="mt-5 text-lg font-medium text-navy-100 sm:text-xl">
              {hero.subhead}
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-navy-200">
              {hero.body}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Cta
                href={hero.primaryCta.href}
                variant="gold"
                size="lg"
                event="assessment_requested"
                eventProps={{ location: "hero" }}
              >
                {hero.primaryCta.label}
              </Cta>
              <Cta
                href={hero.secondaryCta.href}
                variant="onNavy"
                size="lg"
                eventProps={{ location: "hero" }}
              >
                {hero.secondaryCta.label}
              </Cta>
            </div>
          </div>

          <div className="lg:justify-self-end">
            {MEDIA.heroImage ? (
              <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 shadow-raised">
                <Image
                  src={MEDIA.heroImage}
                  alt={MEDIA.heroImageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <HeroPanel />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Designed hero visual used until real photography is supplied: a restrained
 * preview of the kind of view NexaHaus Connect gives an owner. Clearly labelled
 * illustrative; all figures are placeholders (brief §33, §45).
 */
function HeroPanel() {
  const rows: [string, string][] = [
    ["Expected rent", "GHS 28,500"],
    ["Collected", "GHS 24,500"],
    ["Outstanding", "GHS 4,000"],
  ];
  return (
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-raised backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy-200">
          Portfolio overview
        </span>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium text-navy-200">
          Illustrative interface
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          ["5", "Properties"],
          ["4", "Occupied"],
          ["87", "Health / 100"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-lg bg-navy-800/60 p-3 text-center">
            <div className="text-xl font-semibold tabular-nums text-white">
              {v}
            </div>
            <div className="mt-0.5 text-[11px] text-navy-200">{l}</div>
          </div>
        ))}
      </div>

      <dl className="mt-4 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <dt className="text-navy-200">{k}</dt>
            <dd className="font-medium tabular-nums text-white">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-navy-800">
        <div
          className="h-full rounded-full bg-gold-400"
          style={{ width: "86%" }}
        />
      </div>
      <p className="mt-2 text-[11px] text-navy-300">
        86% of expected rent collected this period · example data
      </p>
    </div>
  );
}

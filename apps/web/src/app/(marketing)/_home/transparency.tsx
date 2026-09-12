import { Section, SectionHeader } from "@/components/marketing/primitives";
import { transparency } from "./content";

export function Transparency() {
  return (
    <Section id="transparency">
      <SectionHeader
        eyebrow={transparency.eyebrow}
        title={transparency.headline}
      />

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {transparency.principles.map((p, i) => (
          <div key={p.title} className="bg-surface p-6">
            <span className="text-xs font-semibold tabular-nums text-gold-600">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-base font-semibold text-navy-900">
              {p.title}
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

import Link from "next/link";
import { Section, SectionHeader } from "@/components/marketing/primitives";
import { InsightCard } from "@/components/marketing/insight-card";
import { getFeaturedInsights } from "@/content/insights";
import { insightsTeaser } from "./content";

export function InsightsTeaser() {
  const articles = getFeaturedInsights(3);

  return (
    <Section tone="sunken" id="insights">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader eyebrow={insightsTeaser.eyebrow} title={insightsTeaser.headline} lede={insightsTeaser.body} />
        <Link
          href={insightsTeaser.cta.href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-navy-800 hover:text-navy-900"
        >
          {insightsTeaser.cta.label} <span aria-hidden>→</span>
        </Link>
      </div>

      {articles.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <InsightCard key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <>
          <ul className="mt-8 flex flex-wrap gap-2">
            {insightsTeaser.categories.map((c) => (
              <li
                key={c}
                className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted"
              >
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-prose text-sm text-ink-subtle">
            The first guides are being written now. Join Early Access to get them as they
            publish.
          </p>
        </>
      )}
    </Section>
  );
}

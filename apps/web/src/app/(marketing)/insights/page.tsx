import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";
import {
  Container,
  Section,
  SectionHeader,
} from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { InsightCard } from "@/components/marketing/insight-card";
import { ComingSoon } from "@/components/marketing/coming-soon";
import {
  INSIGHT_CATEGORIES,
  getAllInsights,
  getFeaturedInsights,
  getInsightsByCategory,
  type InsightCategory,
} from "@/content/insights";

export const metadata: Metadata = buildMetadata({
  title: "Insights",
  description:
    "Practical property-management knowledge for owners in Ghana and the diaspora — rent collection, maintenance, inspections, documents and asset performance.",
  path: routes.insights,
  keywords: [
    "property management Ghana",
    "landlord education Ghana",
    "diaspora property Ghana",
  ],
});

function isInsightCategory(
  value: string | undefined,
): value is InsightCategory {
  return !!value && (INSIGHT_CATEGORIES as readonly string[]).includes(value);
}

export default function InsightsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const allArticles = getAllInsights();

  // Phase 1 shipped this as an honest placeholder while the first articles
  // were being written; Phase 5 replaces it once real content exists.
  if (allArticles.length === 0) {
    return (
      <ComingSoon
        eyebrow="Insights"
        title="A property-management knowledge platform for Ghana."
        description="We are writing a library of practical, no-fluff guides for property owners: what to expect from a professional manager, how to read a rental performance report, why diaspora owners need regular inspections, and how preventive maintenance protects value."
        bullets={INSIGHT_CATEGORIES.map((c) => `${c}`)}
        breadcrumb={[{ label: "Insights", href: routes.insights }]}
        primary={{
          label: "Join Early Access for first access",
          href: routes.earlyAccess,
        }}
        secondary={{
          label: "Take the Property Owner Survey",
          href: routes.propertyOwnerSurvey,
        }}
      />
    );
  }

  const activeCategory = isInsightCategory(searchParams.category)
    ? searchParams.category
    : undefined;
  const featured = activeCategory ? [] : getFeaturedInsights(3);
  const listed = activeCategory
    ? getInsightsByCategory(activeCategory)
    : allArticles;
  const usedCategories = INSIGHT_CATEGORIES.filter((c) =>
    allArticles.some((a) => a.category === c),
  );

  return (
    <>
      <section className="border-b border-line bg-surface-sunken">
        <Container className="py-10">
          <Breadcrumbs trail={[{ label: "Insights", href: routes.insights }]} />
        </Container>
        <Container className="pb-14 pt-2">
          <div className="max-w-3xl">
            <p className="nx-eyebrow">Insights</p>
            <h1 className="nx-display mt-3 text-display-lg text-navy-900">
              Practical knowledge for property owners.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              No-fluff guides on managing, protecting and understanding a
              property in Ghana — written for owners, not for search engines.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href={routes.insights}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                !activeCategory
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-line bg-surface text-ink-muted hover:border-navy-300",
              )}
            >
              All
            </Link>
            {usedCategories.map((c) => (
              <Link
                key={c}
                href={`${routes.insights}?category=${encodeURIComponent(c)}`}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === c
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-line bg-surface text-ink-muted hover:border-navy-300",
                )}
              >
                {c}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {featured.length > 0 ? (
        <Section ariaLabel="Featured insights">
          <SectionHeader eyebrow="Start here" title="Featured" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => (
              <InsightCard key={a.slug} article={a} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone={featured.length > 0 ? "sunken" : "default"}>
        <SectionHeader
          eyebrow={activeCategory ?? "All articles"}
          title={activeCategory ? activeCategory : "Every guide"}
        />
        {listed.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listed.map((a) => (
              <InsightCard key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <p className="mt-8 max-w-prose text-sm text-ink-subtle">
            No published articles in this category yet.
          </p>
        )}
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ComingSoon } from "@/components/marketing/coming-soon";
import { INSIGHT_CATEGORIES, getAllInsights } from "@/content/insights";

export const metadata: Metadata = buildMetadata({
  title: "Insights",
  description:
    "Practical property-management knowledge for owners in Ghana and the diaspora — rent collection, maintenance, inspections, asset performance and property technology.",
  path: routes.insights,
  keywords: ["property management Ghana", "landlord education Ghana", "diaspora property Ghana"],
});

export default function InsightsPage() {
  const articles = getAllInsights();

  // Phase 5 replaces this with the full editorial listing. Until the first
  // articles are published we show an honest placeholder — never filler posts.
  if (articles.length === 0) {
    return (
      <ComingSoon
        eyebrow="Insights"
        title="A property-management knowledge platform for Ghana."
        description="We are writing a library of practical, no-fluff guides for property owners: what to expect from a professional manager, how to read a rental performance report, why diaspora owners need regular inspections, and how preventive maintenance protects value."
        bullets={INSIGHT_CATEGORIES.map((c) => `${c}`)}
        breadcrumb={[{ label: "Insights", href: routes.insights }]}
        primary={{ label: "Join Early Access for first access", href: routes.earlyAccess }}
        secondary={{ label: "Take the Property Owner Survey", href: routes.propertyOwnerSurvey }}
      />
    );
  }

  return null;
}

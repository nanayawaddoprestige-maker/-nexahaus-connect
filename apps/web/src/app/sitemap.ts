import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { sitemapRoutes, routes } from "@/lib/routes";
import { getAllInsightSlugs } from "@/content/insights";

const HIGH_PRIORITY = new Set<string>([
  routes.propertyManagement,
  routes.assetManagement,
  routes.diaspora,
  routes.propertyRescue,
  routes.propertyHealthCheck,
]);

const LOW_PRIORITY = new Set<string>([
  routes.privacy,
  routes.terms,
  routes.cookies,
]);

function priorityFor(path: string): number {
  if (path === routes.home) return 1;
  if (HIGH_PRIORITY.has(path)) return 0.9;
  if (LOW_PRIORITY.has(path)) return 0.3;
  return 0.7;
}

/**
 * Static marketing routes plus every published Insights article. When Insights
 * moves to a CMS, `getAllInsightSlugs` is the single seam to update.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = sitemapRoutes.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified: now,
    changeFrequency: path === routes.insights ? "weekly" : "monthly",
    priority: priorityFor(path),
  }));

  const insightEntries: MetadataRoute.Sitemap = getAllInsightSlugs().map(
    (slug) => ({
      url: new URL(`${routes.insights}/${slug}`, SITE_URL).toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    }),
  );

  return [...staticEntries, ...insightEntries];
}

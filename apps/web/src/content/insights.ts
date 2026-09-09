/**
 * Insights content layer.
 *
 * Phase 1 ships the typed interface and an empty article set. Phase 5 fills
 * `articles` with real, education-first pieces (MDX or structured data). When
 * Insights later moves to a CMS or the NestJS API, only the four accessor
 * functions below change — pages, sitemap and metadata consume these and never
 * touch the storage.
 *
 * No fabricated statistics, clients, or case studies (brief §33, §69).
 */

export const INSIGHT_CATEGORIES = [
  "Property Management",
  "Ghana Property Market",
  "Diaspora",
  "Property Investment",
  "Maintenance",
  "Asset Management",
  "Property Technology",
  "Landlord Education",
  "Tenant Management",
] as const;

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export interface InsightMeta {
  slug: string;
  title: string;
  description: string;
  category: InsightCategory;
  /** Byline. Use "NexaHaus" until named authors are confirmed. */
  author: string;
  /** ISO date (YYYY-MM-DD). */
  publishedAt: string;
  updatedAt?: string;
  /** Whole minutes; computed from body length when omitted. */
  readingMinutes?: number;
  /** Root-relative hero image path, or omit for the category placeholder. */
  heroImage?: string;
  heroAlt?: string;
  draft?: boolean;
  featured?: boolean;
}

export interface Insight extends InsightMeta {
  /** Article body as an ordered list of blocks (renderer in Phase 5). */
  body: InsightBlock[];
}

export type InsightBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; text: string };

/** All published articles, newest first. Filled in Phase 5. */
const articles: Insight[] = [];

function published(): Insight[] {
  return articles
    .filter((a) => !a.draft)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getAllInsights(): InsightMeta[] {
  return published().map(stripBody);
}

export function getInsightsByCategory(category: InsightCategory): InsightMeta[] {
  return published().filter((a) => a.category === category).map(stripBody);
}

export function getFeaturedInsights(limit = 3): InsightMeta[] {
  const feat = published().filter((a) => a.featured);
  return (feat.length ? feat : published()).slice(0, limit).map(stripBody);
}

export function getInsight(slug: string): Insight | null {
  return published().find((a) => a.slug === slug) ?? null;
}

export function getRelatedInsights(slug: string, limit = 3): InsightMeta[] {
  const current = getInsight(slug);
  if (!current) return [];
  return published()
    .filter((a) => a.slug !== slug)
    .sort((a, b) => {
      const score = (x: Insight) => (x.category === current.category ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, limit)
    .map(stripBody);
}

export function getAllInsightSlugs(): string[] {
  return published().map((a) => a.slug);
}

export function estimateReadingMinutes(body: InsightBlock[]): number {
  const words = body.reduce((n, b) => {
    if ("text" in b) return n + b.text.split(/\s+/).length;
    if ("items" in b) return n + b.items.join(" ").split(/\s+/).length;
    return n;
  }, 0);
  return Math.max(1, Math.round(words / 220));
}

function stripBody(a: Insight): InsightMeta {
  const { body: _body, ...meta } = a;
  return {
    ...meta,
    readingMinutes: a.readingMinutes ?? estimateReadingMinutes(a.body),
  };
}

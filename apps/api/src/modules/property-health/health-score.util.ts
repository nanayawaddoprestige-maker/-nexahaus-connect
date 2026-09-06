import { HealthComponentKey } from "@nexahaus/types";

export type ComponentKey = (typeof HealthComponentKey)[keyof typeof HealthComponentKey];

/** A single factor's normalised value in [0, 1] plus how it was derived. */
export interface FactorInput {
  key: ComponentKey;
  /** 0..1 — 1 is best. */
  value: number;
  /** Human note explaining the value, shown to the owner. */
  basis: string;
  /** "actual" (from data), "estimate", or "assumption" (no data yet). */
  confidence: "actual" | "estimate" | "assumption";
}

export interface ScoreComponent extends FactorInput {
  weight: number;
  /** value * weight * 100, rounded to 2dp for display. */
  weightedScore: number;
}

export interface ScoreResult {
  score: number; // 0..100 integer
  components: ScoreComponent[];
  recommendations: string[];
}

const RECOMMENDATION_BY_KEY: Record<ComponentKey, string> = {
  OCCUPANCY: "Reduce vacancy — review pricing and marketing for empty units.",
  RENT_COLLECTION: "Tighten rent collection — follow up arrears and consider payment reminders.",
  MAINTENANCE: "Clear the maintenance backlog and set up preventive maintenance.",
  CONDITION: "Address the issues flagged in the latest inspection.",
  TENANT_SATISFACTION: "Check in with tenants; unresolved issues drive turnover.",
  DOCUMENTATION: "Upload the missing property documents and renew anything expiring.",
  SECURITY: "Review security and compliance items for this property.",
  FINANCIAL: "Review the property's cost base and rental position against the market.",
};

/**
 * Weighted-sum health score (spec §11). Weights come from the active
 * HealthScoreConfig; missing weights default to an even split of whatever is
 * left. The score is deterministic given the same factor inputs and weights.
 * Recommendations are generated from the lowest-scoring weighted components.
 */
export function computeHealthScore(
  factors: FactorInput[],
  weights: Partial<Record<ComponentKey, number>>,
): ScoreResult {
  const totalWeight = Object.values(weights).reduce((s, w) => s + (w ?? 0), 0);
  const evenFallback =
    factors.length > 0 ? Math.max(0, (1 - totalWeight)) / factors.length : 0;

  const components: ScoreComponent[] = factors.map((f) => {
    const weight = weights[f.key] ?? evenFallback;
    const clamped = Math.max(0, Math.min(1, f.value));
    return {
      ...f,
      value: clamped,
      weight,
      weightedScore: round2(clamped * weight * 100),
    };
  });

  const weightSum = components.reduce((s, c) => s + c.weight, 0) || 1;
  const raw = components.reduce((s, c) => s + c.value * c.weight, 0) / weightSum;
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)));

  const recommendations = [...components]
    .filter((c) => c.value < 0.75)
    .sort((a, b) => a.value * a.weight - b.value * b.weight)
    .slice(0, 4)
    .map((c) => RECOMMENDATION_BY_KEY[c.key]);

  return { score, components, recommendations };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Map an inspection overall-condition to a 0..1 factor value. */
export function conditionToValue(
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | null | undefined,
): number {
  switch (condition) {
    case "EXCELLENT":
      return 1;
    case "GOOD":
      return 0.85;
    case "FAIR":
      return 0.6;
    case "POOR":
      return 0.3;
    default:
      return 0.7; // no inspection yet — neutral-ish
  }
}

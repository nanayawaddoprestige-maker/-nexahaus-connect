import {
  computeHealthScore,
  conditionToValue,
  type FactorInput,
} from "./health-score.util";

const f = (key: FactorInput["key"], value: number): FactorInput => ({
  key,
  value,
  basis: "test",
  confidence: "actual",
});

const WEIGHTS = {
  OCCUPANCY: 0.2,
  RENT_COLLECTION: 0.2,
  MAINTENANCE: 0.15,
  CONDITION: 0.15,
  TENANT_SATISFACTION: 0.1,
  DOCUMENTATION: 0.1,
  SECURITY: 0.05,
  FINANCIAL: 0.05,
};

describe("computeHealthScore (spec §11)", () => {
  const factors = [
    f("OCCUPANCY", 1),
    f("RENT_COLLECTION", 0.98),
    f("MAINTENANCE", 0.92),
    f("CONDITION", 0.9),
    f("TENANT_SATISFACTION", 0.88),
    f("DOCUMENTATION", 0.95),
    f("SECURITY", 0.94),
    f("FINANCIAL", 0.9),
  ];

  it("is a deterministic weighted sum, 0..100", () => {
    const a = computeHealthScore(factors, WEIGHTS);
    const b = computeHealthScore(factors, WEIGHTS);
    expect(a.score).toBe(b.score);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
    // Σ(value*weight)/Σweight ≈ 0.944 → 94
    expect(a.score).toBe(94);
  });

  it("returns a weighted component for every factor", () => {
    const res = computeHealthScore(factors, WEIGHTS);
    expect(res.components).toHaveLength(8);
    const occ = res.components.find((c) => c.key === "OCCUPANCY")!;
    expect(occ.weight).toBe(0.2);
    expect(occ.weightedScore).toBe(20); // 1 * 0.2 * 100
  });

  it("changing the config weights changes the score", () => {
    const heavyOnCollection = {
      ...WEIGHTS,
      RENT_COLLECTION: 0.5,
      OCCUPANCY: 0.05,
    };
    const poorCollection = factors.map((x) =>
      x.key === "RENT_COLLECTION" ? f("RENT_COLLECTION", 0.4) : x,
    );
    const base = computeHealthScore(poorCollection, WEIGHTS).score;
    const weighted = computeHealthScore(
      poorCollection,
      heavyOnCollection,
    ).score;
    expect(weighted).toBeLessThan(base);
  });

  it("recommends fixes for the lowest-scoring components, worst first", () => {
    const res = computeHealthScore(
      [
        f("OCCUPANCY", 0.5),
        f("RENT_COLLECTION", 0.4),
        f("MAINTENANCE", 0.6),
        f("CONDITION", 0.95),
      ],
      WEIGHTS,
    );
    expect(res.recommendations[0]).toMatch(/rent collection/i);
    expect(res.recommendations).not.toContain(
      "Address the issues flagged in the latest inspection.",
    );
  });

  it("evenly splits leftover weight when a factor has no configured weight", () => {
    const res = computeHealthScore([f("OCCUPANCY", 1), f("FINANCIAL", 0)], {
      OCCUPANCY: 0.5,
    });
    // leftover 0.5 → FINANCIAL weight 0.25; score = (1*0.5 + 0*0.25)/0.75 ≈ 0.667
    expect(res.score).toBe(67);
  });

  it("maps inspection condition to a factor value", () => {
    expect(conditionToValue("EXCELLENT")).toBe(1);
    expect(conditionToValue("POOR")).toBe(0.3);
    expect(conditionToValue(null)).toBe(0.7);
  });
});

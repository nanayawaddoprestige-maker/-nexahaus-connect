import { LeadGrade } from "@nexahaus/types";

export interface LeadScoreInputs {
  propertyCount?: number | null;
  /** Total estimated portfolio value in minor units (optional). */
  portfolioValueMinor?: bigint | null;
  livesInGhana?: boolean | null;
  /** Free text, matched loosely for the diaspora bump when livesInGhana is null. */
  location?: string | null;
  /** "biggest problem" free text — non-empty implies a management need. */
  biggestChallenge?: string | null;
  serviceInterest?: string[] | null;
  assessmentCompleted?: boolean;
  consultationBooked?: boolean;
  /** Count of logged activities/touchpoints. */
  engagementTouches?: number;
}

export interface LeadScoreConfigShape {
  factors: {
    propertyCount?: { weight: number; bands?: [number, number][] };
    diaspora?: { weight: number };
    managementNeed?: { weight: number };
    assessmentCompleted?: { weight: number };
    consultationBooked?: { weight: number };
    engagement?: { weight: number };
    portfolioValue?: { weight: number; thresholdMinor?: string };
    serviceInterest?: { weight: number };
    grades: { A: number; B: number; C: number; D: number };
  };
}

export interface LeadScoreResult {
  score: number; // 0..100 clamped
  grade: LeadGrade;
  breakdown: { factor: string; points: number }[];
}

const DEFAULT: LeadScoreConfigShape["factors"] = {
  propertyCount: {
    weight: 20,
    bands: [
      [1, 5],
      [2, 12],
      [4, 20],
    ],
  },
  diaspora: { weight: 15 },
  managementNeed: { weight: 15 },
  assessmentCompleted: { weight: 20 },
  consultationBooked: { weight: 20 },
  engagement: { weight: 10 },
  grades: { A: 75, B: 55, C: 35, D: 0 },
};

/**
 * Configurable lead scoring (spec §74). Every factor's contribution is bounded
 * by its configured weight; the raw total is clamped to 0..100 and mapped to a
 * grade by the configured thresholds. Deterministic for the same inputs+config.
 */
export function computeLeadScore(
  inputs: LeadScoreInputs,
  config?: Partial<LeadScoreConfigShape["factors"]>,
): LeadScoreResult {
  const f = { ...DEFAULT, ...(config ?? {}) };
  const breakdown: { factor: string; points: number }[] = [];
  const add = (factor: string, points: number) => {
    if (points > 0) breakdown.push({ factor, points: round(points) });
    return points;
  };

  let total = 0;

  // Property count — banded, capped at the factor weight.
  const bands = f.propertyCount?.bands ?? DEFAULT.propertyCount!.bands!;
  const count = inputs.propertyCount ?? 0;
  let pcPoints = 0;
  for (const [threshold, pts] of bands) {
    if (count >= threshold)
      pcPoints = Math.min(pts, f.propertyCount?.weight ?? 20);
  }
  total += add("propertyCount", pcPoints);

  // Diaspora — explicit flag, else infer from location text.
  const isDiaspora =
    inputs.livesInGhana === false ||
    (inputs.livesInGhana == null &&
      !!inputs.location &&
      !/ghana|accra|kumasi|takoradi|tema/i.test(inputs.location));
  if (isDiaspora) total += add("diaspora", f.diaspora?.weight ?? 15);

  // Management need — a stated problem.
  if (inputs.biggestChallenge && inputs.biggestChallenge.trim().length > 3) {
    total += add("managementNeed", f.managementNeed?.weight ?? 15);
  }

  // Funnel progress.
  if (inputs.assessmentCompleted) {
    total += add("assessmentCompleted", f.assessmentCompleted?.weight ?? 20);
  }
  if (inputs.consultationBooked) {
    total += add("consultationBooked", f.consultationBooked?.weight ?? 20);
  }

  // Engagement — 2 points per touch up to the weight.
  const engPoints = Math.min(
    (inputs.engagementTouches ?? 0) * 2,
    f.engagement?.weight ?? 10,
  );
  total += add("engagement", engPoints);

  // Optional value + interest factors.
  if (
    f.portfolioValue &&
    inputs.portfolioValueMinor &&
    f.portfolioValue.thresholdMinor
  ) {
    if (inputs.portfolioValueMinor >= BigInt(f.portfolioValue.thresholdMinor)) {
      total += add("portfolioValue", f.portfolioValue.weight);
    }
  }
  if (f.serviceInterest && (inputs.serviceInterest?.length ?? 0) > 0) {
    total += add("serviceInterest", f.serviceInterest.weight);
  }

  const score = Math.max(0, Math.min(100, Math.round(total)));
  const g = f.grades;
  const grade: LeadGrade =
    score >= g.A
      ? LeadGrade.A
      : score >= g.B
        ? LeadGrade.B
        : score >= g.C
          ? LeadGrade.C
          : LeadGrade.D;

  return { score, grade, breakdown };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

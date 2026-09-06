export interface LeadRow {
  id: string;
  ref: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  score: number;
  grade: string;
  propertyCount: number | null;
  location: string | null;
  owner: { id: string; fullName: string } | null;
  activityCount: number;
  createdAt: string;
}

export interface LeadDetail {
  id: string;
  ref: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  campaign: string | null;
  segment: string | null;
  status: string;
  score: number;
  grade: string;
  propertyCount: number | null;
  propertyType: string | null;
  location: string | null;
  livesInGhana: boolean | null;
  biggestChallenge: string | null;
  serviceInterest: string[];
  owner: { id: string; fullName: string } | null;
  convertedClientId: string | null;
  activities: {
    id: string;
    type: string;
    body: string;
    by: string;
    occurredAt: string;
    dueAt: string | null;
  }[];
  healthChecks: { id: string; preliminaryScore: number; createdAt: string }[];
  surveyResponses: number;
  createdAt: string;
  scoreBreakdown?: { factor: string; points: number }[];
}

export interface PipelineStage {
  status: string;
  count: number;
  averageScore: number;
}

export const LEAD_STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONSULTATION",
  "ASSESSMENT",
  "PROPOSAL",
  "WON",
  "LOST",
] as const;

export const GRADE_TONE: Record<string, "positive" | "warning" | "info" | "neutral"> = {
  A: "positive",
  B: "info",
  C: "warning",
  D: "neutral",
};

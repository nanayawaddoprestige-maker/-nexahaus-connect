export interface HealthComponent {
  key: string;
  value: number;
  weight: number;
  weightedScore: number;
  basis: string;
  confidence: "actual" | "estimate" | "assumption";
}

export interface HealthLatest {
  propertyId: string;
  property: string;
  score: number | null;
  scoredAt: string | null;
  methodologyVersion?: number;
  components: HealthComponent[];
  recommendations: string[];
}

export interface HealthHistoryPoint {
  score: number;
  scoredAt: string;
  methodologyVersion: number;
}

export interface RescueAssessment {
  id: string;
  ref: string;
  overallScore: number;
  status: string;
  assessedAt: string;
  findings: { key: string; problem: string; severity: string; score: number }[];
  inputs: Record<string, unknown>;
  pdfDocumentId: string | null;
  recommendations: {
    id: string;
    order: number;
    title: string;
    detail: string;
    priority: string;
    status: string;
  }[];
}

export interface TabularReport {
  title: string;
  period?: { start: string; end: string };
  columns: { key: string; label: string; kind?: "money" | "number" | "percent" | "text" }[];
  rows: Record<string, string | number>[];
  notes?: string[];
}

export const HEALTH_COMPONENT_LABELS: Record<string, string> = {
  OCCUPANCY: "Occupancy",
  RENT_COLLECTION: "Rent collection",
  MAINTENANCE: "Maintenance",
  CONDITION: "Property condition",
  TENANT_SATISFACTION: "Tenant satisfaction",
  DOCUMENTATION: "Documentation",
  SECURITY: "Security & compliance",
  FINANCIAL: "Financial performance",
};

export const OWNER_REPORT_KINDS = [
  { value: "portfolio-summary", label: "Portfolio summary" },
  { value: "rent-collection", label: "Rent collection" },
  { value: "outstanding-rent", label: "Outstanding rent" },
  { value: "expenses", label: "Expenses" },
  { value: "occupancy", label: "Occupancy" },
  { value: "maintenance", label: "Maintenance" },
  { value: "asset-performance", label: "Asset performance" },
] as const;

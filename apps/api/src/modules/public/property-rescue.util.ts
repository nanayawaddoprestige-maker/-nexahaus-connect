export interface RescueAnswers {
  occupancy: "FULLY_OCCUPIED" | "PARTLY_VACANT" | "MOSTLY_VACANT" | "VACANT";
  rentVsMarket: "ABOVE" | "AT" | "BELOW" | "NOT_SURE";
  collectionReliability: "ALWAYS" | "USUALLY" | "SOMETIMES" | "RARELY";
  arrears: boolean;
  maintenanceBacklog: "NONE" | "MINOR" | "SIGNIFICANT" | "SEVERE";
  conditionConcerns: boolean;
  lastInspection: "WITHIN_3M" | "WITHIN_12M" | "OVER_12M" | "NEVER";
  documentsInOrder: boolean;
  professionallyManaged: boolean;
  knowsExpenses: boolean;
}

export interface RescueResult {
  score: number;
  band: "HEALTHY" | "NEEDS_ATTENTION" | "AT_RISK";
  headline: string;
  /** Ranked problem areas (worst first) with a plain-language note. */
  findings: { area: string; note: string; weight: number }[];
}

/**
 * Preliminary, self-reported Property Rescue score (brief §10). Deterministic
 * weighting of the owner's own answers. NOT a valuation, structural survey or
 * data-driven assessment — the result screen says so.
 */
export function scoreRescue(a: RescueAnswers): RescueResult {
  const parts: { area: string; got: number; max: number; note: (lost: number) => string }[] = [
    {
      area: "Occupancy",
      max: 20,
      got: { FULLY_OCCUPIED: 20, PARTLY_VACANT: 12, MOSTLY_VACANT: 5, VACANT: 0 }[a.occupancy],
      note: (lost) => (lost > 8 ? "Vacancy is the biggest drag on income." : "Occupancy is broadly healthy."),
    },
    {
      area: "Rental pricing",
      max: 12,
      got: { ABOVE: 8, AT: 12, BELOW: 4, NOT_SURE: 5 }[a.rentVsMarket],
      note: (lost) =>
        lost > 6 ? "Rent looks out of step with the market — worth a review." : "Rent looks about right.",
    },
    {
      area: "Rent collection",
      max: 16,
      got: { ALWAYS: 16, USUALLY: 11, SOMETIMES: 5, RARELY: 1 }[a.collectionReliability],
      note: (lost) => (lost > 6 ? "Collection is unreliable — a process gap." : "Collection is mostly reliable."),
    },
    {
      area: "Arrears",
      max: 8,
      got: a.arrears ? 1 : 8,
      note: (lost) => (lost > 0 ? "Outstanding arrears need a recovery plan." : "No arrears reported."),
    },
    {
      area: "Maintenance backlog",
      max: 14,
      got: { NONE: 14, MINOR: 10, SIGNIFICANT: 4, SEVERE: 0 }[a.maintenanceBacklog],
      note: (lost) =>
        lost > 6 ? "A maintenance backlog is eroding condition and value." : "Maintenance is under control.",
    },
    {
      area: "Property condition",
      max: 8,
      got: a.conditionConcerns ? 2 : 8,
      note: (lost) => (lost > 0 ? "Condition concerns were flagged." : "No condition concerns reported."),
    },
    {
      area: "Inspections",
      max: 8,
      got: { WITHIN_3M: 8, WITHIN_12M: 6, OVER_12M: 2, NEVER: 0 }[a.lastInspection],
      note: (lost) => (lost > 4 ? "The property has not been inspected recently." : "Inspections are current."),
    },
    {
      area: "Documentation",
      max: 6,
      got: a.documentsInOrder ? 6 : 1,
      note: (lost) => (lost > 0 ? "Key documents are not in order." : "Documents are in order."),
    },
    {
      area: "Management",
      max: 6,
      got: a.professionallyManaged ? 6 : 2,
      note: (lost) => (lost > 0 ? "No professional management in place." : "Professionally managed."),
    },
    {
      area: "Financial visibility",
      max: 6,
      got: a.knowsExpenses ? 6 : 2,
      note: (lost) => (lost > 0 ? "Operating costs are not clearly known." : "Operating costs are understood."),
    },
  ];

  const raw = parts.reduce((n, p) => n + p.got, 0);
  const maxTotal = parts.reduce((n, p) => n + p.max, 0);
  const score = Math.max(0, Math.min(100, Math.round((raw / maxTotal) * 100)));

  const findings = parts
    .map((p) => ({ area: p.area, note: p.note(p.max - p.got), weight: p.max - p.got }))
    .filter((f) => f.weight > 0)
    .sort((x, y) => y.weight - x.weight);

  const band = score >= 80 ? "HEALTHY" : score >= 55 ? "NEEDS_ATTENTION" : "AT_RISK";
  const headline =
    band === "HEALTHY"
      ? "This property looks broadly healthy — a few areas to tighten up."
      : band === "NEEDS_ATTENTION"
        ? "This property is underperforming in several areas that can be fixed."
        : "This property shows serious signs of strain — a professional assessment is recommended.";

  return { score, band, headline, findings };
}

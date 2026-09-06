export interface HealthCheckAnswers {
  occupied: boolean;
  managedProfessionally: boolean;
  tenantsPayOnTime: "ALWAYS" | "USUALLY" | "SOMETIMES" | "RARELY";
  inspectionFrequency: "MONTHLY" | "QUARTERLY" | "YEARLY" | "NEVER";
  receivesFinancialReports: boolean;
  documentsInOrder: boolean;
  lastMaintenanceRecent: boolean;
}

/**
 * Preliminary, self-reported Property Health Check score (spec §39). This is a
 * deliberately simple, deterministic scoring of the owner's own answers — it is
 * NOT the data-driven PropertyHealthScore and NOT a professional assessment.
 * The public result screen must say so.
 */
export function scoreHealthCheck(a: HealthCheckAnswers): {
  score: number;
  band: "HEALTHY" | "NEEDS_ATTENTION" | "AT_RISK";
  headline: string;
} {
  let s = 0;
  s += a.occupied ? 18 : 4;
  s += a.managedProfessionally ? 14 : 4;
  s +=
    { ALWAYS: 20, USUALLY: 14, SOMETIMES: 7, RARELY: 2 }[a.tenantsPayOnTime] ?? 0;
  s += { MONTHLY: 14, QUARTERLY: 14, YEARLY: 8, NEVER: 0 }[a.inspectionFrequency] ?? 0;
  s += a.receivesFinancialReports ? 14 : 2;
  s += a.documentsInOrder ? 10 : 2;
  s += a.lastMaintenanceRecent ? 10 : 3;

  const score = Math.max(0, Math.min(100, Math.round(s)));
  const band = score >= 80 ? "HEALTHY" : score >= 55 ? "NEEDS_ATTENTION" : "AT_RISK";
  const headline =
    band === "HEALTHY"
      ? "Your property appears healthy, with only minor areas to watch."
      : band === "NEEDS_ATTENTION"
        ? "Your property is broadly sound, but several areas may need attention."
        : "Your property shows signs of strain — a professional review is recommended.";
  return { score, band, headline };
}

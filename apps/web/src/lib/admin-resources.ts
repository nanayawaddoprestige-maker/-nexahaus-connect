export interface AdminOverview {
  currency: string;
  portfolio: {
    propertiesManaged: number;
    occupiedProperties: number;
    vacantProperties: number;
    occupancyRate: number;
  };
  rent: {
    monthlyExpectedMinor: string;
    monthlyCollectedMinor: string;
    outstandingMinor: string;
    collectionRate: number;
  };
  operations: {
    openMaintenance: number;
    urgentIssues: number;
    pendingApprovals: number;
    inspectionsDue: number;
    documentsExpiring: number;
    overdueCharges: number;
  };
  growth: { activeClients: number; newLeads: number };
  alerts: { level: "URGENT" | "ACTION" | "WARNING"; message: string }[];
}

export interface AdminClientRow {
  id: string;
  ref: string;
  name: string;
  segment: string;
  status: string;
  servicePackage: string | null;
  email: string | null;
  countryOfResidence: string | null;
  propertyCount: number;
}

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

export interface ClientDetail {
  id: string;
  ref: string;
  type: string;
  displayName: string;
  legalName: string | null;
  segment: string;
  status: string;
  servicePackage: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  countryOfResidence: string | null;
  accountManager: { id: string; fullName: string } | null;
  contacts: {
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    isEmergency: boolean;
  }[];
  users: {
    id: string;
    fullName: string;
    email: string | null;
    status: string;
    relationship: string;
    canApprove: boolean;
    accepted: boolean;
  }[];
  onboarding: {
    currentStep: number;
    status: string;
    kycStatus: string;
    agreementAccepted: boolean;
    completionPercent: number;
    steps: { index: number; label: string; done: boolean; current: boolean }[];
  } | null;
  propertyCount: number;
  createdAt: string;
}

export interface ClientPortfolioSummary {
  currency: string;
  properties: { total: number; occupied: number; vacant: number };
  rent: {
    expectedMinor: string;
    collectedMinor: string;
    outstandingMinor: string;
  };
  openMaintenance: number;
}

export interface TenantRow {
  id: string;
  ref: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: string;
  currentTenancy: {
    leaseId: string;
    leaseRef: string;
    propertyId: string;
    property: string;
    unit: string;
  } | null;
}

export interface LeaseRow {
  id: string;
  ref: string;
  status: string;
  startDate: string;
  endDate: string;
  rent: { minor: string; currency: string };
  frequency: string;
  renewalStatus: string;
  property: { id: string; name: string; ref: string };
  unit: { id: string; label: string };
  primaryTenant: { id: string; fullName: string } | null;
  daysToExpiry: number;
}

export interface LeadScoreFactor {
  weight: number;
  bands?: [number, number][];
  thresholdMinor?: string;
}

export interface LeadScoreConfig {
  version: number;
  factors: {
    propertyCount?: LeadScoreFactor;
    diaspora?: LeadScoreFactor;
    managementNeed?: LeadScoreFactor;
    assessmentCompleted?: LeadScoreFactor;
    consultationBooked?: LeadScoreFactor;
    engagement?: LeadScoreFactor;
    portfolioValue?: LeadScoreFactor;
    serviceInterest?: LeadScoreFactor;
    grades: { A: number; B: number; C: number; D: number };
  } | null;
}

export interface AuditLogRow {
  id: string;
  at: string;
  actor: { id: string; fullName: string } | null;
  actorRoleKey: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ip: string | null;
}

/**
 * Response shapes returned by the NexaHaus API endpoints the web app consumes.
 * These mirror the serializers in apps/api; when the API adds a generated
 * OpenAPI client these will be replaced by generated types.
 */
import type { AuthUser } from "@nexahaus/types";

export type { AuthUser };

export interface MoneyView {
  minor: string;
  currency: string;
}

export interface OwnerDashboard {
  period: string;
  range: { start: string; end: string };
  currency: string;
  portfolio: {
    totalProperties: number;
    occupiedProperties: number;
    vacantProperties: number;
    occupancyRate: number;
    totalUnits: number;
    occupiedUnits: number;
  };
  rent: {
    expectedMinor: string;
    collectedMinor: string;
    outstandingMinor: string;
    collectionRate: number;
  };
  attention: {
    openMaintenance: number;
    urgentMaintenance: number;
    pendingApprovals: number;
    inspectionsDue: number;
  };
  portfolioHealthScore: number | null;
  charts: {
    monthly: {
      month: string;
      expectedMinor: string;
      collectedMinor: string;
      collectionRate: number;
    }[];
  };
}

export interface PropertyFinance {
  currency: string;
  expectedRentMinor: string;
  collectedRentMinor: string;
  outstandingRentMinor: string;
  collectionRate: number;
}

export interface PropertyListItem {
  id: string;
  ref: string;
  name: string;
  type: string;
  status: string;
  city: string;
  region: string;
  coverImageDocumentId: string | null;
  unitCount: number;
  onboardingComplete: boolean;
  occupancy: { total: number; occupied: number; rate: number };
  finance: PropertyFinance;
}

export interface PropertyDetail {
  id: string;
  ref: string;
  name: string;
  type: string;
  status: string;
  address: { line: string; city: string; region: string; country: string };
  bedrooms: number | null;
  bathrooms: number | null;
  unitCount: number;
  estimatedValue: MoneyView | null;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
  client: { id: string; ref: string; displayName: string };
  owners: { clientId: string; name: string; sharePercent: number; isPrimary: boolean }[];
  agreement: {
    feeType: string;
    feePercent: number | null;
    feeFixed: MoneyView | null;
    inspectionFrequency: string;
    maintenanceApprovalThreshold: MoneyView;
    startDate: string;
    endDate: string | null;
    status: string;
  } | null;
  team: { role: string; since: string; user: { id: string; fullName: string } }[];
  counts: { units: number; openMaintenance: number; inspections: number };
  occupancy: { total: number; occupied: number; rate: number };
  finance: PropertyFinance;
  diaspora: { lastInspectedAt: string | null; lastRentReceivedAt: string | null };
  latestInspection: {
    id: string;
    ref: string;
    type: string;
    completedAt: string | null;
    overallCondition: string | null;
  } | null;
  healthScore: { score: number; scoredAt: string; methodologyVersion: number } | null;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken?: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  };
  mfaRequired: boolean;
}

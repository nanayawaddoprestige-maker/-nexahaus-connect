import type { MoneyView } from "./resources";

export interface MaintenanceRow {
  id: string;
  ref: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  property: { id: string; name: string; ref: string };
  unit: string | null;
  estimatedCost: MoneyView | null;
  approvedCost: MoneyView | null;
  actualCost: MoneyView | null;
  scheduledFor: string | null;
  createdAt: string;
}

export interface MaintenanceDetail extends Omit<MaintenanceRow, "unit"> {
  description: string;
  unit: { id: string; label: string } | null;
  reportedBy: { type: string; tenant: { id: string; fullName: string } | null };
  completedAt: string | null;
  verifiedAt: string | null;
  closedAt: string | null;
  cancellationReason: string | null;
  timeline: {
    from: string | null;
    to: string;
    note: string | null;
    at: string;
    byUserId: string | null;
  }[];
  workOrders: {
    id: string;
    ref: string;
    status: string;
    vendor: { id: string; name: string; phone: string } | null;
    scheduledFor: string | null;
    completedAt: string | null;
    cost: MoneyView | null;
    completionNotes: string | null;
  }[];
  media: { documentId: string; kind: string; caption: string | null }[];
  nextStatuses: string[];
}

export interface ApprovalRow {
  id: string;
  ref: string;
  type: string;
  status: string;
  subject: { type: string; id: string };
  property: { id: string; name: string; ref: string } | null;
  amount: MoneyView | null;
  threshold: MoneyView | null;
  requestedBy: { id: string; fullName: string } | null;
  dueAt: string | null;
  createdAt: string;
}

export interface ApprovalDetail extends ApprovalRow {
  decisionNote: string | null;
  decidedAt: string | null;
  timeline: {
    action: string;
    note: string | null;
    at: string;
    byUserId: string | null;
  }[];
}

export interface InspectionRow {
  id: string;
  ref: string;
  type: string;
  status: string;
  property: { id: string; name: string; ref: string };
  inspector: { id: string; fullName: string } | null;
  overallCondition: string | null;
  scheduledFor: string | null;
  completedAt: string | null;
  reportDocumentId: string | null;
  itemCount: number;
}

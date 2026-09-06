import type { MoneyView } from "./resources";

export interface TenantMe {
  id: string;
  ref: string;
  fullName: string;
  phone: string;
  email: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  status: string;
  currentTenancy: {
    leaseId: string;
    leaseRef: string;
    propertyId: string;
    unitId: string;
    propertyName: string;
    address: string;
    unit: string;
    startDate: string;
    endDate: string;
    rent: MoneyView;
    frequency: string;
    status: string;
  } | null;
}

export interface TenantLease {
  id: string;
  ref: string;
  status: string;
  startDate: string;
  endDate: string;
  rent: MoneyView;
  frequency: string;
  deposit: MoneyView | null;
  noticePeriodDays: number;
  renewalStatus: string;
  documentId: string | null;
  property: { name: string; address: string };
  unit: { label: string; bedrooms: number | null; bathrooms: number | null };
  coTenants: { name: string; isPrimary: boolean }[];
}

export interface TenantRent {
  currency: string;
  charges: {
    id: string;
    period: string;
    dueDate: string;
    amount: MoneyView;
    paidMinor: string;
    outstandingMinor: string;
    status: string;
  }[];
  summary: { billedMinor: string; paidMinor: string; outstandingMinor: string };
  paymentInstructions: string;
}

export interface TenantPayment {
  id: string;
  ref: string;
  amount: MoneyView;
  method: string;
  status: string;
  receivedAt: string;
  reference: string | null;
}

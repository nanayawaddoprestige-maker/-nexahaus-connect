export interface OwnerFinancials {
  period: string;
  range: { start: string; end: string };
  currency: string;
  grossRentalIncomeMinor: string;
  managementFeesMinor: string;
  managementFeesProjected: boolean;
  maintenanceExpensesMinor: string;
  otherExpensesMinor: string;
  netOwnerIncomeMinor: string;
  outstandingRentMinor: string;
  vacancyLossMinor: string;
  ownerDistributionMinor: string;
}

export interface PaymentRow {
  id: string;
  ref: string;
  amount: { minor: string; currency: string };
  allocatedMinor: string;
  unallocatedMinor: string;
  method: string;
  provider: string | null;
  status: string;
  reconciliationStatus: string;
  receivedAt: string;
  property: { name: string; ref: string } | null;
  tenant: string | null;
}

export interface StatementRow {
  id: string;
  ref: string;
  periodStart: string;
  periodEnd: string;
  property: string;
  currency: string;
  netAmountMinor: string;
  closingBalanceMinor: string;
  status: string;
  hasPdf: boolean;
}

export interface StatementDetail {
  id: string;
  ref: string;
  status: string;
  client: { id: string; displayName: string };
  property: { id: string; name: string; ref: string } | null;
  periodStart: string;
  periodEnd: string;
  currency: string;
  openingBalanceMinor: string;
  grossRentalIncomeMinor: string;
  managementFeesMinor: string;
  maintenanceExpensesMinor: string;
  otherExpensesMinor: string;
  netAmountMinor: string;
  distributionsMinor: string;
  closingBalanceMinor: string;
  pdfDocumentId: string | null;
  generatedAt: string;
  lines: {
    occurredAt: string;
    description: string;
    category: string | null;
    direction: "CREDIT" | "DEBIT";
    amountMinor: string;
  }[];
}

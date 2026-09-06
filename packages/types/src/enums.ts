/**
 * Canonical enum vocabulary for NexaHaus Connect.
 *
 * These are the single source of truth shared by the API, web and mobile apps.
 * `apps/api/prisma/schema.prisma` mirrors every enum here; a schema test asserts
 * the two stay in sync. Values are SCREAMING_SNAKE_CASE strings.
 */

export const RoleKey = {
  SUPER_ADMIN: "SUPER_ADMIN",
  MANAGING_DIRECTOR: "MANAGING_DIRECTOR",
  PROPERTY_MANAGER: "PROPERTY_MANAGER",
  FINANCE_OFFICER: "FINANCE_OFFICER",
  MAINTENANCE_OFFICER: "MAINTENANCE_OFFICER",
  INSPECTOR: "INSPECTOR",
  LEASING_OFFICER: "LEASING_OFFICER",
  SUPPORT_STAFF: "SUPPORT_STAFF",
  VENDOR: "VENDOR",
  OWNER: "OWNER",
  TENANT: "TENANT",
} as const;
export type RoleKey = (typeof RoleKey)[keyof typeof RoleKey];

/** Roles that are NexaHaus staff (internal admin dashboard users). */
export const STAFF_ROLES: RoleKey[] = [
  RoleKey.SUPER_ADMIN,
  RoleKey.MANAGING_DIRECTOR,
  RoleKey.PROPERTY_MANAGER,
  RoleKey.FINANCE_OFFICER,
  RoleKey.MAINTENANCE_OFFICER,
  RoleKey.INSPECTOR,
  RoleKey.LEASING_OFFICER,
  RoleKey.SUPPORT_STAFF,
];

/** Roles exempt from resource-scope checks (still fully audited). */
export const SCOPE_EXEMPT_ROLES: RoleKey[] = [
  RoleKey.SUPER_ADMIN,
  RoleKey.MANAGING_DIRECTOR,
];

export const UserStatus = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DISABLED: "DISABLED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const ClientType = { INDIVIDUAL: "INDIVIDUAL", COMPANY: "COMPANY" } as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];

export const ClientSegment = {
  DIASPORA: "DIASPORA",
  RESIDENT: "RESIDENT",
  INVESTOR: "INVESTOR",
  DEVELOPER: "DEVELOPER",
  COMMERCIAL: "COMMERCIAL",
  OTHER: "OTHER",
} as const;
export type ClientSegment = (typeof ClientSegment)[keyof typeof ClientSegment];

export const ClientStatus = {
  PROSPECT: "PROSPECT",
  ONBOARDING: "ONBOARDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export const ServicePackage = {
  BASIC: "BASIC",
  PROFESSIONAL: "PROFESSIONAL",
  PREMIUM: "PREMIUM",
  ENTERPRISE: "ENTERPRISE",
} as const;
export type ServicePackage = (typeof ServicePackage)[keyof typeof ServicePackage];

export const PropertyType = {
  OFFICE: "OFFICE",
  RETAIL: "RETAIL",
  WAREHOUSE: "WAREHOUSE",
  MIXED_USE: "MIXED_USE",
  APARTMENT: "APARTMENT",
  HOUSE: "HOUSE",
  LAND: "LAND",
  SHORT_STAY: "SHORT_STAY",
  OTHER: "OTHER",
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const PropertyStatus = {
  ACTIVE: "ACTIVE",
  VACANT: "VACANT",
  OCCUPIED: "OCCUPIED",
  UNDER_MAINTENANCE: "UNDER_MAINTENANCE",
  UNDER_RENOVATION: "UNDER_RENOVATION",
  SUSPENDED: "SUSPENDED",
  SOLD: "SOLD",
  ARCHIVED: "ARCHIVED",
} as const;
export type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];

export const UnitStatus = {
  VACANT: "VACANT",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
  MAINTENANCE: "MAINTENANCE",
  UNAVAILABLE: "UNAVAILABLE",
} as const;
export type UnitStatus = (typeof UnitStatus)[keyof typeof UnitStatus];

export const ManagementFeeType = {
  PERCENT_OF_COLLECTED: "PERCENT_OF_COLLECTED",
  PERCENT_OF_EXPECTED: "PERCENT_OF_EXPECTED",
  FIXED_MONTHLY: "FIXED_MONTHLY",
  CUSTOM: "CUSTOM",
} as const;
export type ManagementFeeType =
  (typeof ManagementFeeType)[keyof typeof ManagementFeeType];

export const InspectionFrequency = {
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  BIANNUAL: "BIANNUAL",
  ANNUAL: "ANNUAL",
  CUSTOM: "CUSTOM",
} as const;
export type InspectionFrequency =
  (typeof InspectionFrequency)[keyof typeof InspectionFrequency];

export const AgreementStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  TERMINATED: "TERMINATED",
} as const;
export type AgreementStatus =
  (typeof AgreementStatus)[keyof typeof AgreementStatus];

export const TenantStatus = {
  PROSPECTIVE: "PROSPECTIVE",
  ACTIVE: "ACTIVE",
  NOTICE_GIVEN: "NOTICE_GIVEN",
  FORMER: "FORMER",
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const LeaseFrequency = {
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  BIANNUAL: "BIANNUAL",
  ANNUAL: "ANNUAL",
  CUSTOM: "CUSTOM",
} as const;
export type LeaseFrequency = (typeof LeaseFrequency)[keyof typeof LeaseFrequency];

export const LeaseStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  EXPIRING: "EXPIRING",
  EXPIRED: "EXPIRED",
  TERMINATED: "TERMINATED",
  RENEWED: "RENEWED",
} as const;
export type LeaseStatus = (typeof LeaseStatus)[keyof typeof LeaseStatus];

export const RenewalStatus = {
  NONE: "NONE",
  OFFERED: "OFFERED",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
export type RenewalStatus = (typeof RenewalStatus)[keyof typeof RenewalStatus];

export const RentChargeStatus = {
  EXPECTED: "EXPECTED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  WAIVED: "WAIVED",
  REFUNDED: "REFUNDED",
} as const;
export type RentChargeStatus =
  (typeof RentChargeStatus)[keyof typeof RentChargeStatus];

export const PaymentMethod = {
  MOBILE_MONEY: "MOBILE_MONEY",
  BANK_TRANSFER: "BANK_TRANSFER",
  BANK_DEPOSIT: "BANK_DEPOSIT",
  CASH: "CASH",
  ONLINE: "ONLINE",
  OTHER: "OTHER",
  NONE: "NONE",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ReconciliationStatus = {
  UNRECONCILED: "UNRECONCILED",
  RECONCILED: "RECONCILED",
  DISPUTED: "DISPUTED",
} as const;
export type ReconciliationStatus =
  (typeof ReconciliationStatus)[keyof typeof ReconciliationStatus];

export const TransactionType = {
  RENT_CHARGE: "RENT_CHARGE",
  RENT_PAYMENT: "RENT_PAYMENT",
  EXPENSE: "EXPENSE",
  MANAGEMENT_FEE: "MANAGEMENT_FEE",
  OWNER_DISTRIBUTION: "OWNER_DISTRIBUTION",
  DEPOSIT: "DEPOSIT",
  REFUND: "REFUND",
  ADJUSTMENT: "ADJUSTMENT",
  REVERSAL: "REVERSAL",
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: "PENDING",
  POSTED: "POSTED",
  VOID: "VOID",
} as const;
export type TransactionStatus =
  (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const LedgerAccountType = {
  COMPANY_OPERATING: "COMPANY_OPERATING",
  OWNER_FUNDS: "OWNER_FUNDS",
  TENANT_DEPOSITS: "TENANT_DEPOSITS",
  PROPERTY_EXPENSE: "PROPERTY_EXPENSE",
  VENDOR_PAYABLE: "VENDOR_PAYABLE",
  OWNER_DISTRIBUTION: "OWNER_DISTRIBUTION",
  RENT_INCOME: "RENT_INCOME",
} as const;
export type LedgerAccountType =
  (typeof LedgerAccountType)[keyof typeof LedgerAccountType];

export const ExpenseCategory = {
  PLUMBING: "PLUMBING",
  ELECTRICAL: "ELECTRICAL",
  PAINTING: "PAINTING",
  CLEANING: "CLEANING",
  SECURITY: "SECURITY",
  LANDSCAPING: "LANDSCAPING",
  AIR_CONDITIONING: "AIR_CONDITIONING",
  PEST_CONTROL: "PEST_CONTROL",
  REPAIRS: "REPAIRS",
  INSURANCE: "INSURANCE",
  UTILITIES: "UTILITIES",
  OTHER: "OTHER",
} as const;
export type ExpenseCategory =
  (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const ExpenseStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
  VOID: "VOID",
} as const;
export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const ApprovalDecisionStatus = {
  NOT_REQUIRED: "NOT_REQUIRED",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
} as const;
export type ApprovalDecisionStatus =
  (typeof ApprovalDecisionStatus)[keyof typeof ApprovalDecisionStatus];

export const PaymentSettlementStatus = {
  UNPAID: "UNPAID",
  SCHEDULED: "SCHEDULED",
  PAID: "PAID",
} as const;
export type PaymentSettlementStatus =
  (typeof PaymentSettlementStatus)[keyof typeof PaymentSettlementStatus];

export const MaintenanceStatus = {
  REPORTED: "REPORTED",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  ASSIGNED: "ASSIGNED",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  AWAITING_APPROVAL: "AWAITING_APPROVAL",
  COMPLETED: "COMPLETED",
  VERIFIED: "VERIFIED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
} as const;
export type MaintenanceStatus =
  (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

/** Allowed maintenance status transitions (spec §21, §82). */
export const MAINTENANCE_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  REPORTED: ["ACKNOWLEDGED", "CANCELLED"],
  ACKNOWLEDGED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["SCHEDULED", "IN_PROGRESS", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["AWAITING_APPROVAL", "COMPLETED", "CANCELLED"],
  AWAITING_APPROVAL: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  COMPLETED: ["VERIFIED", "IN_PROGRESS"],
  VERIFIED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export const MaintenancePriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type MaintenancePriority =
  (typeof MaintenancePriority)[keyof typeof MaintenancePriority];

export const WorkOrderStatus = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type WorkOrderStatus =
  (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

export const InspectionType = {
  INITIAL: "INITIAL",
  ROUTINE: "ROUTINE",
  MOVE_IN: "MOVE_IN",
  MOVE_OUT: "MOVE_OUT",
  MAINTENANCE: "MAINTENANCE",
  EMERGENCY: "EMERGENCY",
  PRE_HANDOVER: "PRE_HANDOVER",
  POST_MAINTENANCE: "POST_MAINTENANCE",
  ANNUAL: "ANNUAL",
} as const;
export type InspectionType = (typeof InspectionType)[keyof typeof InspectionType];

export const InspectionStatus = {
  ASSIGNED: "ASSIGNED",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  REVIEWED: "REVIEWED",
  REPORT_ISSUED: "REPORT_ISSUED",
} as const;
export type InspectionStatus =
  (typeof InspectionStatus)[keyof typeof InspectionStatus];

export const InspectionItemRating = {
  GOOD: "GOOD",
  ATTENTION_REQUIRED: "ATTENTION_REQUIRED",
  URGENT: "URGENT",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;
export type InspectionItemRating =
  (typeof InspectionItemRating)[keyof typeof InspectionItemRating];

export const ConditionRating = {
  EXCELLENT: "EXCELLENT",
  GOOD: "GOOD",
  FAIR: "FAIR",
  POOR: "POOR",
} as const;
export type ConditionRating =
  (typeof ConditionRating)[keyof typeof ConditionRating];

export const DocumentScopeType = {
  PROPERTY: "PROPERTY",
  UNIT: "UNIT",
  LEASE: "LEASE",
  TENANT: "TENANT",
  CLIENT: "CLIENT",
  MAINTENANCE_REQUEST: "MAINTENANCE_REQUEST",
  WORK_ORDER: "WORK_ORDER",
  INSPECTION: "INSPECTION",
  EXPENSE: "EXPENSE",
  STATEMENT: "STATEMENT",
  VENDOR: "VENDOR",
  COMPLIANCE: "COMPLIANCE",
  USER: "USER",
} as const;
export type DocumentScopeType =
  (typeof DocumentScopeType)[keyof typeof DocumentScopeType];

export const DocumentCategory = {
  PROPERTY: "PROPERTY",
  OWNERSHIP: "OWNERSHIP",
  TENANCY: "TENANCY",
  INSURANCE: "INSURANCE",
  INSPECTION_REPORT: "INSPECTION_REPORT",
  MAINTENANCE_REPORT: "MAINTENANCE_REPORT",
  INVOICE: "INVOICE",
  RECEIPT: "RECEIPT",
  VALUATION: "VALUATION",
  LEGAL: "LEGAL",
  TAX: "TAX",
  OTHER: "OTHER",
} as const;
export type DocumentCategory =
  (typeof DocumentCategory)[keyof typeof DocumentCategory];

export const MalwareScanStatus = {
  PENDING: "PENDING",
  CLEAN: "CLEAN",
  INFECTED: "INFECTED",
  ERROR: "ERROR",
} as const;
export type MalwareScanStatus =
  (typeof MalwareScanStatus)[keyof typeof MalwareScanStatus];

export const ApprovalType = {
  MAINTENANCE_COST: "MAINTENANCE_COST",
  EXPENSE: "EXPENSE",
  RENT_CHANGE: "RENT_CHANGE",
  LEASE_TERMINATION: "LEASE_TERMINATION",
  DISTRIBUTION: "DISTRIBUTION",
  OTHER: "OTHER",
} as const;
export type ApprovalType = (typeof ApprovalType)[keyof typeof ApprovalType];

export const ApprovalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  INFO_REQUESTED: "INFO_REQUESTED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const NotificationChannel = {
  IN_APP: "IN_APP",
  EMAIL: "EMAIL",
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
  PUSH: "PUSH",
} as const;
export type NotificationChannel =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const DomainEventType = {
  RENT_RECEIVED: "RENT_RECEIVED",
  RENT_OVERDUE: "RENT_OVERDUE",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  MAINTENANCE_CREATED: "MAINTENANCE_CREATED",
  MAINTENANCE_ASSIGNED: "MAINTENANCE_ASSIGNED",
  MAINTENANCE_COMPLETED: "MAINTENANCE_COMPLETED",
  INSPECTION_COMPLETED: "INSPECTION_COMPLETED",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
  APPROVAL_COMPLETED: "APPROVAL_COMPLETED",
  DOCUMENT_EXPIRING: "DOCUMENT_EXPIRING",
  LEASE_EXPIRING: "LEASE_EXPIRING",
  STATEMENT_GENERATED: "STATEMENT_GENERATED",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  HEALTH_SCORE_UPDATED: "HEALTH_SCORE_UPDATED",
  PROPERTY_RESCUE_READY: "PROPERTY_RESCUE_READY",
} as const;
export type DomainEventType =
  (typeof DomainEventType)[keyof typeof DomainEventType];

export const MessageThreadType = {
  OWNER_NEXAHAUS: "OWNER_NEXAHAUS",
  TENANT_NEXAHAUS: "TENANT_NEXAHAUS",
  INTERNAL: "INTERNAL",
  MAINTENANCE: "MAINTENANCE",
} as const;
export type MessageThreadType =
  (typeof MessageThreadType)[keyof typeof MessageThreadType];

export const LeadSource = {
  FACEBOOK: "FACEBOOK",
  INSTAGRAM: "INSTAGRAM",
  TIKTOK: "TIKTOK",
  LINKEDIN: "LINKEDIN",
  WEBSITE: "WEBSITE",
  WHATSAPP: "WHATSAPP",
  REFERRAL: "REFERRAL",
  EVENT: "EVENT",
  DIASPORA_CAMPAIGN: "DIASPORA_CAMPAIGN",
  PROPERTY_RESCUE: "PROPERTY_RESCUE",
  OTHER: "OTHER",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUALIFIED: "QUALIFIED",
  CONSULTATION: "CONSULTATION",
  ASSESSMENT: "ASSESSMENT",
  PROPOSAL: "PROPOSAL",
  WON: "WON",
  LOST: "LOST",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadGrade = { A: "A", B: "B", C: "C", D: "D" } as const;
export type LeadGrade = (typeof LeadGrade)[keyof typeof LeadGrade];

export const HealthComponentKey = {
  OCCUPANCY: "OCCUPANCY",
  RENT_COLLECTION: "RENT_COLLECTION",
  MAINTENANCE: "MAINTENANCE",
  CONDITION: "CONDITION",
  TENANT_SATISFACTION: "TENANT_SATISFACTION",
  DOCUMENTATION: "DOCUMENTATION",
  SECURITY: "SECURITY",
  FINANCIAL: "FINANCIAL",
} as const;
export type HealthComponentKey =
  (typeof HealthComponentKey)[keyof typeof HealthComponentKey];

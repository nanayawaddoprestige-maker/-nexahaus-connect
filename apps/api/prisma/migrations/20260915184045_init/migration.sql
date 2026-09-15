-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('VERIFY_EMAIL', 'VERIFY_PHONE', 'LOGIN_MFA', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "ClientSegment" AS ENUM ('DIASPORA', 'RESIDENT', 'INVESTOR', 'DEVELOPER', 'COMMERCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PROSPECT', 'ONBOARDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ServicePackage" AS ENUM ('BASIC', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ClientUserRelationship" AS ENUM ('PRIMARY', 'MEMBER', 'ACCOUNTANT', 'REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('IN_PROGRESS', 'BLOCKED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN', 'WEBSITE', 'WHATSAPP', 'REFERRAL', 'EVENT', 'DIASPORA_CAMPAIGN', 'PROPERTY_RESCUE', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONSULTATION', 'ASSESSMENT', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadGrade" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'STATUS_CHANGE', 'TASK');

-- CreateEnum
CREATE TYPE "EarlyAccessCampaign" AS ENUM ('FOUNDING_100', 'EARLY_ACCESS', 'OWNER_CLUB');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('OWNER', 'INVESTOR', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('OFFICE', 'RETAIL', 'WAREHOUSE', 'MIXED_USE', 'APARTMENT', 'HOUSE', 'LAND', 'SHORT_STAY', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE', 'UNDER_RENOVATION', 'SUSPENDED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ManagementFeeType" AS ENUM ('PERCENT_OF_COLLECTED', 'PERCENT_OF_EXPECTED', 'FIXED_MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InspectionFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PropertyAssignmentRole" AS ENUM ('PROPERTY_MANAGER', 'MAINTENANCE_OFFICER', 'INSPECTOR', 'LEASING_OFFICER', 'SUPPORT_STAFF');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PROSPECTIVE', 'ACTIVE', 'NOTICE_GIVEN', 'FORMER');

-- CreateEnum
CREATE TYPE "LeaseFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'TERMINATED', 'RENEWED');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('NONE', 'OFFERED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "LeaseReminderType" AS ENUM ('EXPIRY', 'RENEWAL', 'RENT_REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('COMPANY_OPERATING', 'OWNER_FUNDS', 'TENANT_DEPOSITS', 'PROPERTY_EXPENSE', 'VENDOR_PAYABLE', 'OWNER_DISTRIBUTION', 'RENT_INCOME');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RENT_CHARGE', 'RENT_PAYMENT', 'EXPENSE', 'MANAGEMENT_FEE', 'OWNER_DISTRIBUTION', 'DEPOSIT', 'REFUND', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MOBILE_MONEY', 'BANK_TRANSFER', 'BANK_DEPOSIT', 'CASH', 'ONLINE', 'OTHER', 'NONE');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('UNRECONCILED', 'RECONCILED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "RentChargeStatus" AS ENUM ('EXPECTED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'PAINTING', 'CLEANING', 'SECURITY', 'LANDSCAPING', 'AIR_CONDITIONING', 'PEST_CONTROL', 'REPAIRS', 'INSURANCE', 'UTILITIES', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "ApprovalDecisionStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "PaymentSettlementStatus" AS ENUM ('UNPAID', 'SCHEDULED', 'PAID');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'DECLINED', 'INFO_REQUESTED');

-- CreateEnum
CREATE TYPE "StatementStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "MaintenanceReporterType" AS ENUM ('TENANT', 'STAFF', 'OWNER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('REPORTED', 'ACKNOWLEDGED', 'ASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'VERIFIED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'ISSUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceMediaKind" AS ENUM ('BEFORE', 'AFTER', 'REPORTED', 'OTHER');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('COMPANY', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "VendorDocumentType" AS ENUM ('INSURANCE', 'LICENCE', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('INITIAL', 'ROUTINE', 'MOVE_IN', 'MOVE_OUT', 'MAINTENANCE', 'EMERGENCY', 'PRE_HANDOVER', 'POST_MAINTENANCE', 'ANNUAL');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('ASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'REPORT_ISSUED');

-- CreateEnum
CREATE TYPE "ConditionRating" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "InspectionItemRating" AS ENUM ('GOOD', 'ATTENTION_REQUIRED', 'URGENT', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "DocumentScopeType" AS ENUM ('PROPERTY', 'UNIT', 'LEASE', 'TENANT', 'CLIENT', 'MAINTENANCE_REQUEST', 'WORK_ORDER', 'INSPECTION', 'EXPENSE', 'STATEMENT', 'VENDOR', 'COMPLIANCE', 'USER');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PROPERTY', 'OWNERSHIP', 'TENANCY', 'INSURANCE', 'INSPECTION_REPORT', 'MAINTENANCE_REPORT', 'INVOICE', 'RECEIPT', 'VALUATION', 'LEGAL', 'TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "MalwareScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "DocumentAccessAction" AS ENUM ('VIEW', 'DOWNLOAD', 'UPLOAD', 'DELETE', 'SHARE');

-- CreateEnum
CREATE TYPE "MessageThreadType" AS ENUM ('OWNER_NEXAHAUS', 'TENANT_NEXAHAUS', 'INTERNAL', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ThreadParticipantRole" AS ENUM ('MEMBER', 'OWNER_SIDE', 'NEXAHAUS_SIDE');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('MAINTENANCE_COST', 'EXPENSE', 'RENT_CHANGE', 'LEASE_TERMINATION', 'DISTRIBUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'INFO_REQUESTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApprovalEventAction" AS ENUM ('CREATED', 'VIEWED', 'APPROVED', 'DECLINED', 'INFO_REQUESTED', 'COMMENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RescueStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "RescueRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RescueRecommendationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SurveyQuestionType" AS ENUM ('SINGLE', 'MULTI', 'TEXT', 'NUMBER', 'SCALE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('PRELIMINARY', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LicenceScope" AS ENUM ('ORG', 'USER');

-- CreateEnum
CREATE TYPE "LicenceType" AS ENUM ('REAL_ESTATE_AGENT', 'BROKER', 'VALUER', 'OTHER');

-- CreateEnum
CREATE TYPE "LicenceStatus" AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ComplianceCategory" AS ENUM ('COMPANY_DOC', 'TAX', 'INSURANCE', 'LICENCE', 'DATA_PROTECTION', 'EMPLOYEE', 'PROPERTY_DOC', 'LEASE_DOC');

-- CreateEnum
CREATE TYPE "ComplianceItemStatus" AS ENUM ('OK', 'DUE_SOON', 'EXPIRED', 'MISSING');

-- CreateEnum
CREATE TYPE "ConsentSubjectType" AS ENUM ('LEAD', 'TENANT', 'CLIENT', 'USER', 'SURVEY_RESPONDENT');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'EXPORT', 'ERASURE', 'RECTIFICATION');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ImportEntity" AS ENUM ('CLIENT', 'PROPERTY', 'UNIT', 'TENANT');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('VALIDATED', 'COMMITTING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "avatarDocumentId" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecretEnc" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedById" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "rotatedFromId" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "destination" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_activation_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_activation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "type" "ClientType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "segment" "ClientSegment" NOT NULL DEFAULT 'OTHER',
    "status" "ClientStatus" NOT NULL DEFAULT 'PROSPECT',
    "primaryEmail" TEXT,
    "primaryPhone" TEXT,
    "countryOfResidence" TEXT,
    "servicePackage" "ServicePackage",
    "accountManagerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_users" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationship" "ClientUserRelationship" NOT NULL DEFAULT 'PRIMARY',
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "invitedById" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_onboardings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "managementAgreementDocId" TEXT,
    "agreementAcceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_onboardings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "campaign" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "clickId" TEXT,
    "landingPath" TEXT,
    "referrer" TEXT,
    "segment" TEXT,
    "propertyCount" INTEGER,
    "propertyType" TEXT,
    "location" TEXT,
    "serviceInterest" TEXT[],
    "livesInGhana" BOOLEAN,
    "biggestChallenge" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "grade" "LeadGrade" NOT NULL DEFAULT 'D',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "ownerUserId" TEXT,
    "convertedClientId" TEXT,
    "consent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "body" TEXT NOT NULL,
    "byUserId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_score_configs" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_score_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_access_registrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "propertyCount" INTEGER,
    "location" TEXT,
    "interest" TEXT,
    "campaign" "EarlyAccessCampaign" NOT NULL DEFAULT 'EARLY_ACCESS',
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_access_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrerClientId" TEXT NOT NULL,
    "refereeName" TEXT NOT NULL,
    "refereeContact" TEXT NOT NULL,
    "type" "ReferralType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_location_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "property_location_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'VACANT',
    "addressLine" TEXT NOT NULL,
    "areaId" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'GH',
    "gpsLat" DECIMAL(9,6),
    "gpsLng" DECIMAL(9,6),
    "ownershipStatus" TEXT,
    "acquisitionDate" DATE,
    "estimatedValueMinor" BIGINT,
    "estimatedValueCurrency" TEXT,
    "valuationDate" DATE,
    "unitCount" INTEGER NOT NULL DEFAULT 0,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floorAreaSqm" DECIMAL(12,2),
    "landSizeSqm" DECIMAL(12,2),
    "description" TEXT,
    "coverImageDocumentId" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_owners" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sharePercent" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "management_agreements" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "feeType" "ManagementFeeType" NOT NULL,
    "feePercent" DECIMAL(5,2),
    "feeFixedMinor" BIGINT,
    "feeCurrency" TEXT NOT NULL DEFAULT 'GHS',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "inspectionFrequency" "InspectionFrequency" NOT NULL DEFAULT 'QUARTERLY',
    "maintenanceApprovalThresholdMinor" BIGINT NOT NULL DEFAULT 0,
    "thresholdCurrency" TEXT NOT NULL DEFAULT 'GHS',
    "documentId" TEXT,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "management_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floorsCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "floorId" TEXT,
    "ref" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floorAreaSqm" DECIMAL(12,2),
    "marketRentMinor" BIGINT,
    "marketRentCurrency" TEXT,
    "status" "UnitStatus" NOT NULL DEFAULT 'VACANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_assignments" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PropertyAssignmentRole" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_onboarding_checklists" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_onboarding_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "idDocumentType" TEXT,
    "idDocumentRefEnc" TEXT,
    "idDocumentFileId" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'PROSPECTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "rentMinor" BIGINT NOT NULL,
    "rentCurrency" TEXT NOT NULL DEFAULT 'GHS',
    "frequency" "LeaseFrequency" NOT NULL DEFAULT 'MONTHLY',
    "customFrequencyDays" INTEGER,
    "depositMinor" BIGINT,
    "depositCurrency" TEXT,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "renewalStatus" "RenewalStatus" NOT NULL DEFAULT 'NONE',
    "documentId" TEXT,
    "status" "LeaseStatus" NOT NULL DEFAULT 'DRAFT',
    "terminatedAt" TIMESTAMP(3),
    "terminationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease_parties" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lease_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease_reminders" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "type" "LeaseReminderType" NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "lease_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" TEXT NOT NULL,
    "type" "LedgerAccountType" NOT NULL,
    "clientId" TEXT,
    "propertyId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "leaseId" TEXT,
    "tenantId" TEXT,
    "clientId" TEXT,
    "vendorId" TEXT,
    "category" TEXT,
    "reference" TEXT,
    "method" "PaymentMethod" NOT NULL DEFAULT 'NONE',
    "provider" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'POSTED',
    "reconciliationStatus" "ReconciliationStatus" NOT NULL DEFAULT 'UNRECONCILED',
    "reversesTransactionId" TEXT,
    "sourceEventId" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_charges" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "paidMinor" BIGINT NOT NULL DEFAULT 0,
    "status" "RentChargeStatus" NOT NULL DEFAULT 'EXPECTED',
    "waivedById" TEXT,
    "waivedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "tenantId" TEXT,
    "leaseId" TEXT,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "clientId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "provider" TEXT,
    "providerRef" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reconciliationStatus" "ReconciliationStatus" NOT NULL DEFAULT 'UNRECONCILED',
    "idempotencyKey" TEXT NOT NULL,
    "evidenceDocumentId" TEXT,
    "transactionId" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "rentChargeId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_provider_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "resultingPaymentId" TEXT,

    CONSTRAINT "payment_provider_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "vendorId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "taxMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "invoiceDocumentId" TEXT,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalDecisionStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "paymentStatus" "PaymentSettlementStatus" NOT NULL DEFAULT 'UNPAID',
    "maintenanceRequestId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_approvals" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "approvalId" TEXT,
    "approverUserId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "note" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statements" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "propertyId" TEXT,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "openingBalanceMinor" BIGINT NOT NULL DEFAULT 0,
    "closingBalanceMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "grossRentalIncomeMinor" BIGINT NOT NULL DEFAULT 0,
    "managementFeesMinor" BIGINT NOT NULL DEFAULT 0,
    "maintenanceExpensesMinor" BIGINT NOT NULL DEFAULT 0,
    "otherExpensesMinor" BIGINT NOT NULL DEFAULT 0,
    "netAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "distributionsMinor" BIGINT NOT NULL DEFAULT 0,
    "status" "StatementStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfDocumentId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT,

    CONSTRAINT "statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statement_lines" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "transactionId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "direction" "LedgerDirection" NOT NULL,
    "amountMinor" BIGINT NOT NULL,

    CONSTRAINT "statement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_distributions" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "propertyId" TEXT,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "statementId" TEXT,
    "createdById" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "leaseId" TEXT,
    "reportedByType" "MaintenanceReporterType" NOT NULL,
    "reportedByUserId" TEXT,
    "reportedByTenantId" TEXT,
    "category" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'REPORTED',
    "estimatedCostMinor" BIGINT,
    "approvedCostMinor" BIGINT,
    "actualCostMinor" BIGINT,
    "costCurrency" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "closedAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_status_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" "MaintenanceStatus",
    "toStatus" "MaintenanceStatus" NOT NULL,
    "byUserId" TEXT,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "vendorId" TEXT,
    "assignedUserId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "costMinor" BIGINT,
    "currency" TEXT,
    "invoiceDocumentId" TEXT,
    "completionNotes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_media" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "workOrderId" TEXT,
    "documentId" TEXT NOT NULL,
    "kind" "MaintenanceMediaKind" NOT NULL DEFAULT 'OTHER',
    "caption" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" "VendorType" NOT NULL DEFAULT 'COMPANY',
    "categories" TEXT[],
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "region" TEXT,
    "servicesDescription" TEXT,
    "rating" DECIMAL(3,2),
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "insuranceExpiryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_property_assignments" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "addedById" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_property_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_documents" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "type" "VendorDocumentType" NOT NULL,

    CONSTRAINT "vendor_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payments" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "expenseId" TEXT,
    "workOrderId" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "PaymentSettlementStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preventive_maintenance_plans" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "serviceType" TEXT NOT NULL,
    "frequency" "InspectionFrequency" NOT NULL DEFAULT 'QUARTERLY',
    "intervalDays" INTEGER,
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "vendorId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preventive_maintenance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_template_areas" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inspection_template_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_template_items" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inspection_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "type" "InspectionType" NOT NULL,
    "templateId" TEXT,
    "inspectorUserId" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'ASSIGNED',
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "overallCondition" "ConditionRating",
    "inspectorSignatureRef" TEXT,
    "ownerReviewedAt" TIMESTAMP(3),
    "reportDocumentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_items" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rating" "InspectionItemRating" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "note" TEXT,
    "recommendation" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_media" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "inspectionItemId" TEXT,
    "documentId" TEXT NOT NULL,
    "caption" TEXT,
    "capturedAt" TIMESTAMP(3),
    "gpsLat" DECIMAL(9,6),
    "gpsLng" DECIMAL(9,6),

    CONSTRAINT "inspection_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "scopeType" "DocumentScopeType" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "uploadedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "malwareScanStatus" "MalwareScanStatus" NOT NULL DEFAULT 'PENDING',
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "DocumentAccessAction" NOT NULL,
    "ip" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_expiry_reminders" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "offsetDays" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "document_expiry_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" TEXT NOT NULL,
    "type" "MessageThreadType" NOT NULL,
    "subjectRefType" TEXT,
    "subjectRefId" TEXT,
    "clientId" TEXT,
    "propertyId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thread_participants" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ThreadParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "lastReadAt" TIMESTAMP(3),
    "mutedAt" TIMESTAMP(3),

    CONSTRAINT "thread_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "channels" TEXT[],
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceEventId" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "push" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeKey" TEXT,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "subjectRefType" TEXT NOT NULL,
    "subjectRefId" TEXT NOT NULL,
    "propertyId" TEXT,
    "clientId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "thresholdMinor" BIGINT,
    "thresholdCurrency" TEXT,
    "amountMinor" BIGINT,
    "currency" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_events" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "action" "ApprovalEventAction" NOT NULL,
    "byUserId" TEXT,
    "note" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_score_configs" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "weights" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_score_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_health_scores" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "methodologyVersion" INTEGER NOT NULL,
    "components" JSONB NOT NULL,
    "recommendations" JSONB,
    "computedByJobId" TEXT,

    CONSTRAINT "property_health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_health_components" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "rawValue" DECIMAL(9,4) NOT NULL,
    "weight" DECIMAL(9,4) NOT NULL,
    "weightedScore" DECIMAL(9,4) NOT NULL,

    CONSTRAINT "property_health_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_rescue_assessments" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedByUserId" TEXT,
    "inputs" JSONB NOT NULL,
    "findings" JSONB NOT NULL,
    "status" "RescueStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_rescue_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_rescue_recommendations" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "priority" "RescueRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RescueRecommendationStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "property_rescue_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "type" "SurveyQuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "leadId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL,
    "consent" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_health_checks" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "propertyInfo" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "preliminaryScore" INTEGER NOT NULL,
    "consent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_assessments" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "clientId" TEXT,
    "leadId" TEXT,
    "propertyRef" TEXT,
    "type" "AssessmentType" NOT NULL DEFAULT 'PRELIMINARY',
    "status" "AssessmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3),
    "assessorUserId" TEXT,
    "reportDocumentId" TEXT,
    "notes" TEXT,

    CONSTRAINT "property_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRoleKey" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "assigneeUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "relatedRefType" TEXT,
    "relatedRefId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practitioner_licences" (
    "id" TEXT NOT NULL,
    "scope" "LicenceScope" NOT NULL,
    "userId" TEXT,
    "type" "LicenceType" NOT NULL,
    "number" TEXT NOT NULL,
    "status" "LicenceStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "designatedBroker" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practitioner_licences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_items" (
    "id" TEXT NOT NULL,
    "category" "ComplianceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "documentId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" "ComplianceItemStatus" NOT NULL DEFAULT 'MISSING',
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "subjectType" "ConsentSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "lawfulBasis" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "evidence" JSONB,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "retainForDays" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "legalHoldSupported" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_subject_requests" (
    "id" TEXT NOT NULL,
    "subjectType" "ConsentSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "type" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "handledByUserId" TEXT,
    "notes" TEXT,

    CONSTRAINT "data_subject_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequences" (
    "key" TEXT NOT NULL,
    "nextValue" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "entity" "ImportEntity" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'VALIDATED',
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "errorRows" INTEGER NOT NULL,
    "errors" JSONB NOT NULL,
    "result" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedAt" TIMESTAMP(3),

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_inbound_messages" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMsgId" TEXT NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchedUserId" TEXT,
    "threadId" TEXT,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "whatsapp_inbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "anonId" TEXT,
    "props" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshTokenHash_key" ON "sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_revokedAt_idx" ON "sessions"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "otp_challenges_destination_purpose_idx" ON "otp_challenges"("destination", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "account_activation_tokens_tokenHash_key" ON "account_activation_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "clients_ref_key" ON "clients"("ref");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_segment_idx" ON "clients"("segment");

-- CreateIndex
CREATE INDEX "client_users_userId_idx" ON "client_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_clientId_userId_key" ON "client_users"("clientId", "userId");

-- CreateIndex
CREATE INDEX "client_contacts_clientId_idx" ON "client_contacts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_onboardings_clientId_key" ON "client_onboardings"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_ref_key" ON "leads"("ref");

-- CreateIndex
CREATE INDEX "leads_status_grade_idx" ON "leads"("status", "grade");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_idx" ON "lead_activities"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_score_configs_version_key" ON "lead_score_configs"("version");

-- CreateIndex
CREATE INDEX "early_access_registrations_campaign_idx" ON "early_access_registrations"("campaign");

-- CreateIndex
CREATE INDEX "referrals_referrerClientId_idx" ON "referrals"("referrerClientId");

-- CreateIndex
CREATE UNIQUE INDEX "property_location_areas_name_city_region_key" ON "property_location_areas"("name", "city", "region");

-- CreateIndex
CREATE UNIQUE INDEX "properties_ref_key" ON "properties"("ref");

-- CreateIndex
CREATE INDEX "properties_clientId_status_idx" ON "properties"("clientId", "status");

-- CreateIndex
CREATE INDEX "properties_region_city_idx" ON "properties"("region", "city");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_type_idx" ON "properties"("type");

-- CreateIndex
CREATE INDEX "property_owners_clientId_idx" ON "property_owners"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "property_owners_propertyId_clientId_key" ON "property_owners"("propertyId", "clientId");

-- CreateIndex
CREATE INDEX "management_agreements_propertyId_status_idx" ON "management_agreements"("propertyId", "status");

-- CreateIndex
CREATE INDEX "buildings_propertyId_idx" ON "buildings"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "floors_buildingId_level_key" ON "floors"("buildingId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "units_ref_key" ON "units"("ref");

-- CreateIndex
CREATE INDEX "units_propertyId_status_idx" ON "units"("propertyId", "status");

-- CreateIndex
CREATE INDEX "property_assignments_userId_idx" ON "property_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "property_assignments_propertyId_userId_role_key" ON "property_assignments"("propertyId", "userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "property_onboarding_checklists_propertyId_key" ON "property_onboarding_checklists"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_ref_key" ON "tenants"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_userId_key" ON "tenants"("userId");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "leases_ref_key" ON "leases"("ref");

-- CreateIndex
CREATE INDEX "leases_propertyId_status_idx" ON "leases"("propertyId", "status");

-- CreateIndex
CREATE INDEX "leases_unitId_idx" ON "leases"("unitId");

-- CreateIndex
CREATE INDEX "leases_clientId_idx" ON "leases"("clientId");

-- CreateIndex
CREATE INDEX "leases_endDate_status_idx" ON "leases"("endDate", "status");

-- CreateIndex
CREATE INDEX "lease_parties_tenantId_idx" ON "lease_parties"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "lease_parties_leaseId_tenantId_key" ON "lease_parties"("leaseId", "tenantId");

-- CreateIndex
CREATE INDEX "lease_reminders_remindAt_sentAt_idx" ON "lease_reminders"("remindAt", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_type_clientId_propertyId_currency_key" ON "ledger_accounts"("type", "clientId", "propertyId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_ref_key" ON "transactions"("ref");

-- CreateIndex
CREATE INDEX "transactions_clientId_occurredAt_idx" ON "transactions"("clientId", "occurredAt");

-- CreateIndex
CREATE INDEX "transactions_propertyId_type_idx" ON "transactions"("propertyId", "type");

-- CreateIndex
CREATE INDEX "transactions_reconciliationStatus_idx" ON "transactions"("reconciliationStatus");

-- CreateIndex
CREATE INDEX "rent_charges_clientId_dueDate_idx" ON "rent_charges"("clientId", "dueDate");

-- CreateIndex
CREATE INDEX "rent_charges_dueDate_status_idx" ON "rent_charges"("dueDate", "status");

-- CreateIndex
CREATE INDEX "rent_charges_status_idx" ON "rent_charges"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rent_charges_leaseId_periodStart_key" ON "rent_charges"("leaseId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "payments_ref_key" ON "payments"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_clientId_receivedAt_idx" ON "payments"("clientId", "receivedAt");

-- CreateIndex
CREATE INDEX "payments_propertyId_status_idx" ON "payments"("propertyId", "status");

-- CreateIndex
CREATE INDEX "payment_allocations_rentChargeId_idx" ON "payment_allocations"("rentChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocations_paymentId_rentChargeId_key" ON "payment_allocations"("paymentId", "rentChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_webhook_events_provider_providerEventId_key" ON "payment_provider_webhook_events"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_ref_key" ON "expenses"("ref");

-- CreateIndex
CREATE INDEX "expenses_propertyId_status_idx" ON "expenses"("propertyId", "status");

-- CreateIndex
CREATE INDEX "expenses_approvalStatus_idx" ON "expenses"("approvalStatus");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expense_approvals_expenseId_idx" ON "expense_approvals"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "statements_ref_key" ON "statements"("ref");

-- CreateIndex
CREATE INDEX "statements_clientId_periodStart_idx" ON "statements"("clientId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "statements_clientId_propertyId_periodStart_key" ON "statements"("clientId", "propertyId", "periodStart");

-- CreateIndex
CREATE INDEX "statement_lines_statementId_idx" ON "statement_lines"("statementId");

-- CreateIndex
CREATE UNIQUE INDEX "owner_distributions_ref_key" ON "owner_distributions"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "owner_distributions_transactionId_key" ON "owner_distributions"("transactionId");

-- CreateIndex
CREATE INDEX "owner_distributions_clientId_status_idx" ON "owner_distributions"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_requests_ref_key" ON "maintenance_requests"("ref");

-- CreateIndex
CREATE INDEX "maintenance_requests_propertyId_status_idx" ON "maintenance_requests"("propertyId", "status");

-- CreateIndex
CREATE INDEX "maintenance_requests_priority_status_idx" ON "maintenance_requests"("priority", "status");

-- CreateIndex
CREATE INDEX "maintenance_status_history_requestId_idx" ON "maintenance_status_history"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_ref_key" ON "work_orders"("ref");

-- CreateIndex
CREATE INDEX "work_orders_requestId_idx" ON "work_orders"("requestId");

-- CreateIndex
CREATE INDEX "work_orders_vendorId_status_idx" ON "work_orders"("vendorId", "status");

-- CreateIndex
CREATE INDEX "maintenance_media_requestId_idx" ON "maintenance_media"("requestId");

-- CreateIndex
CREATE INDEX "maintenance_media_workOrderId_idx" ON "maintenance_media"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_ref_key" ON "vendors"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_userId_key" ON "vendors"("userId");

-- CreateIndex
CREATE INDEX "vendors_status_idx" ON "vendors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_property_assignments_vendorId_propertyId_key" ON "vendor_property_assignments"("vendorId", "propertyId");

-- CreateIndex
CREATE INDEX "vendor_documents_vendorId_idx" ON "vendor_documents"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_payments_vendorId_idx" ON "vendor_payments"("vendorId");

-- CreateIndex
CREATE INDEX "preventive_maintenance_plans_propertyId_active_idx" ON "preventive_maintenance_plans"("propertyId", "active");

-- CreateIndex
CREATE INDEX "preventive_maintenance_plans_nextDueAt_active_idx" ON "preventive_maintenance_plans"("nextDueAt", "active");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_templates_name_version_key" ON "inspection_templates"("name", "version");

-- CreateIndex
CREATE INDEX "inspection_template_areas_templateId_idx" ON "inspection_template_areas"("templateId");

-- CreateIndex
CREATE INDEX "inspection_template_items_areaId_idx" ON "inspection_template_items"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "inspections_ref_key" ON "inspections"("ref");

-- CreateIndex
CREATE INDEX "inspections_propertyId_status_idx" ON "inspections"("propertyId", "status");

-- CreateIndex
CREATE INDEX "inspections_inspectorUserId_status_idx" ON "inspections"("inspectorUserId", "status");

-- CreateIndex
CREATE INDEX "inspections_scheduledFor_idx" ON "inspections"("scheduledFor");

-- CreateIndex
CREATE INDEX "inspection_items_inspectionId_idx" ON "inspection_items"("inspectionId");

-- CreateIndex
CREATE INDEX "inspection_media_inspectionId_idx" ON "inspection_media"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storageKey_key" ON "documents"("storageKey");

-- CreateIndex
CREATE INDEX "documents_scopeType_scopeId_idx" ON "documents"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "documents_expiresAt_idx" ON "documents"("expiresAt");

-- CreateIndex
CREATE INDEX "documents_malwareScanStatus_idx" ON "documents"("malwareScanStatus");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_storageKey_key" ON "document_versions"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_documentId_versionNo_key" ON "document_versions"("documentId", "versionNo");

-- CreateIndex
CREATE INDEX "document_access_logs_documentId_idx" ON "document_access_logs"("documentId");

-- CreateIndex
CREATE INDEX "document_access_logs_userId_at_idx" ON "document_access_logs"("userId", "at");

-- CreateIndex
CREATE INDEX "document_expiry_reminders_remindAt_sentAt_idx" ON "document_expiry_reminders"("remindAt", "sentAt");

-- CreateIndex
CREATE INDEX "message_threads_clientId_idx" ON "message_threads"("clientId");

-- CreateIndex
CREATE INDEX "message_threads_type_status_idx" ON "message_threads"("type", "status");

-- CreateIndex
CREATE INDEX "thread_participants_userId_idx" ON "thread_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "thread_participants_threadId_userId_key" ON "thread_participants"("threadId", "userId");

-- CreateIndex
CREATE INDEX "messages_threadId_createdAt_idx" ON "messages"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "message_attachments_messageId_idx" ON "message_attachments"("messageId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_type_key" ON "notification_preferences"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "domain_events_dedupeKey_key" ON "domain_events"("dedupeKey");

-- CreateIndex
CREATE INDEX "domain_events_processedAt_idx" ON "domain_events"("processedAt");

-- CreateIndex
CREATE INDEX "domain_events_type_idx" ON "domain_events"("type");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_ref_key" ON "approvals"("ref");

-- CreateIndex
CREATE INDEX "approvals_clientId_status_idx" ON "approvals"("clientId", "status");

-- CreateIndex
CREATE INDEX "approvals_status_dueAt_idx" ON "approvals"("status", "dueAt");

-- CreateIndex
CREATE INDEX "approval_events_approvalId_idx" ON "approval_events"("approvalId");

-- CreateIndex
CREATE UNIQUE INDEX "health_score_configs_version_key" ON "health_score_configs"("version");

-- CreateIndex
CREATE INDEX "property_health_scores_propertyId_scoredAt_idx" ON "property_health_scores"("propertyId", "scoredAt");

-- CreateIndex
CREATE INDEX "property_health_components_scoreId_idx" ON "property_health_components"("scoreId");

-- CreateIndex
CREATE INDEX "property_health_components_key_idx" ON "property_health_components"("key");

-- CreateIndex
CREATE UNIQUE INDEX "property_rescue_assessments_ref_key" ON "property_rescue_assessments"("ref");

-- CreateIndex
CREATE INDEX "property_rescue_assessments_propertyId_idx" ON "property_rescue_assessments"("propertyId");

-- CreateIndex
CREATE INDEX "property_rescue_recommendations_assessmentId_idx" ON "property_rescue_recommendations"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "surveys_key_key" ON "surveys"("key");

-- CreateIndex
CREATE INDEX "survey_questions_surveyId_idx" ON "survey_questions"("surveyId");

-- CreateIndex
CREATE INDEX "survey_responses_surveyId_idx" ON "survey_responses"("surveyId");

-- CreateIndex
CREATE INDEX "property_health_checks_leadId_idx" ON "property_health_checks"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "property_assessments_ref_key" ON "property_assessments"("ref");

-- CreateIndex
CREATE INDEX "property_assessments_status_idx" ON "property_assessments"("status");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_at_idx" ON "audit_logs"("actorUserId", "at");

-- CreateIndex
CREATE INDEX "audit_logs_at_idx" ON "audit_logs"("at");

-- CreateIndex
CREATE INDEX "tasks_assigneeUserId_status_idx" ON "tasks"("assigneeUserId", "status");

-- CreateIndex
CREATE INDEX "tasks_dueAt_status_idx" ON "tasks"("dueAt", "status");

-- CreateIndex
CREATE INDEX "practitioner_licences_status_idx" ON "practitioner_licences"("status");

-- CreateIndex
CREATE INDEX "practitioner_licences_expiresAt_idx" ON "practitioner_licences"("expiresAt");

-- CreateIndex
CREATE INDEX "compliance_items_category_status_idx" ON "compliance_items"("category", "status");

-- CreateIndex
CREATE INDEX "compliance_items_expiresAt_idx" ON "compliance_items"("expiresAt");

-- CreateIndex
CREATE INDEX "consent_records_subjectType_subjectId_idx" ON "consent_records"("subjectType", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policies_resourceType_key" ON "retention_policies"("resourceType");

-- CreateIndex
CREATE INDEX "data_subject_requests_status_idx" ON "data_subject_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "import_jobs_ref_key" ON "import_jobs"("ref");

-- CreateIndex
CREATE INDEX "import_jobs_entity_status_idx" ON "import_jobs"("entity", "status");

-- CreateIndex
CREATE INDEX "whatsapp_inbound_messages_fromPhone_idx" ON "whatsapp_inbound_messages"("fromPhone");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_inbound_messages_provider_providerMsgId_key" ON "whatsapp_inbound_messages"("provider", "providerMsgId");

-- CreateIndex
CREATE INDEX "analytics_events_name_occurredAt_idx" ON "analytics_events"("name", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_activation_tokens" ADD CONSTRAINT "account_activation_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_onboardings" ADD CONSTRAINT "client_onboardings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerClientId_fkey" FOREIGN KEY ("referrerClientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "property_location_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_agreements" ADD CONSTRAINT "management_agreements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_assignments" ADD CONSTRAINT "property_assignments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_assignments" ADD CONSTRAINT "property_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_onboarding_checklists" ADD CONSTRAINT "property_onboarding_checklists_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_parties" ADD CONSTRAINT "lease_parties_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_parties" ADD CONSTRAINT "lease_parties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_reminders" ADD CONSTRAINT "lease_reminders_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_charges" ADD CONSTRAINT "rent_charges_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_charges" ADD CONSTRAINT "rent_charges_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_charges" ADD CONSTRAINT "rent_charges_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_charges" ADD CONSTRAINT "rent_charges_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_rentChargeId_fkey" FOREIGN KEY ("rentChargeId") REFERENCES "rent_charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "maintenance_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_approvals" ADD CONSTRAINT "expense_approvals_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements" ADD CONSTRAINT "statements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements" ADD CONSTRAINT "statements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_lines" ADD CONSTRAINT "statement_lines_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_lines" ADD CONSTRAINT "statement_lines_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_distributions" ADD CONSTRAINT "owner_distributions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_distributions" ADD CONSTRAINT "owner_distributions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_distributions" ADD CONSTRAINT "owner_distributions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_distributions" ADD CONSTRAINT "owner_distributions_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "statements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_reportedByTenantId_fkey" FOREIGN KEY ("reportedByTenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_status_history" ADD CONSTRAINT "maintenance_status_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_media" ADD CONSTRAINT "maintenance_media_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_media" ADD CONSTRAINT "maintenance_media_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_property_assignments" ADD CONSTRAINT "vendor_property_assignments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_property_assignments" ADD CONSTRAINT "vendor_property_assignments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_maintenance_plans" ADD CONSTRAINT "preventive_maintenance_plans_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_template_areas" ADD CONSTRAINT "inspection_template_areas_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "inspection_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_template_items" ADD CONSTRAINT "inspection_template_items_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "inspection_template_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "inspection_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspectorUserId_fkey" FOREIGN KEY ("inspectorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_media" ADD CONSTRAINT "inspection_media_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_media" ADD CONSTRAINT "inspection_media_inspectionItemId_fkey" FOREIGN KEY ("inspectionItemId") REFERENCES "inspection_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_expiry_reminders" ADD CONSTRAINT "document_expiry_reminders_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_participants" ADD CONSTRAINT "thread_participants_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_participants" ADD CONSTRAINT "thread_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_health_scores" ADD CONSTRAINT "property_health_scores_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_health_components" ADD CONSTRAINT "property_health_components_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "property_health_scores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_rescue_assessments" ADD CONSTRAINT "property_rescue_assessments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_rescue_recommendations" ADD CONSTRAINT "property_rescue_recommendations_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "property_rescue_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_health_checks" ADD CONSTRAINT "property_health_checks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

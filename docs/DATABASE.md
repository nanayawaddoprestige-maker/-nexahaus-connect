# Database Design

PostgreSQL 16 + Prisma. One database, normalized relational model. This document is the
source of truth for `apps/api/prisma/schema.prisma`.

## 1. Conventions

| Concern | Rule |
|---|---|
| Primary keys | `id` — UUID v7 (`@default(dbgenerated("uuidv7()"))` or app-generated). Sortable, non-enumerable. |
| Human refs | Separate `ref` column from a `Sequence` table: `NH-000001` (property), `PL-000001` (payment), `MR-…`, `WO-…`, `INS-…`, `EXP-…`, `STMT-…`. Unique, indexed. |
| Timestamps | `createdAt` / `updatedAt` on every table. Business time (e.g. `occurredAt`, `receivedAt`, `dueDate`) is separate from row time. |
| Soft delete | `deletedAt` (nullable) + `deletedById` where deletion is allowed. Financial and audit rows are **never** hard-deleted casually — use status/adjustments. |
| Money | `<name>Minor BigInt` + `<name>Currency Char(3)`. Never Float/Decimal for stored amounts. `Decimal(9,6)` for rates/percentages only. |
| Enums | Postgres enums via Prisma `enum`. Adding values is a migration. |
| JSON | `Json` columns only for genuinely open/versioned structures (score component snapshots, survey answers, consent evidence, event payloads). Everything queried is a real column. |
| Multi-tenancy | Owner-facing rows carry a resolvable path to `clientId` (direct FK or via `propertyId`). Enforced in the repository layer. |
| Indexes | FK columns, `ref`, `status`, `(propertyId, status)`, `(clientId, …)`, `dueDate`, `occurredAt`, `expiresAt`, and every column used in list filters (spec §53). |
| Audit | `AuditLog` is append-only (no update/delete grant to app role). |

## 2. Domain: Identity & Access

**User** — `id, email (unique, citext), phone (unique, E.164), passwordHash, status
[PENDING_VERIFICATION|ACTIVE|SUSPENDED|DISABLED], emailVerifiedAt?, phoneVerifiedAt?,
fullName, avatarDocumentId?, mfaEnabled, mfaSecretEnc?, lastLoginAt?, failedLoginCount,
lockedUntil?, createdAt, updatedAt, deletedAt?`

**Role** — `id, key (unique: SUPER_ADMIN|MANAGING_DIRECTOR|PROPERTY_MANAGER|
FINANCE_OFFICER|MAINTENANCE_OFFICER|INSPECTOR|LEASING_OFFICER|SUPPORT_STAFF|VENDOR|OWNER|
TENANT), name, description, isSystem`

**Permission** — `id, key (unique, e.g. property:read, payment:approve, statement:generate,
audit:read), description, group`

**RolePermission** — `roleId, permissionId` (composite PK)

**UserRole** — `id, userId, roleId, grantedById, grantedAt` (a user may hold several roles)

**Session** — `id, userId, refreshTokenHash (unique), userAgent, ip, deviceLabel?,
createdAt, lastUsedAt, expiresAt, revokedAt?, rotatedFromId?` — refresh-token rotation
chain; reuse of a rotated token revokes the whole chain.

**OtpChallenge** — `id, userId?, destination (email/phone), purpose
[VERIFY_EMAIL|VERIFY_PHONE|LOGIN_MFA|PASSWORD_RESET], codeHash, expiresAt, consumedAt?,
attempts`

**PasswordResetToken** — `id, userId, tokenHash (unique), expiresAt, usedAt?`

## 3. Domain: Client (Owner) & CRM

**Client** — `id, ref, type [INDIVIDUAL|COMPANY], displayName, legalName?, segment
[DIASPORA|RESIDENT|INVESTOR|DEVELOPER|COMMERCIAL|OTHER], status [PROSPECT|ONBOARDING|
ACTIVE|INACTIVE|SUSPENDED], primaryEmail, primaryPhone, countryOfResidence,
servicePackage [BASIC|PROFESSIONAL|PREMIUM|ENTERPRISE]?, accountManagerUserId?,
createdAt, updatedAt, deletedAt?`

**ClientUser** — `id, clientId, userId, relationship [PRIMARY|MEMBER|ACCOUNTANT|
REPRESENTATIVE], canApprove, invitedById, invitedAt, acceptedAt?` — links login users to
the client(s) they may act for. **The owner authorization scope is derived from this
table.**

**ClientContact** — `id, clientId, name, role, email?, phone?, isEmergency`

**ClientOnboarding** — `id, clientId, currentStep (1..10), status [IN_PROGRESS|BLOCKED|
COMPLETE], kycStatus [NOT_STARTED|SUBMITTED|VERIFIED|REJECTED], managementAgreementDocId?,
agreementAcceptedAt?, startedAt, completedAt?`

**Lead** — `id, ref, name, email, phone, source [FACEBOOK|INSTAGRAM|TIKTOK|LINKEDIN|
WEBSITE|WHATSAPP|REFERRAL|EVENT|DIASPORA_CAMPAIGN|PROPERTY_RESCUE|OTHER], campaign?,
segment?, propertyCount?, propertyType?, location?, serviceInterest String[],
livesInGhana?, biggestChallenge?, score Int, grade [A|B|C|D], status [NEW|CONTACTED|
QUALIFIED|CONSULTATION|ASSESSMENT|PROPOSAL|WON|LOST], ownerUserId?, convertedClientId?,
consent Json, createdAt, updatedAt`

**LeadActivity** — `id, leadId, type [NOTE|CALL|EMAIL|MEETING|STATUS_CHANGE|TASK],
body, byUserId, occurredAt, dueAt?, completedAt?`

**LeadScoreConfig** — `id, version, factors Json (weightings), active` — configurable
(spec §74).

**EarlyAccessRegistration** — `id, name, email, phone, propertyCount?, location?,
interest?, campaign [FOUNDING_100|EARLY_ACCESS|OWNER_CLUB], status, createdAt`

**Referral** — `id, referrerClientId, refereeName, refereeContact, type [OWNER|INVESTOR|
DEVELOPER], status [SUBMITTED|CONTACTED|CONVERTED|CLOSED], createdAt` (no commissions).

## 4. Domain: Property, Building, Unit

**Property** — `id, ref (NH-000001), clientId (managing owner-client), name, type [OFFICE|
RETAIL|WAREHOUSE|MIXED_USE|APARTMENT|HOUSE|LAND|SHORT_STAY|OTHER], status [ACTIVE|VACANT|
OCCUPIED|UNDER_MAINTENANCE|UNDER_RENOVATION|SUSPENDED|SOLD|ARCHIVED],
addressLine, areaId, city, region, country (default GH), gpsLat?, gpsLng?,
ownershipStatus?, acquisitionDate?, estimatedValueMinor?, estimatedValueCurrency?,
valuationDate?, unitCount Int, bedrooms?, bathrooms?, floorAreaSqm?, landSizeSqm?,
description?, coverImageDocumentId?, onboardingComplete Boolean, createdAt, updatedAt,
deletedAt?`

**PropertyOwner** — `id, propertyId, clientId, sharePercent Decimal(5,2), isPrimary` —
supports co-ownership; statements/distributions split by share.

**ManagementAgreement** — `id, propertyId, feeType [PERCENT_OF_COLLECTED|
PERCENT_OF_EXPECTED|FIXED_MONTHLY|CUSTOM], feePercent Decimal(5,2)?, feeFixedMinor BigInt?,
feeCurrency, startDate, endDate?, inspectionFrequency [MONTHLY|QUARTERLY|BIANNUAL|ANNUAL|
CUSTOM], maintenanceApprovalThresholdMinor BigInt, thresholdCurrency, documentId?,
status [DRAFT|ACTIVE|EXPIRED|TERMINATED], createdAt` — **fee is never hardcoded** (spec §98).

**PropertyLocationArea** — `id, name, city, region` (Ghana-first hierarchy: country →
region → city → municipality/district → area → address → GPS, spec §54).

**Building** — `id, propertyId, name, floorsCount?`
**Floor** — `id, buildingId, level Int, label`
**Unit** — `id, propertyId, buildingId?, floorId?, ref, label (e.g. "Unit 101"),
bedrooms?, bathrooms?, floorAreaSqm?, marketRentMinor?, marketRentCurrency?,
status [VACANT|OCCUPIED|RESERVED|MAINTENANCE|UNAVAILABLE], createdAt, updatedAt, deletedAt?`

**PropertyAssignment** — `id, propertyId, userId, role [PROPERTY_MANAGER|
MAINTENANCE_OFFICER|INSPECTOR|LEASING_OFFICER|SUPPORT_STAFF], startDate, endDate?` —
**the staff authorization scope for a property is derived from this table.**

**PropertyOnboardingChecklist** — `id, propertyId, items Json (label→{done,by,at}),
completionPercent Int, status [IN_PROGRESS|COMPLETE]` (spec §35 items).

## 5. Domain: Tenants & Leases

**Tenant** — `id, ref, fullName, phone, email?, emergencyContactName?,
emergencyContactPhone?, idDocumentType?, idDocumentRef?, idDocumentFileId?,
status [PROSPECTIVE|ACTIVE|NOTICE_GIVEN|FORMER], createdAt, updatedAt, deletedAt?` —
sensitive fields column-encrypted or access-restricted; never exposed to owners other than
the one whose property the tenant occupies, and never to other tenants.

**Lease** — `id, ref, propertyId, unitId, clientId (owner), startDate, endDate,
rentMinor BigInt, rentCurrency, frequency [MONTHLY|QUARTERLY|BIANNUAL|ANNUAL|CUSTOM],
customFrequencyDays Int?, depositMinor BigInt?, depositCurrency?, noticePeriodDays Int,
renewalStatus [NONE|OFFERED|ACCEPTED|DECLINED], documentId?, status [DRAFT|ACTIVE|
EXPIRING|EXPIRED|TERMINATED|RENEWED], terminatedAt?, terminationReason?, createdAt,
updatedAt`

**LeaseParty** — `id, leaseId, tenantId, isPrimary` (multiple tenants per lease).

**LeaseReminder** — `id, leaseId, type [EXPIRY|RENEWAL|RENT_REVIEW|CUSTOM], remindAt,
sentAt?, note` — offsets are configurable in `OrganizationSetting`.

## 6. Domain: Finance & Ledger

**LedgerAccount** — `id, type [COMPANY_OPERATING|OWNER_FUNDS|TENANT_DEPOSITS|
PROPERTY_EXPENSE|VENDOR_PAYABLE|OWNER_DISTRIBUTION|RENT_INCOME], clientId?, propertyId?,
currency` — separates company / owner / tenant / expense / vendor / distribution funds
(spec §49).

**Transaction** — `id, ref, type [RENT_CHARGE|RENT_PAYMENT|EXPENSE|MANAGEMENT_FEE|
OWNER_DISTRIBUTION|DEPOSIT|REFUND|ADJUSTMENT|REVERSAL], amountMinor BigInt, currency,
occurredAt, propertyId?, unitId?, leaseId?, tenantId?, clientId?, vendorId?, category?,
reference?, method [MOBILE_MONEY|BANK_TRANSFER|BANK_DEPOSIT|CASH|ONLINE|OTHER|NONE],
provider?, status [PENDING|POSTED|VOID], reconciliationStatus [UNRECONCILED|RECONCILED|
DISPUTED], reversesTransactionId?, sourceEventId?, createdById, approvedById?, createdAt`
— POSTED + RECONCILED transactions are immutable; changes are new `REVERSAL`/`ADJUSTMENT`
rows.

**RentCharge** — `id, leaseId, propertyId, unitId, clientId, periodStart, periodEnd,
dueDate, amountMinor BigInt, currency, paidMinor BigInt (default 0),
status [EXPECTED|PARTIALLY_PAID|PAID|OVERDUE|WAIVED|REFUNDED], waivedById?, waivedReason?,
createdAt, updatedAt` — `outstandingMinor` is derived (`amountMinor - paidMinor`).

**Payment** — `id, ref, tenantId?, leaseId?, propertyId, unitId?, clientId, amountMinor
BigInt, currency, receivedAt, method, provider?, providerRef?, status [PENDING|CONFIRMED|
FAILED|REFUNDED], reconciliationStatus, idempotencyKey (unique), evidenceDocumentId?,
recordedById?, createdAt`

**PaymentAllocation** — `id, paymentId, rentChargeId, amountMinor BigInt` — a payment
splits across one or more charges; `SUM(allocations) <= payment.amountMinor` (unallocated =
credit balance).

**PaymentProviderWebhookEvent** — `id, provider, providerEventId, signatureValid Boolean,
payload Json, receivedAt, processedAt?, resultingPaymentId?` — **unique
`(provider, providerEventId)`** guarantees idempotency; replays are no-ops.

**Expense** — `id, ref, propertyId, unitId?, vendorId?, category [PLUMBING|ELECTRICAL|
PAINTING|CLEANING|SECURITY|LANDSCAPING|AIR_CONDITIONING|PEST_CONTROL|REPAIRS|INSURANCE|
UTILITIES|OTHER], description, amountMinor BigInt, taxMinor BigInt (default 0), currency,
invoiceDocumentId?, incurredAt, status [DRAFT|SUBMITTED|APPROVED|REJECTED|PAID|VOID],
approvalStatus [NOT_REQUIRED|PENDING|APPROVED|DECLINED], paymentStatus [UNPAID|SCHEDULED|
PAID], maintenanceRequestId?, createdById, createdAt, updatedAt`

**ExpenseApproval** — `id, expenseId, approvalId, approverUserId, decision [APPROVED|
DECLINED|INFO_REQUESTED], note?, decidedAt`

**Statement** — `id, ref, clientId, propertyId? (null = portfolio), periodStart, periodEnd,
openingBalanceMinor BigInt, closingBalanceMinor BigInt, currency, grossRentalIncomeMinor,
managementFeesMinor, maintenanceExpensesMinor, otherExpensesMinor, netAmountMinor,
distributionsMinor, status [DRAFT|ISSUED|SENT|ARCHIVED], pdfDocumentId?, generatedAt,
generatedById` — **all totals recomputed from `StatementLine` / transactions; never
hand-edited** (spec §18).

**StatementLine** — `id, statementId, transactionId?, occurredAt, description,
category, direction [CREDIT|DEBIT], amountMinor BigInt`

**OwnerDistribution** — `id, ref, clientId, propertyId?, periodStart, periodEnd,
amountMinor BigInt, currency, method, status [PENDING|APPROVED|PAID|FAILED],
transactionId?, statementId?, createdById, paidAt?`

## 7. Domain: Maintenance

**MaintenanceRequest** — `id, ref (MR-…), propertyId, unitId?, leaseId?,
reportedByType [TENANT|STAFF|OWNER|SYSTEM], reportedByUserId?, reportedByTenantId?,
category, priority [LOW|MEDIUM|HIGH|URGENT], title, description,
status [REPORTED|ACKNOWLEDGED|ASSIGNED|SCHEDULED|IN_PROGRESS|AWAITING_APPROVAL|COMPLETED|
VERIFIED|CLOSED|CANCELLED], estimatedCostMinor?, approvedCostMinor?, actualCostMinor?,
costCurrency?, scheduledFor?, completedAt?, verifiedAt?, verifiedByUserId?, closedAt?,
cancellationReason?, createdAt, updatedAt`

**MaintenanceStatusHistory** — `id, requestId, fromStatus?, toStatus, byUserId, note?,
changedAt` — **every transition** (spec §82).

**WorkOrder** — `id, ref (WO-…), requestId, vendorId?, assignedUserId?, scheduledFor?,
startedAt?, completedAt?, status [DRAFT|ISSUED|IN_PROGRESS|COMPLETED|CANCELLED],
costMinor?, currency?, invoiceDocumentId?, completionNotes?, createdById, createdAt`

**MaintenanceMedia** — `id, requestId?, workOrderId?, documentId, kind [BEFORE|AFTER|
REPORTED|OTHER], caption?, uploadedById, createdAt`

**Vendor** — `id, ref, name, type [COMPANY|INDIVIDUAL], categories String[], phone,
email?, region?, servicesDescription?, rating Decimal(3,2)?, status [ACTIVE|SUSPENDED|
BLACKLISTED], insuranceExpiryAt?, createdAt, updatedAt, deletedAt?`

**VendorPropertyAssignment** — `id, vendorId, propertyId, addedById, addedAt`
**VendorDocument** — `id, vendorId, documentId, type [INSURANCE|LICENCE|CONTRACT|OTHER]`
**VendorPayment** — `id, vendorId, expenseId?, workOrderId?, amountMinor, currency,
status, paidAt?, transactionId?`

**PreventiveMaintenancePlan** — `id, propertyId, unitId?, serviceType (configurable:
AC_SERVICING|PLUMBING_INSPECTION|ELECTRICAL_INSPECTION|PEST_CONTROL|GENERATOR_SERVICING|
LANDSCAPING|PAINTING|WATER_SYSTEMS|FIRE_SAFETY|SECURITY_SYSTEMS|OTHER),
frequency [WEEKLY|MONTHLY|QUARTERLY|BIANNUAL|ANNUAL|CUSTOM], intervalDays Int?,
nextDueAt, lastRunAt?, vendorId?, active Boolean, createdById, createdAt`

## 8. Domain: Inspections

**InspectionTemplate** — `id, name, version Int, isActive` (default areas/items per spec §24).
**InspectionTemplateArea** — `id, templateId, name (LIVING_ROOM|KITCHEN|MASTER_BEDROOM|
BEDROOM_2|BEDROOM_3|BATHROOMS|EXTERIOR|ROOF|ELECTRICAL|PLUMBING|SECURITY|OTHER), sortOrder`
**InspectionTemplateItem** — `id, areaId, label, sortOrder`

**Inspection** — `id, ref (INS-…), propertyId, unitId?, type [INITIAL|ROUTINE|MOVE_IN|
MOVE_OUT|MAINTENANCE|EMERGENCY|PRE_HANDOVER|POST_MAINTENANCE|ANNUAL], templateId,
inspectorUserId, status [ASSIGNED|SCHEDULED|IN_PROGRESS|COMPLETED|REVIEWED|REPORT_ISSUED],
scheduledFor?, startedAt?, completedAt?, reviewedByUserId?, reviewedAt?,
overallCondition [EXCELLENT|GOOD|FAIR|POOR]?, inspectorSignatureRef?, ownerReviewedAt?,
reportDocumentId?, createdById, createdAt`

**InspectionItem** — `id, inspectionId, area, label, rating [GOOD|ATTENTION_REQUIRED|
URGENT|NOT_APPLICABLE], note?, recommendation?, sortOrder`

**InspectionMedia** — `id, inspectionId, inspectionItemId?, documentId, caption?,
capturedAt?, gpsLat?, gpsLng?`

## 9. Domain: Documents (Vault)

**Document** — `id, scopeType [PROPERTY|UNIT|LEASE|TENANT|CLIENT|MAINTENANCE_REQUEST|
WORK_ORDER|INSPECTION|EXPENSE|STATEMENT|VENDOR|COMPLIANCE|USER], scopeId,
category [PROPERTY|OWNERSHIP|TENANCY|INSURANCE|INSPECTION_REPORT|MAINTENANCE_REPORT|
INVOICE|RECEIPT|VALUATION|LEGAL|TAX|OTHER], title, mimeType, sizeBytes BigInt,
checksumSha256, storageKey, currentVersionId, uploadedById, expiresAt?,
malwareScanStatus [PENDING|CLEAN|INFECTED|ERROR], status [ACTIVE|ARCHIVED|DELETED],
createdAt, updatedAt, deletedAt?, deletedById?`

**DocumentVersion** — `id, documentId, versionNo Int, storageKey, sizeBytes BigInt,
checksumSha256, uploadedById, createdAt`

**DocumentAccessLog** — `id, documentId, userId, action [VIEW|DOWNLOAD|UPLOAD|
DELETE|SHARE], ip?, at` — every access, always.

**DocumentExpiryReminder** — `id, documentId, remindAt, offsetDays, sentAt?`

## 10. Domain: Communication & Notifications

**MessageThread** — `id, type [OWNER_NEXAHAUS|TENANT_NEXAHAUS|INTERNAL|MAINTENANCE],
subjectRefType?, subjectRefId?, clientId?, propertyId?, title, status [OPEN|CLOSED],
createdById, createdAt, lastMessageAt`

**ThreadParticipant** — `id, threadId, userId, role [MEMBER|OWNER_SIDE|NEXAHAUS_SIDE],
lastReadAt?, mutedAt?` — participation is the messaging authorization boundary.

**Message** — `id, threadId, senderUserId, body, createdAt, editedAt?, deletedAt?`
**MessageAttachment** — `id, messageId, documentId`

**Notification** — `id, userId, type, title, body, data Json, channels String[],
readAt?, createdAt, sourceEventId?`

**NotificationPreference** — `id, userId, type, inApp Boolean, email Boolean, sms Boolean,
whatsapp Boolean, push Boolean` — default-on for in-app; configurable per user/type.

**DomainEvent** (outbox) — `id, type, payload Json, occurredAt, dedupeKey?, processedAt?,
attempts Int, lastError?`

## 11. Domain: Approvals

**Approval** — `id, ref, type [MAINTENANCE_COST|EXPENSE|RENT_CHANGE|LEASE_TERMINATION|
DISTRIBUTION|OTHER], subjectRefType, subjectRefId, propertyId?, clientId,
requestedByUserId, thresholdMinor?, thresholdCurrency?, amountMinor?, currency?,
status [PENDING|APPROVED|DECLINED|INFO_REQUESTED|CANCELLED|EXPIRED], decidedByUserId?,
decidedAt?, decisionNote?, dueAt?, createdAt`

**ApprovalEvent** — `id, approvalId, action [CREATED|VIEWED|APPROVED|DECLINED|
INFO_REQUESTED|COMMENT|CANCELLED], byUserId, note?, at`

## 12. Domain: Property Health & Rescue

**HealthScoreConfig** — `id, version Int, weights Json ({occupancy, rentCollection,
maintenance, condition, tenantSatisfaction, documentation, security, financial}),
active Boolean, createdById, createdAt` — admin-configurable (spec §11).

**PropertyHealthScore** — `id, propertyId, score Int (0..100), scoredAt,
methodologyVersion Int, components Json (per-factor value/weight/weighted),
recommendations Json, computedByJobId?` — history retained; latest per property drives
dashboards.

**PropertyHealthComponent** — `id, scoreId, key, rawValue Decimal, weight Decimal,
weightedScore Decimal` (also flattened as rows for querying/trends).

**PropertyRescueAssessment** — `id, ref, propertyId, overallScore Int, assessedAt,
assessedByUserId, inputs Json, findings Json, status [DRAFT|FINAL], pdfDocumentId?,
createdAt`

**PropertyRescueRecommendation** — `id, assessmentId, sortOrder, title, detail,
priority [LOW|MEDIUM|HIGH|URGENT], status [OPEN|IN_PROGRESS|DONE|DISMISSED]`

## 13. Domain: Surveys, Health Check, Assessment

**Survey** — `id, key, name, status [DRAFT|PUBLISHED|CLOSED], version Int`
**SurveyQuestion** — `id, surveyId, sortOrder, type [SINGLE|MULTI|TEXT|NUMBER|SCALE|
BOOLEAN], prompt, options Json?, required Boolean`
**SurveyResponse** — `id, surveyId, leadId?, submittedAt, answers Json, consent Json,
ipHash?, userAgent?`

**PropertyHealthCheck** — `id, leadId?, contactName, email, phone, propertyInfo Json,
answers Json, preliminaryScore Int, consent Json, createdAt` — public lead magnet;
result screen must state it is a **preliminary digital** assessment, distinct from a
professional one.

**PropertyAssessment** — `id, ref, clientId?, leadId?, propertyRef?, type [PRELIMINARY|
PROFESSIONAL], status [REQUESTED|SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED], requestedAt,
scheduledFor?, assessorUserId?, reportDocumentId?, notes?`

## 14. Domain: Config, Compliance, Audit

**OrganizationSetting** — `key (PK), value Json, updatedById, updatedAt` — company profile,
branding, currencies, provider selection, categories, property types, inspection template
ids, health-score config id, approval thresholds, expense categories, lease-reminder
offsets, notification templates (spec §76).

**SystemSetting** — `key (PK), value Json` — platform-level, non-tenant.

**AuditLog** — `id, actorUserId?, actorRoleKey?, action, resourceType, resourceId?,
before Json?, after Json?, ip?, userAgent?, sessionId?, requestId?, at` — **append-only**;
DB role has `INSERT, SELECT` only.

**Task** — `id, title, type, assigneeUserId?, dueAt?, status [OPEN|IN_PROGRESS|DONE|
CANCELLED], relatedRefType?, relatedRefId?, createdById, createdAt`

**PractitionerLicence** — `id, scope [ORG|USER], userId?, type [REAL_ESTATE_AGENT|
BROKER|VALUER|OTHER], number, status [ACTIVE|PENDING|EXPIRED|REVOKED], issuedAt?,
expiresAt?, designatedBroker?, documentId?` — gates regulated agency features (spec §48).

**ComplianceItem** — `id, category [COMPANY_DOC|TAX|INSURANCE|LICENCE|DATA_PROTECTION|
EMPLOYEE|PROPERTY_DOC|LEASE_DOC], title, documentId?, expiresAt?, status [OK|DUE_SOON|
EXPIRED|MISSING], ownerUserId?` (spec §107).

**ConsentRecord** — `id, subjectType [LEAD|TENANT|CLIENT|USER|SURVEY_RESPONDENT],
subjectId, purpose, lawfulBasis, grantedAt, revokedAt?, source, evidence Json` (spec §47).

**RetentionPolicy** — `id, resourceType, retainForDays Int, action [ANONYMIZE|DELETE|
ARCHIVE], legalHoldSupported Boolean` — financial/audit records retained per policy, not
deleted on request.

**DataSubjectRequest** — `id, subjectType, subjectId, type [ACCESS|EXPORT|ERASURE|
RECTIFICATION], status [RECEIVED|IN_PROGRESS|COMPLETED|REJECTED], requestedAt,
completedAt?, handledByUserId?, notes?`

**Sequence** — `key (PK), nextValue BigInt` — atomic ref generation.

## 15. Key relationships (cardinality)

- `Client 1—* Property` (managing client); `Property *—* Client` via `PropertyOwner`
  (co-ownership).
- `Client *—* User` via `ClientUser`. `User *—* Role` via `UserRole`.
- `Property 1—* Unit`; `Property 1—* Building 1—* Floor 1—* Unit` (optional path).
- `Unit 1—* Lease`; `Lease *—* Tenant` via `LeaseParty`.
- `Lease 1—* RentCharge 1—* PaymentAllocation *—1 Payment`.
- `Property 1—* MaintenanceRequest 1—* WorkOrder *—1 Vendor`.
- `Property 1—* Inspection 1—* InspectionItem 1—* InspectionMedia`.
- `Document` polymorphic via `(scopeType, scopeId)` + `1—* DocumentVersion`.
- `Statement 1—* StatementLine *—1 Transaction`.
- `Property 1—* PropertyHealthScore` (history); `Property 1—* PropertyRescueAssessment`.
- `DomainEvent` → consumed → `Notification`, `Statement`, `PropertyHealthScore`.

## 16. Migrations & seeding

- Prisma Migrate; one migration per logical change; never edit an applied migration.
- `prisma migrate deploy` in CI/staging/production; `migrate dev` locally.
- **Seed** (`apps/api/prisma/seed.ts`, idempotent):
  1. Permissions + roles + role-permission matrix.
  2. `OrganizationSetting` defaults (branding, GHS, categories, health-score config,
     approval threshold, inspection template, lease-reminder offsets).
  3. Demo company **NexaHaus Properties & Asset Management Ltd.**, demo `OWNER`
     (`DEMO_OWNER_EMAIL`) and demo `SUPER_ADMIN`/`PROPERTY_MANAGER`
     (`DEMO_ADMIN_EMAIL`), passwords from `DEMO_ACCOUNT_PASSWORD`. Development only,
     gated by `SEED_DEMO_DATA=true`.
  4. 5 fictional properties, multiple units, tenants, leases, rent charges + payments,
     expenses, maintenance requests (varied statuses), inspections with items,
     documents (placeholder objects), notifications, a statement per property, health
     scores. **No real personal data.**

## 17. Indexing summary (initial)

```
User(email), User(phone), User(status)
Session(refreshTokenHash), Session(userId, revokedAt)
ClientUser(userId), ClientUser(clientId)
Property(ref), Property(clientId, status), Property(region, city), Property(status)
PropertyOwner(clientId), PropertyAssignment(userId), PropertyAssignment(propertyId)
Unit(propertyId, status), Unit(ref)
Lease(propertyId, status), Lease(unitId), Lease(clientId), Lease(endDate, status)
RentCharge(leaseId, status), RentCharge(clientId, dueDate), RentCharge(dueDate, status)
Payment(idempotencyKey UNIQUE), Payment(clientId, receivedAt), Payment(propertyId, status)
PaymentProviderWebhookEvent(provider, providerEventId UNIQUE)
Transaction(clientId, occurredAt), Transaction(propertyId, type), Transaction(reconciliationStatus)
Expense(propertyId, status), Expense(approvalStatus), Expense(category)
MaintenanceRequest(propertyId, status), MaintenanceRequest(priority, status), MaintenanceRequest(ref)
WorkOrder(requestId), WorkOrder(vendorId, status)
Inspection(propertyId, status), Inspection(inspectorUserId, status), Inspection(scheduledFor)
Document(scopeType, scopeId), Document(expiresAt), Document(malwareScanStatus)
Notification(userId, readAt), DomainEvent(processedAt), DomainEvent(type)
Approval(clientId, status), Approval(status, dueAt)
PropertyHealthScore(propertyId, scoredAt)
Lead(status, grade), Lead(ownerUserId), Lead(source)
AuditLog(resourceType, resourceId), AuditLog(actorUserId, at), AuditLog(at)
```

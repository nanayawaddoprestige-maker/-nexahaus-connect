# Compliance & Regulatory Design

This document describes how the platform is **designed to support** compliance. It is not
legal advice. NexaHaus must obtain qualified Ghanaian legal and regulatory review before
launch and before enabling any regulated feature.

## 1. Data protection (Ghana Data Protection Act, 2012 — Act 843)

The platform processes personal data of owners, tenants, leads, vendors and staff. It is
designed to support the Act's principles.

| Requirement | Platform support |
|---|---|
| Lawful basis & purpose | `ConsentRecord` (subject, purpose, lawful basis, evidence, granted/revoked). Marketing/survey/health-check flows capture explicit consent and store the exact wording shown. Processing purposes documented per data category. |
| Data minimisation | Explicit DTOs; only fields with a stated purpose are collected. Tenant ID-document data is optional, access-restricted and encrypted. |
| Accuracy & rectification | `DataSubjectRequest` type `RECTIFICATION`; audited edits. |
| Right of access / portability | `DataSubjectRequest` types `ACCESS` / `EXPORT` produce a structured export of the subject's data within scope. |
| Right to erasure (bounded) | `DataSubjectRequest` type `ERASURE`. Erasure **anonymises** rather than hard-deletes where financial/audit retention applies (see §3). `RetentionPolicy` governs what can be removed and when. |
| Retention | `RetentionPolicy` per resource type (`retainForDays`, `action` = ANONYMIZE/DELETE/ARCHIVE). Financial ledger, statements, tax and audit records are retained for the statutory period regardless of an erasure request. |
| Security safeguards | See [SECURITY.md](SECURITY.md) — encryption in transit, at rest where supported, RBAC, audit, access logging, breach detection. |
| Data Protection Officer / registration | Admin area for DPO details, data-processing register, and processor (vendor) records. Designed to support Data Protection Commission registration. |
| Processor management | `Vendor` + `VendorDocument` (contracts), plus a processing-activities register in settings. Notification/payment/storage providers are recorded with purpose and data categories. |
| Breach handling | `AuditLog` + `DocumentAccessLog` support impact assessment; incident runbook covers notification obligations to the Commission and affected subjects. |
| Cross-border transfers | Provider selection (email/SMS/storage/analytics) is config-driven; the processing register records provider location so transfers can be assessed and disclosed. |

**Consent is never assumed.** Marketing communications are gated on a stored consent
record; unsubscribe/opt-out is honoured and recorded.

## 2. Real estate regulatory boundaries (Real Estate Agency Act, 2020 — Act 1047)

The product separates activities so that **regulated agency functions are enabled only when
NexaHaus holds the required licensing and qualified personnel**.

| Activity | Default | Gating |
|---|---|---|
| Property management | Enabled | Core product |
| Asset management | Enabled | Core product |
| Facilities management | Enabled | Core product |
| Leasing (tenant sourcing, lease negotiation on behalf of owner) | **Disabled** | Feature flag + `LEASING_OFFICER` role + valid `PractitionerLicence` |
| Real estate agency (brokerage, representing parties in transactions) | **Disabled** | Feature flag + `PractitionerLicence` (scope ORG, `designatedBroker` set) |
| Property sales / marketing listings | **Disabled** | Feature flag + licence; not built into MVP |

- `PractitionerLicence` stores licence type, number, status, issue/expiry, and the
  designated broker where applicable; expiring licences raise `ComplianceItem` alerts.
- The UI must **never** present an unlicensed user as a licensed broker or agent.
- Regulated workflows are permission-controlled and hidden entirely when the corresponding
  flag/licence is absent.

## 3. Financial controls (spec §49–50)

- **Segregation:** `LedgerAccount.type` separates `COMPANY_OPERATING`, `OWNER_FUNDS`,
  `TENANT_DEPOSITS`, `PROPERTY_EXPENSE`, `VENDOR_PAYABLE`, `OWNER_DISTRIBUTION`,
  `RENT_INCOME`. Owner and tenant funds are never commingled with company operating funds
  in the model.
- **Immutability:** a `Transaction` that is `POSTED` and `RECONCILED` cannot be edited or
  deleted. Corrections are new `REVERSAL` / `ADJUSTMENT` transactions referencing the
  original, with actor and reason.
- **Approvals:** expenses and distributions above configured thresholds require recorded
  approval before they can be paid.
- **Reconciliation:** `reconciliationStatus` on payments and transactions; a reconciled
  batch is locked.
- **Auditability:** every financial mutation writes an `AuditLog` row with before/after.
- **Statements** are always recomputed from transactions and never hand-adjusted.

## 4. Product-wide legal disclaimers (spec §31, §32, §103, §108)

The platform must clearly state, wherever the relevant output appears:

- Automated figures are **not** professional legal, valuation, tax, or investment advice.
- Estimated values and yields are **estimates**, not verified valuations. Manually entered
  valuations are labelled with source, date and valuer.
- Digital / preliminary assessments (Property Health Check, automated Property Health
  Score) are distinct from a **professional property assessment**; the UI labels each.
- AI / automated recommendations are labelled **"recommendation, not a statement of fact"**
  and, where professional input is needed, **"Professional review required."**

## 5. Compliance dashboard (internal, spec §107)

`ComplianceItem` tracks company documents, tax filings, insurance, practitioner /
REAC licences, data-protection obligations, employee compliance, and property/lease
documentation — each with an optional document, expiry date and status
(`OK / DUE_SOON / EXPIRED / MISSING`). Configurable categories; expiry drives alerts and
tasks.

## 6. Open items requiring qualified review before launch

1. Confirmation of Data Protection Commission registration and DPO appointment.
2. Legal review of the management agreement template and any e-signature reliance.
3. Regulatory confirmation of which activities require Act 1047 licensing and the status
   of NexaHaus's application(s).
4. Tax treatment of management fees, owner distributions, and withholding obligations.
5. Retention periods for financial and tenancy records under Ghanaian law (to populate
   `RetentionPolicy`).
6. Consumer-protection and electronic-transactions requirements for the public website and
   online payment flows.

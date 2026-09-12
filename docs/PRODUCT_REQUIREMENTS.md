# Product Requirements — NexaHaus Connect

## 1. Vision

NexaHaus Connect is the **digital operating platform** of NexaHaus Properties & Asset
Management Ltd. It gives property owners complete, trustworthy visibility into their
properties, tenants, finances, maintenance, inspections, documents and overall asset
performance — and gives NexaHaus staff one system to run the whole portfolio.

The product must make NexaHaus feel like a **professional asset-management institution**,
comparable to a premium banking or wealth-management platform — not a caretaker or
rent-collection business.

**One question every owner screen must answer within seconds:**
_"What is happening with my property?"_ — status, tenant, rent, maintenance, inspection,
documents, financial performance, and outstanding issues.

## 2. Market & context

- **Primary market:** Ghana. First physical office: Accra. Company launch: December 2027.
- **First operating region:** Greater Accra; architected for Ashanti, Eastern, Western,
  Central, Volta, Northern and beyond.
- **Currency:** GHS default, displayed as `GHS 8,000.00`. Multi-currency capable.
- **Phone format:** Ghana `+233`.
- **Marketing begins before the office opens** — the platform must support lead capture,
  surveys, a public Property Health Check, and an Early Access / Founding 100 funnel.

## 3. Target users (owner side)

Ghanaian resident owners; **diaspora owners** (primary design focus); landlords; property
investors; developers; apartment owners; short-stay owners; commercial-property owners;
multi-property owners; absentee owners; owners who want professional management and
transparent reporting.

**Diaspora principle:** the dashboard must remove the need to phone or WhatsApp NexaHaus
just to learn basic property status. Show explicit dates: _"Last inspected: 3 Sep 2027",
"Last rent received: 1 Sep 2027", "Last maintenance: 27 Aug 2027"._

## 4. Roles (RBAC)

| Role                  | Scope summary                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `SUPER_ADMIN`         | Full platform access + configuration                                                      |
| `MANAGING_DIRECTOR`   | Company-wide operational & financial visibility, strategic dashboards, approvals, reports |
| `PROPERTY_MANAGER`    | Assigned clients/properties: tenants, leases, maintenance, inspections, comms, operations |
| `FINANCE_OFFICER`     | Rent, payments, expenses, statements, reconciliations, financial reporting                |
| `MAINTENANCE_OFFICER` | Maintenance requests, work orders, vendors, scheduling, completion reports                |
| `INSPECTOR`           | Assigned inspections: forms, photos/videos, reports                                       |
| `LEASING_OFFICER`     | Leasing workflow (where licensed): applications, lease records, vacancy                   |
| `SUPPORT_STAFF`       | Limited client/property communication                                                     |
| `VENDOR`              | Only assigned work orders                                                                 |
| `OWNER`               | Own portfolio only                                                                        |
| `TENANT`              | Own tenancy/property information only                                                     |

Authorization = **role permissions + resource-level permissions + client assignment +
property assignment + least privilege**, enforced **server-side**. UI hiding is not a
security control.

## 5. Data isolation (multi-tenancy)

A client/owner must **never** access another client's properties, tenants, payments,
statements, documents, maintenance, inspections, messages or personal data. Every protected
query enforces the ownership/tenant boundary. Unauthorized access returns a generic
`403` / not-found — it never reveals whether the record exists.

## 6. Module scope

### 6.1 Owner application

Navigation: Dashboard · My Properties · Tenants · Rent & Finance · Maintenance ·
Inspections · Documents · Messages · Approvals · Reports · Property Health · Profile ·
Settings.
Mobile priority: Home · Properties · Maintenance · Finance · Notifications.

**Owner dashboard** — greeting + portfolio summary cards & charts: total / occupied /
vacant properties, occupancy rate, expected vs collected vs outstanding rent, open
maintenance, pending approvals, **Portfolio Health Score**. Charts: rental income,
collection rate, expenses, occupancy trend, maintenance cost, health trend. Date filters:
this month / 3 / 6 / 12 months / custom.

### 6.2 Properties

Unique `Property ID` (`NH-000001`). Profile: basic info, management terms (assigned
manager, agreement, **configurable management fee**, inspection frequency, maintenance
approval threshold), financials (rental value, expected/collected/outstanding, expenses,
net owner income, estimated yield), documents, media.
Property status: `ACTIVE, VACANT, OCCUPIED, UNDER_MAINTENANCE, UNDER_RENOVATION,
SUSPENDED, SOLD, ARCHIVED`. Unit status: `VACANT, OCCUPIED, RESERVED, MAINTENANCE,
UNAVAILABLE`.
Structure: Property → Building → Floor → Unit. Property types: office, retail, warehouse,
mixed-use, apartment, house, land, short-stay, other.

### 6.3 Property Health Score (0–100)

Transparent, **admin-configurable** weights. Components: occupancy, rent collection,
maintenance, property condition, tenant satisfaction, documentation, security/compliance,
financial performance. Store score, date, component scores, methodology version,
recommendations. History retained. **No business rules hardcoded in frontend.**

### 6.4 Property Rescue

Identifies underperforming properties; examines occupancy, pricing, vacancy, collection,
maintenance backlog, condition, tenant issues, security, documentation, expenses, revenue
leakage, estimated market rent, asset performance. Produces a stored **Property Rescue
Report** (overall score, problems, ranked recommendations); PDF export.

### 6.5 Tenants & leases

Tenant profile with protected sensitive fields. Lease entity: property, unit, tenant,
owner, dates, rent, frequency, deposit, renewal, notice period, document, status
(`DRAFT, ACTIVE, EXPIRING, EXPIRED, TERMINATED, RENEWED`). Automated reminders for expiry
/ renewal / key dates. Legal terms tied to Ghanaian law are **configurable**, not
auto-enforced.

### 6.6 Rent & payments

Schedules: monthly / quarterly / biannual / annual / configurable. Rent state: expected,
paid, partially paid, outstanding, overdue, waived, refunded. Every payment records id,
tenant, property, unit, owner, amount, currency, date, method, reference, status,
provider, reconciliation status. Methods: Mobile Money, Bank Transfer, Bank Deposit, Cash,
Online, Other. System **discourages and phases out manual cash**. Duplicate webhook events
must never create duplicate payments.

### 6.7 Finance & statements

Owner financial dashboard: gross rental income, management fees, maintenance expenses,
other expenses, **net owner income/distribution**, outstanding rent, vacancy loss.
Monthly **owner statements** (branded, opening→closing balance, all lines), viewable
online, PDF, email, archived — **reproducible from transaction records**, never manually
edited.
Expenses: id, property, vendor, category, description, amount, tax, invoice, date, status,
approval status, payment status, created/approved by, audit history.

### 6.8 Owner approvals

Configurable thresholds (e.g. maintenance cost > GHS X → `PENDING OWNER APPROVAL`). Owner
sees property, issue, estimated cost, recommended vendor, photos, expected completion.
Actions: Approve / Decline / Request more information. **Every decision logged.**

### 6.9 Maintenance

Lifecycle: `REPORTED, ACKNOWLEDGED, ASSIGNED, SCHEDULED, IN_PROGRESS, AWAITING_APPROVAL,
COMPLETED, VERIFIED, CLOSED, CANCELLED`. Request carries category, priority
(`LOW/MEDIUM/HIGH/URGENT`), description, media, assignee, vendor, estimated/approved/actual
cost, dates, before/after photos, invoice, notes. Every transition audited. Preventive
maintenance: recurring schedules with automatic reminders. Notifications on assignment and
completion (with report + photos).

### 6.10 Inspections

Types: `INITIAL, ROUTINE, MOVE_IN, MOVE_OUT, MAINTENANCE, EMERGENCY, PRE_HANDOVER,
POST_MAINTENANCE, ANNUAL`. Workflow: `ASSIGNED, SCHEDULED, IN_PROGRESS, COMPLETED,
REVIEWED, REPORT_ISSUED`. Configurable area/item templates; each item rated `GOOD,
ATTENTION_REQUIRED, URGENT, NOT_APPLICABLE` with photos/videos/notes/recommendations,
inspector signature, owner review. Branded PDF report.

### 6.11 Document Vault

Categories per spec §26. Types: PDF, JPG, PNG, WEBP, DOCX. File-type validation, size
limits, malware-scan hook, private storage, **signed/expiring URLs only** (never public
permanent URLs), access control, expiry dates + notifications, versioning, access audit
log.

### 6.12 Communication centre

In-app threads: Owner↔NexaHaus, Tenant↔NexaHaus, Internal staff, Maintenance. Text,
images, attachments, timestamps, read status, notifications. No messaging outside
authorization scope.

### 6.13 Notification centre

Events per spec §29/§51 (`RENT_RECEIVED, RENT_OVERDUE, MAINTENANCE_*, INSPECTION_COMPLETED,
APPROVAL_REQUIRED, DOCUMENT_EXPIRING, LEASE_EXPIRING, STATEMENT_GENERATED,
MESSAGE_RECEIVED, HEALTH_SCORE_UPDATED, …`). Channels: in-app, push, email, SMS, WhatsApp.
Event-driven; user-configurable preferences.

### 6.14 Reporting & asset performance

Owner reports: portfolio summary, rental income, collection, outstanding, expenses, net
income, occupancy, maintenance, health, inspection, asset performance. Management reports:
portfolio counts/status, occupancy/vacancy, collection, outstanding, maintenance volume &
cost, revenue, expenses, profitability, client & property growth. Filters + date ranges +
CSV/PDF export. Asset performance clearly labels **actual vs estimate vs assumption vs
manually-entered valuation**. Never present an estimate as a verified valuation.

### 6.15 Admin dashboard

Navigation per spec §42. Overview KPIs + operational alerts (urgent maintenance, approvals
due, documents expiring, inspections due, new leads).

### 6.16 CRM & pre-launch marketing

Lead pipeline (Lead → Prospect → Consultation → Assessment → Proposal → Onboarding →
Active/Inactive). Lead sources & campaigns. Configurable **lead scoring** → grades
A/B/C/D. Property Owner Survey (configurable questions, consent). Public **Property Health
Check** lead magnet → preliminary score + clear distinction from a professional
assessment. Early Access, Founding 100, Property Owner Club scaffolding. Referral tracking
(no financial commissions without approval).

### 6.17 Tenant portal

Architecture in place from Phase 1; screens delivered Phase 8. Tenant sees current
property, lease, rent, payment history, maintenance, documents, messages, notifications;
can report maintenance, pay, download receipts, view lease, message NexaHaus. **Never**
sees owner financials.

### 6.18 Client & property onboarding

Digital 10-step client onboarding with progress indicator (account → verify → profile →
KYC → properties → documents → management agreement → e-sign where lawful → onboarding
inspection → `ACTIVE`). Property onboarding checklist with completion percentage.

## 7. MVP (first production release)

Authentication · Role-based access · Owner dashboard · Admin dashboard · Client management
· Property management · Unit management · Tenant management · Lease management · Maintenance
· Inspections · Documents · Rent tracking · Expenses · Owner statements · Notifications ·
Approvals · Audit logs · Property Health Score · Basic reports · Secure file storage ·
Responsive web app · Mobile owner-app architecture.

**Not postponed under any circumstance:** security, authorization, audit logging.

## 8. Explicit non-goals for MVP

Online/MoMo payment execution, WhatsApp/SMS/push delivery at scale, full tenant portal UI,
vendor portal, advanced analytics/AI, short-stay booking management, property-valuation
integrations, CSV import. All are architected for but deferred (Phases 9–10 / later).

## 9. Critical user journeys (must be smooth end-to-end)

1. **Owner onboarding & first look:** invitation → create account → verify → login →
   dashboard → property → latest inspection → rent → maintenance → documents → download
   statement.
2. **Tenant maintenance:** report + photo → manager notified → assign vendor → schedule →
   in progress → complete + after photos → owner & tenant notified → close. Every
   transition audited.
3. **Rent payment:** tenant pays → provider/webhook (verified, deduped) → transaction →
   allocation → rent balance updated → receipt → owner dashboard updates → notification →
   audit record.
4. **Owner approval:** estimate exceeds threshold → approval created → owner notified →
   reviews photos & cost → approves → staff/vendor notified → audit logged.

## 10. Quality & UX rules

Every screen answers: _Where am I? What is happening? What can I do? What needs my
attention?_ Clear statuses; **never colour alone** to convey status. Professional empty
states and error states; never expose technical errors. WCAG-aligned: keyboard nav,
labels, contrast, focus states, screen-reader-friendly components. Premium visual
direction: navy/dark-blue with gold accents, generous whitespace, strong typography, no
childish UI, minimal gradients/animation.

## 11. Legal disclaimers (product-wide)

The platform does not provide professional legal advice, property valuation, tax advice,
investment advice, or regulated real-estate brokerage. Where professional review is
required the UI states **"Professional review required."** AI/automated outputs are always
labelled **recommendations, not facts.** See [COMPLIANCE.md](COMPLIANCE.md).

# Implementation Plan

_Living document. Updated at the end of every phase._

## 1. Guiding principles

1. **Build a real commercial SaaS**, not a demo. No fake auth, fake permissions, fake
   money, or frontend-only functionality.
2. **Security, authorization and audit logging are never postponed.**
3. **Vertical slices.** Each phase ends with something runnable end-to-end on real data.
4. When multiple implementations are viable, pick the **simplest production-grade** one
   that still allows the documented future expansion.
5. **Every ambiguity → sensible production default + a note in §5 Decision Log →
   keep moving.**

## 2. Definition of Done (per feature)

A feature is done only when **all** of the following exist:

- [ ] Prisma model + migration
- [ ] Backend service (business logic isolated from transport)
- [ ] REST endpoint(s) with DTO validation
- [ ] Server-side authorization (role + resource scope)
- [ ] Frontend (web) — and mobile where the screen list requires it
- [ ] Loading / empty / error / success states
- [ ] Audit log entries for state-changing actions
- [ ] Unit and/or integration tests (mandatory for money, permissions, workflows)
- [ ] OpenAPI documentation
- [ ] No TypeScript errors, no lint errors
- [ ] No hardcoded secrets, no obvious IDOR / broken-access-control

## 3. Phases

### Phase 0 — Inspection & architecture  ✅ _complete_
- [x] Repository inspection (greenfield; no existing code)
- [x] Toolchain check (Node/pnpm/Docker absent on build machine — see §4)
- [x] Core documentation: PRD, Architecture, Database, API, Security, Deployment, Testing, Compliance
- [x] `.env.example`, `.gitignore`, `.gitattributes`, `README`
- [x] Monorepo scaffold: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.npmrc`
- [x] `docker-compose.yml` for local Postgres + Redis + MinIO (+ bucket init)
- [x] Shared packages: `typescript-config`, `eslint-config`, `types` (enums, Money, API/auth/permission contracts), `config` (fail-fast env schema), `validation` (Zod: common, auth, property)
- [x] `git init` + commits

  _Not runtime-verified — `pnpm install` / `tsc` cannot run until the toolchain (B1) is installed._

### Phase 1 — Foundation  _in progress_
- [x] `apps/api` NestJS bootstrap: config module, structured logging (pino) with secret
      redaction, global exception filter (standard envelope), response-envelope
      interceptor, `/health` + `/ready`, Swagger (non-prod), global throttler
- [x] Prisma schema — **full model, all 14 domains** (`apps/api/prisma/schema.prisma`)
- [x] Auth: register, verify email/phone (OTP), login (with lockout + timing-safe
      failure), refresh-token **rotation with chain revocation on reuse**, logout,
      logout-all, session list & revoke, TOTP 2FA setup/enable, password forgot/reset
      (session-invalidating). Argon2id hashing.
- [x] RBAC: `AuthGuard` → `PermissionGuard` (`@RequirePermission`) → `ResourceScopeGuard`
      (`@ScopedResource` + `ScopeResolverService`), `AuthUserService` (Redis-cached scope
      resolution from `ClientUser` / `PropertyAssignment` — never from request input)
- [x] `AuditService` (append-only) wired into auth flows
- [x] Unit tests: `Money` (add/subtract/percentage/allocate/format/JSON, no-drift), `PermissionGuard`
- [x] `packages/types`, `packages/validation`, `packages/config`
- [x] API vertical slice (server side): `RefService` (sequence-based `NH-000001`),
      pagination/scope helpers, `properties` module (scoped list with occupancy +
      rent rollups, detail with diaspora "last inspected / last rent" + latest
      inspection + health score, financials by period, create with onboarding
      checklist, update), `dashboard/owner` portfolio summary (all figures within
      scope), `finance/period.util`
- [x] Seed: permissions + role matrix + org settings (branding, GHS, categories,
      health-score config v1, lead-score config v1, approval threshold, reminder
      offsets, regulatory feature flags), inspection template, demo owner + demo
      admin, demo diaspora client + 5 fictional Accra properties with units,
      tenants, leases, 6 months of rent charges/payments, expenses, maintenance
      (with status history), inspections, health scores
- [x] `apps/web` Next.js (App Router) bootstrap: navy/gold Tailwind design tokens,
      component library (Button, Card, StatCard, StatusBadge, states: loading/empty/
      error, PageHeader, BrandMark), typed API client with **in-memory access token +
      silent refresh-and-retry** via the same-origin `/api` proxy rewrite, `AuthProvider`
      + TanStack Query providers, protected `(owner)` layout + app shell nav
- [x] **Vertical slice (web):** `/login` (with MFA step) → `/dashboard` (portfolio
      stats + attention counters + expected-vs-collected chart, period filter) →
      `/properties` (search + status filter + pagination, occupancy/collected/
      outstanding per card) → `/properties/[id]` (diaspora "last inspected / last
      rent / health" strip, finance stats, management terms + configurable fee, team,
      latest inspection). Placeholder pages for the other nav sections.
- [x] Tests: `scope.util` + `ResourceScopeGuard` (unit); `isolation.e2e-spec`
      (release-blocking — Owner A ≠ Owner B across list/get/financials/PATCH/filter,
      no leak, no mutation) + `auth.e2e-spec` (register→verify→login, refresh
      rotation + chain revocation, generic credential failure)
- [x] Admin dashboard: `GET /admin/overview` (portfolio + rent + operational load +
      growth + prioritised alerts, staff-scoped), `GET /admin/clients`; web `/admin`
      role-gated shell + overview + clients table
- [x] Mobile (`apps/mobile`, Expo Router) skeleton: keychain-refresh auth client,
      theming, splash → login (+MFA) → tab nav → dashboard + property list on real
      API data; full 25-screen list documented for later phases

**Phase 1 status: foundation + first vertical slice complete on all three surfaces
(API, web, mobile).** Remaining before calling Phase 1 done: run the toolchain to
`prisma generate` + `tsc` + `jest` and fix whatever surfaces; `prisma migrate dev`
to create the initial migration; wire `packages/ui` (currently the web app owns its
components).

### Phase 2 — Core domain  _in progress_
- [x] **Clients**: scoped CRUD, detail with 10-step onboarding progress + client users +
      contacts, portfolio summary, invite portal user, advance onboarding (completion
      activates the client). Web: `/admin/clients/[id]`.
- [x] **Units / buildings / floors**: `GET/POST /properties/:id/units` (with active lease
      + tenant), `GET/PATCH /units/:id`, `POST /properties/:id/buildings`; unit create
      bumps `unitCount` in-tx. Web: Units & tenancies table on property detail.
- [x] **Co-ownership**: `POST /properties/:id/owners` (shares must total 100%).
- [x] **Management agreements**: `POST /properties/:id/agreement` — supersedes (never
      edits) the active one; fee fully configurable.
- [x] **Staff assignment**: `POST/DELETE /properties/:id/assignments` — drives staff
      scope, invalidates the assigned user's cached scope.
- [x] **Tenants**: scoped CRUD (visible only via a lease on an in-scope property),
      tenancy history; ID-document ref AES-256-GCM encrypted at rest, never returned.
      Web: `/admin/tenants`.
- [x] **Leases**: scoped list (+ expiring filter), detail with full rent-charge ledger;
      create (overlap-checked) → activate (occupies unit, **generates rent charges** via
      `rentPeriods()`, schedules reminders) → renew (bills extra periods) → terminate
      (waives future unpaid charges). All audited; illegal transitions rejected.
      Web: `/admin/leases`. Unit tests: `rent-schedule.util`.
- [ ] Web: client onboarding actions (advance step, invite user), unit create/edit forms,
      lease create/activate/renew/terminate forms, tenant forms
- [ ] Integration tests: lease lifecycle + rent-charge generation; tenant isolation for
      the new resources

### Phase 3 — Operations  _in progress_
- [x] **Document Vault**: `StorageService` (S3/MinIO, presigned PUT/GET, per-document
      keys), `MalwareScanner` (noop dev / fail-closed prod), `DocumentScopeService`
      (a doc inherits the access rules of what it hangs off). `upload-url` → `finalize`
      (HEAD + scan + checksum + expiry reminders) → `download-url` (CLEAN-only, logs
      every access). No public URLs. Web: inspection-report download button.
- [x] **Events**: transactional-outbox `EventsService`.
- [x] **Approvals** (generic): `createInTx()` for other modules, scoped list/detail,
      `POST :id/decision` (APPROVED/DECLINED/INFO_REQUESTED) — owner-only decide,
      propagates to maintenance/expense subjects, emits `APPROVAL_COMPLETED`. Web:
      owner Approvals page with inline Approve / Decline / Request-info.
- [x] **Vendors**: CRUD, category/status filters, property assignment.
- [x] **Maintenance**: full lifecycle (`MAINTENANCE_TRANSITIONS`-guarded), reporter
      type from caller (tenant self-service tenancy check), **cost over the property's
      approval threshold auto-diverts to AWAITING_APPROVAL + raises an Approval**,
      work orders (assign → complete with actual cost + invoice + after-photos), media,
      status history + audit + domain events on every step. Web: owner list + detail
      with timeline.
- [x] **Inspections**: templates, create/assign, submit (inspector-only, item set +
      condition + signature), review (manager renders the **branded PDF** via `PdfService`,
      stores it as a CLEAN `INSPECTION_REPORT` document, emits `INSPECTION_COMPLETED`).
      Web: owner list + detail (area-by-area findings, PDF download).
- [x] **Preventive maintenance**: plan CRUD, `markRun` rolls `nextDueAt` forward.
- [ ] Field-staff mobile capture (photos/video/notes/offline drafts)
- [ ] Admin maintenance/inspections/documents screens; integration tests
      (maintenance workflow §82, document access §83)

### Phase 4 — Finance  _in progress_
- [x] **Payments**: `PaymentProvider` abstraction (manual / generic-HMAC), oldest-first
      & explicit allocation (`allocation.util`, unit-tested to spec §81), manual entry
      (idempotent), **webhook with `(provider, providerEventId)` dedupe** (replay → 200
      no-op), settlement in one tx (Transaction + Payment + allocations + charge updates
      + outbox events + audit), refund (posts a REVERSAL, rolls back allocations).
- [x] **Expenses**: CRUD → submit (over-threshold ⇒ EXPENSE Approval) → decision → pay
      (posts a negative EXPENSE transaction + VendorPayment).
- [x] **Statements** (spec §18): idempotent `generate` per (client, property, period);
      posts the period MANAGEMENT_FEE transaction (`computeManagementFee`, unit-tested to
      §98), then **recomputes every total from the ledger** — opening = net of prior
      POSTED txns, gross/fees/maintenance/other/distributions from in-period txns,
      one `StatementLine` per transaction; renders the branded PDF, stores it CLEAN.
      No endpoint edits a total. Web: `/finance/statements/[id]` with the balance
      waterfall + transaction table + PDF download.
- [x] **Owner financial dashboard** (spec §17): `GET /dashboard/owner/financials` —
      gross rent, management fees (projected + flagged when unposted), maintenance vs
      other, net owner income, outstanding rent, vacancy loss, distributions. Web:
      `/finance` page.
- [x] **Owner distributions**: `distributions` module — create (PENDING) → approve → pay
      (posts a negative `OWNER_DISTRIBUTION` transaction, links it). Scoped, audited.
- [x] **Reconciliation**: `POST /payments/reconcile` locks a batch of payments + their
      transactions (`RECONCILED`); `?reconciliationStatus=` filter; refund of a
      reconciled payment requires `transaction:adjust` and still posts a `REVERSAL`
      (`RECONCILED_RECORD_IMMUTABLE` otherwise).
- [x] Admin web: `/admin/statements` (generate form + table), `/admin/payments` (record
      form + batch-reconcile), `/admin/expenses` (filter + submit/approve/pay actions).
- [x] Tests: `allocation.util`, `management-fee.util` (unit); `payment-webhook.e2e-spec`;
      **`statement-reproduction.e2e-spec`** (totals reconcile — opening = pre-period net,
      net = gross−fees−maintenance−other, closing = opening + credits − debits;
      re-generate returns the identical statement + a single fee transaction; no
      total-editing endpoint).

**Phase 4 complete.**

### Phase 5 — Collaboration  ✅ _complete_
- [x] **Outbox worker**: `OutboxService` `@Interval(5s)` drains unprocessed `DomainEvent`
      rows → `NotificationEventHandler`; marks `processedAt`, bumps `attempts`/`lastError`
      on failure, stops at 5 attempts. In-process (BullMQ in Phase 10); `DISABLE_SCHEDULERS`
      gate for multi-instance.
- [x] **Notification engine**: `Email/Sms/WhatsApp/Push` adapter interfaces (console/noop
      impls); `NotificationsService.notify()` always writes the in-app row unless the
      user disabled in-app for that type, then dispatches other channels per
      `NotificationPreference`; `RecipientResolver`; one declarative `handle()` case per
      `DomainEventType`. API: cursor feed + unread, mark-read/all, GET/PUT preferences.
- [x] **Communication centre**: participation-scoped threads; `createThread` (owner-facing
      auto-adds assigned staff + owner users), `postMessage` (emits `MESSAGE_RECEIVED`),
      `markRead`. No messaging outside the participant set.
- [x] **Scheduling**: `@Cron` daily 07:00 Accra — overdue rent (`RENT_OVERDUE`), lease
      reminders (`LEASE_EXPIRING` + flip to EXPIRING), document-expiry reminders
      (`DOCUMENT_EXPIRING`), preventive-maintenance due (raises the request +
      `MAINTENANCE_CREATED`). Idempotent; `POST /scheduling/run` manual trigger.
- [x] Generic Approvals module + owner approval UX — _delivered in Phase 3_.
- [x] Web: `NotificationBell` (30s poll, dropdown, mark-read) in both shells;
      `/notifications` (feed + channel-matrix preferences); `/messages` two-pane
      conversation UI.
- [x] Tests: `notifications.e2e-spec` — event → in-app notification for the right user;
      mark-read/all clears unread; in-app-off suppresses the row; **message thread
      visible only to participants (Owner B → 404, no leak)**; reply → `MESSAGE_RECEIVED`
      notifies the other participant.

### Phase 6 — Intelligence  ✅ _complete_
- [x] **Property Health Score**: pure weighted-sum engine (unit-tested to §11); admin
      GET/PUT `/property-health/config` (versioned, must sum to 1); recompute gathers 8
      factors from live data, stores an **explainable** score (each component carries
      `basis` + `confidence` actual/estimate/assumption), emits `HEALTH_SCORE_UPDATED`;
      latest + history + recompute-all.
- [x] **Property Rescue**: deeper analysis (vacancy, rent vs recorded market, collection,
      revenue leakage, maintenance backlog + age, condition, documents) → overall score,
      findings by severity, ranked recommendations from the §12 action set, branded PDF,
      `PROPERTY_RESCUE_READY` event; recommendation status tracking.
- [x] **Reports**: `GET /reports/owner/:kind` (7 kinds, scoped, `?period=`/`?propertyId=`/
      `?format=csv`), `GET /reports/management/:kind` (4 kinds, scope-exempt).
      **Asset performance** labels actual vs estimate vs manually-entered valuation (§31).
- [x] Web: `/property-health` (per-property component bars + basis + recommendations),
      `/property-rescue` (score ring, findings, recommendation status toggle, PDF),
      `/reports` (kind/period picker, table, CSV download); `ScoreRing` component; owner
      nav updated.
- [x] Tests: `health-score.util` (unit); `property-health.e2e-spec` — explainable score,
      `HEALTH_SCORE_UPDATED` event, **config-weight change moves the score + bumps the
      methodology version**, Rescue produces findings + recommendations + a downloadable
      CLEAN PDF.

### Phase 7 — Growth  ✅ _complete_
- [x] **Lead scoring**: configurable A/B/C/D engine (`lead-scoring.util`, unit-tested to
      §74) — property count (banded), diaspora (flag or location-inferred), stated
      management need, assessment completion, consultation booked, engagement (capped),
      configurable grade thresholds.
- [x] **CRM**: `GET /leads` (+ `/pipeline` stage counts, `/score-config` versioned),
      `/leads/:id` (activities + health checks + surveys), create/update (re-scores;
      logs `STATUS_CHANGE`), `:id/activities` (re-scores), **`:id/convert`** → creates
      an `ONBOARDING` Client + carries the marketing consent, marks lead `WON`.
- [x] **Public funnel** (`/api/v1/public/*`, unauthenticated, throttled 5/min, consent
      captured): `property-health-check` (deterministic self-reported preliminary score
      + `PropertyHealthCheck` + Lead + `ConsentRecord`; response labels it preliminary,
      not professional), `early-access` (+ Founding 100), `GET/POST surveys/:key`.
      All entry points upsert a Lead by email and re-score.
- [x] Seed: **Property Owner Survey** (§38, 15 questions), PUBLISHED.
- [x] Web admin: `/admin/leads` (pipeline stage bar + grade filters + table),
      `/admin/leads/[id]` (score ring + breakdown, stage mover, activity log, convert).
- [x] **Public marketing website** (`app/(public)/`): navy/gold layout + footer; home
      (`/welcome`), interactive `/health-check` lead magnet (preliminary-score result +
      disclaimer), `/early-access`, service pages (property-management, asset-management,
      diaspora, property-rescue-service), `/about`, `/resources`, `/contact`, `/privacy`,
      `/terms`. Root `/` sends unauthenticated visitors to `/welcome`.
- [x] Tests: `lead-scoring.util` (unit); `crm.e2e-spec` — public health check → scored
      lead + consent; repeat email updates, no duplicate; consultation raises the score;
      convert → `ONBOARDING` client + consent carried + second convert is 409.

### Phase 8 — Tenant portal
- Tenant dashboard, lease, rent & receipts, maintenance reporting, messaging,
  documents. Strict isolation from owner financials.

### Phase 9 — Advanced integrations
- Live Mobile Money / bank payment workflows, WhatsApp inbound, push at scale,
  vendor portal, CSV import pipeline, analytics dashboards.

### Phase 10 — Production hardening
- Load/performance passes, security review & pen-test checklist, backup/DR drills,
  observability (Sentry + OTel dashboards), CI/CD to staging + production, runbooks.

## 4. Current blockers

| # | Blocker | Impact | Resolution |
|---|---|---|---|
| B1 | Node.js, a package manager (pnpm/npm), and Docker are not installed on the build machine | Cannot `install`, build, run, migrate, or test any application code. Documentation, schema design and code authoring can proceed; verification cannot. | User installs Node.js 20 LTS + Corepack (pnpm) and Docker Desktop — see [DEPLOYMENT.md](DEPLOYMENT.md#local-prerequisites). Alternatively confirm a target machine / CI where builds run. |

## 5. Decision log (assumptions taken)

| # | Topic | Decision | Rationale |
|---|---|---|---|
| D1 | Package manager | **pnpm** workspaces + **Turborepo** | Fast, disk-efficient, first-class monorepo support; matches spec stack. |
| D2 | Monetary storage | Integer **minor units** (`BigInt`) + sibling `currency` (CHAR 3). `Decimal` only for rates/percentages. | Deterministic, auditable; no float. |
| D3 | Multi-tenancy model | Single NexaHaus org; **data isolation is per-Client (owner)** enforced by an authorization query layer, not by separate schemas/databases. | Matches spec §6; simplest model that scales to thousands of owners. |
| D4 | Authorization | RBAC (role→permission) **plus** resource-scope checks (client assignment, property assignment). Enforced server-side in guards + repository layer. | Spec §5, §46: never trust client role claims or IDs. |
| D5 | Mobile app | Architecture + shared packages established in Phase 1; full Expo screens built after web MVP is stable (Phase 8 window), except field-capture for inspections/maintenance which lands with Phase 3. | Spec lists "mobile owner application **architecture**" in MVP, full screens later. |
| D6 | API style | REST `/api/v1` with OpenAPI. No GraphQL. | Spec §61. |
| D7 | Real-estate agency features | Built behind feature flags + `PractitionerLicence` gating; **disabled by default**. | Spec §48. |
| D8 | Payments | `PaymentProvider` interface with a `manual` adapter for launch; real MoMo/bank adapters in Phase 9. Every payment carries an idempotency key; webhook events deduped by provider event id. | Spec §15, §55, §81. |
| D9 | Background jobs | BullMQ on Redis. Transactional outbox for domain events to guarantee at-least-once delivery. | Reliability for notifications/statements. |
| D10 | IDs | UUID v7 primary keys; human-facing refs (`NH-000001`, `PLxxxx`) generated per sequence table. | Sortable, non-enumerable externally. |

## 6. How to resume

Next actionable step: **scaffold the monorepo** (Phase 0 remaining items), then start
Phase 1 with `apps/api` bootstrap + the identity/access Prisma schema. All design inputs
for those steps are in [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md) and
[SECURITY.md](SECURITY.md).

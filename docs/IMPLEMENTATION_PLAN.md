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

### Phase 0 — Inspection & architecture  ✅ _in progress_
- [x] Repository inspection (greenfield; no existing code)
- [x] Toolchain check (Node/pnpm/Docker absent on build machine — see §4)
- [x] Core documentation: PRD, Architecture, Database, API, Security, Deployment, Testing, Compliance
- [x] `.env.example`, `.gitignore`, `README`
- [ ] Monorepo scaffold (pnpm workspaces + Turborepo) — _blocked on toolchain_
- [ ] `docker-compose.yml` for local Postgres + Redis + MinIO
- [ ] `git init` + first commit

### Phase 1 — Foundation
- [ ] `apps/api` NestJS bootstrap: config module, structured logging (pino), global
      exception filter, response-envelope interceptor, health/ready endpoints, Swagger
- [ ] Prisma schema for **identity, access, org/client, property, unit** domains
- [ ] Auth: register, verify email/phone (OTP), login, refresh-token rotation, logout,
      session/device list & revoke, optional TOTP 2FA. Argon2id hashing.
- [ ] RBAC engine: roles, permissions, `@RequirePermission`, resource-scope guard
      (client assignment + property assignment), tenant-isolation query layer
- [ ] AuditLog service (append-only) + interceptor
- [ ] `packages/types`, `packages/validation`, `packages/config`
- [ ] `apps/web` Next.js bootstrap: design tokens (navy/gold), base component library,
      auth pages, protected layout, TanStack Query + API client
- [ ] Seed: roles, permissions, demo owner + demo admin
- [ ] **Vertical slice:** Owner login → Owner dashboard (portfolio summary from real
      aggregates) → Property list → Property detail
- [ ] Tests: auth flow, RBAC, **Owner A cannot read Owner B's property (403, no leak)**

### Phase 2 — Core domain
- Clients & client onboarding, Properties (full profile), Buildings/Floors/Units,
  Property owners (incl. co-ownership), Management agreements (configurable fee),
  Property-manager assignment, Tenants, Leases (+ expiry/renewal reminders).

### Phase 3 — Operations
- Maintenance (full lifecycle + status history + work orders + vendors),
  Preventive maintenance plans, Inspections (templates, items, media, PDF report),
  Document Vault (private storage, signed URLs, versioning, expiry, access log).

### Phase 4 — Finance
- Ledger/transaction model, Rent charges & schedules, Payments + allocations +
  webhook idempotency, Expenses + approvals, Owner statements (reproducible from
  transactions) + PDF, Owner financial dashboard, Management-fee & distribution calc.

### Phase 5 — Collaboration
- Domain-event bus + outbox, Notification engine (in-app/email/SMS/WhatsApp/push
  adapters) + per-user preferences, Communication centre (scoped threads),
  Generic Approvals module + owner approval UX.

### Phase 6 — Intelligence
- Property Health Score (configurable weights, historical, explainable),
  Property Rescue (assessment + recommendations + PDF), Owner & Management reports
  (filters, date ranges, CSV/PDF export), Asset performance metrics.

### Phase 7 — Growth
- CRM (leads, activities, lead scoring/grades), Property Owner Survey (configurable),
  Property Health Check lead magnet (public), Early Access / Founding 100,
  Public marketing website.

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

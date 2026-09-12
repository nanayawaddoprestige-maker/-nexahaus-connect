# Architecture

## 1. Overview

NexaHaus Connect is a **monorepo** containing a REST API, a web application, a mobile
application, and shared packages. One PostgreSQL database is the system of record. Redis
provides caching and a durable job queue. An S3-compatible store holds all binary
documents and media.

```
                    ┌─────────────┐     ┌──────────────┐
 Owner / Admin ────▶ │  apps/web   │     │ apps/mobile  │ ◀── Owner / Field staff
 (browser)          │  Next.js    │     │  Expo/RN     │
                    └──────┬──────┘     └──────┬───────┘
                           │  HTTPS (JWT access token)  │
                           └───────────┬───────────────┘
                                       ▼
                             ┌───────────────────┐
                             │     apps/api      │  NestJS
                             │  REST /api/v1     │
                             │  ├ HTTP layer     │  guards, interceptors, filters
                             │  ├ Domain modules │  services (business logic)
                             │  ├ Prisma layer   │  tenant-scoped repositories
                             │  ├ Event bus      │  transactional outbox
                             │  └ Worker         │  BullMQ consumers
                             └───┬─────┬─────┬───┘
                                 │     │     │
                    ┌────────────┘     │     └─────────────┐
                    ▼                  ▼                    ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
            │ PostgreSQL   │   │    Redis     │   │ S3-compatible    │
            │ (Prisma)     │   │ cache + jobs │   │ object storage   │
            └──────────────┘   └──────────────┘   └──────────────────┘

  Outbound adapters (interfaces, swappable): Email · SMS · WhatsApp · Push ·
  Payments · Analytics · Malware scan
```

## 2. Technology stack

| Layer         | Choice                                           | Notes                                                                  |
| ------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Monorepo      | pnpm workspaces + Turborepo                      | Task graph, caching, `--filter`                                        |
| Language      | TypeScript (strict) everywhere                   | Shared `packages/typescript-config`                                    |
| API           | NestJS                                           | Modular DI, guards/interceptors/pipes, `@nestjs/swagger`               |
| ORM           | Prisma + PostgreSQL 16                           | Migrations, type-safe client                                           |
| Validation    | Zod (shared) + `nestjs-zod` DTOs                 | One schema, client + server                                            |
| Web           | Next.js (App Router), React, Tailwind, shadcn/ui | TanStack Query for server state, React Hook Form + Zod                 |
| Charts        | Recharts                                         | Dashboard visualisations                                               |
| Mobile        | Expo, React Native, Expo Router                  | Shares `types`, `validation`, API client                               |
| Auth          | Argon2id + JWT access/refresh with rotation      | `packages/config` holds tunables                                       |
| Cache / queue | Redis + BullMQ                                   | Jobs: notifications, statements, reminders, health scoring, PDF render |
| Storage       | S3-compatible (MinIO locally)                    | Private buckets, presigned URLs                                        |
| Logging       | pino (structured JSON)                           | Request id correlation                                                 |
| Monitoring    | Sentry + OpenTelemetry (OTLP)                    | DSN/endpoint via env                                                   |
| Containers    | Docker + docker compose                          | `web`, `api`, `worker`, `postgres`, `redis`, `minio`                   |

## 3. Monorepo layout

```
apps/
  api/     NestJS. src/modules/<domain>/{controller,service,dto,*.spec}. prisma/schema.prisma.
  web/     Next.js. app/(owner)/…, app/(admin)/…, app/(public)/…, components/, lib/api/.
  mobile/  Expo. app/ (Expo Router), src/, shared API client.
packages/
  types/              Domain entities + DTO types + enums. No runtime deps.
  validation/         Zod schemas (auth, property, payment, …). Consumed by api + web + mobile.
  ui/                 Design tokens + framework-agnostic-ish React primitives for web.
  config/             loadConfig() + Zod env schema. Fails fast on missing/invalid vars.
  eslint-config/      Shared flat config.
  typescript-config/  base.json, nextjs.json, react-library.json, nestjs.json.
```

Dependency rule: `apps/*` may depend on `packages/*`; `packages/*` never depend on
`apps/*`; `packages/types` depends on nothing.

## 4. Request lifecycle (API)

1. **Helmet + CORS + rate limiter** (per-IP; stricter bucket for `/auth`).
2. **Request-context middleware** — assigns request id, starts pino child logger.
3. **AuthGuard** — verifies JWT access token, loads `AuthUser { userId, roles[],
permissions[], clientIds[], assignedPropertyIds[] }` (permissions/scope cached in Redis,
   short TTL, invalidated on role change).
4. **PermissionGuard** — checks `@RequirePermission('property:read')`.
5. **ResourceScopeGuard** — for routes acting on a specific resource, confirms the resource
   falls within the caller's `clientIds` / `assignedPropertyIds`. Owners are scoped to
   owned clients; staff to assignments; `SUPER_ADMIN`/`MANAGING_DIRECTOR` bypass scope but
   are still audited.
6. **ZodValidationPipe** — validates params/query/body against the shared schema.
7. **Controller → Service** — business logic; **all DB access via tenant-scoped
   repositories** that re-apply the ownership filter as defence in depth.
8. **ResponseInterceptor** — wraps payload in the standard envelope.
9. **AuditInterceptor** — for mutating verbs, writes an `AuditLog` row (actor, action,
   resource, before/after, ip, ua, session) inside the same transaction where feasible.
10. **AllExceptionsFilter** — maps errors to the standard error envelope; never leaks
    stack traces, SQL, or infra details.

## 5. Cross-cutting concerns

### 5.1 Authorization & multi-tenant isolation

See [SECURITY.md](SECURITY.md). Two enforced layers:

- **Guard layer** — coarse (authenticated? has permission? resource in scope?).
- **Repository layer** — every owner-facing model access goes through
  `ScopedRepository<T>` which injects `WHERE clientId IN (:scope)` (or a property/lease
  join equivalent). A raw `prisma.<model>.findMany()` without scope in an owner-facing path
  is a lint/review failure.

### 5.2 Money

- Stored as integer **minor units** (`BigInt`, e.g. pesewas) plus a `currency` `CHAR(3)`.
- A `Money` value object (`packages/types`) provides add/subtract/allocate/percentage with
  banker's-rounding rules; **no floating point**.
- Percentages/rates use Prisma `Decimal`.
- All multi-write financial operations run in a Prisma `$transaction`.
- Post-reconciliation records are **immutable**; corrections are new adjustment/reversal
  transactions that reference the original.

### 5.3 Domain events (transactional outbox)

State changes append a `DomainEvent` row **in the same transaction** as the business write.
A worker polls the outbox and publishes to BullMQ. Consumers are **idempotent** (keyed by
event id). This powers notifications, statement regeneration, health-score recompute,
reminder scheduling, and analytics — without coupling modules.

Event names: `RENT_RECEIVED, RENT_OVERDUE, MAINTENANCE_CREATED, MAINTENANCE_ASSIGNED,
MAINTENANCE_COMPLETED, INSPECTION_COMPLETED, APPROVAL_REQUIRED, APPROVAL_COMPLETED,
DOCUMENT_EXPIRING, LEASE_EXPIRING, STATEMENT_GENERATED, MESSAGE_RECEIVED,
HEALTH_SCORE_UPDATED, PAYMENT_RECEIVED, PROPERTY_RESCUE_READY`.

### 5.4 Storage

- All binaries in S3-compatible storage under keys like
  `client/<clientId>/property/<propertyId>/<documentId>/<versionId>`.
- **No public URLs.** Downloads are short-lived presigned URLs (TTL from
  `STORAGE_SIGNED_URL_TTL`) issued only after an authorization + access-log check.
- Uploads: presigned `PUT`, then a finalize call that records checksum, size, mime, and
  enqueues a malware scan (`MalwareScanner` interface; `noop` adapter until a provider is
  configured). Documents stay `PENDING_SCAN` and are undownloadable until `CLEAN`.
- Versioning via `DocumentVersion`; deletes are soft (`deletedAt`) except where retention
  policy permits hard deletion.

### 5.5 Notification engine

`NotificationChannel` interface with adapters: `EmailAdapter`, `SmsAdapter`,
`WhatsAppAdapter`, `PushAdapter`. A `NotificationService` consumes domain events, resolves
recipients + their `NotificationPreference`, renders templates, and dispatches per enabled
channel. In-app notifications are always written. Console adapters in development.

### 5.6 Payments abstraction

`PaymentProvider` interface: `initiate()`, `verifyWebhook(signature, rawBody)`,
`parseEvent()`. Adapters registered by `PAYMENT_PROVIDER`. Launch adapter: `manual`
(finance officer records a received payment with reference + evidence). Webhook endpoint
verifies signature, dedupes on `provider + providerEventId`
(`PaymentProviderWebhookEvent` unique), then creates the payment + allocation +
transaction + `PAYMENT_RECEIVED` event in one DB transaction. Replays are no-ops.

### 5.7 Configuration

`packages/config` parses `process.env` against a Zod schema at boot and **fails fast**.
Business configuration (health-score weights, approval thresholds, maintenance/expense
categories, property types, inspection templates, lease-reminder offsets, fee defaults)
lives in `OrganizationSetting` / `SystemSetting` tables and is editable by `SUPER_ADMIN` —
never hardcoded in components or services.

### 5.8 Caching & jobs

Redis caches permission/scope resolution and expensive dashboard aggregates (short TTL,
event-invalidated). BullMQ queues: `notifications`, `documents` (PDF render, scan),
`finance` (statement generation, distributions), `scheduling` (lease/inspection/document
reminders, preventive maintenance), `scoring` (health score, rescue).

### 5.9 Error model

Standard envelope (see [API.md](API.md)). Error `code` is a stable machine string
(`PROPERTY_NOT_FOUND`, `FORBIDDEN`, `VALIDATION_FAILED`, …). 4xx carries a safe message;
5xx carries a generic message + a correlation id logged server-side.

### 5.10 Observability

Structured logs with request id + user id (never secrets/PII beyond ids). `/health`
(liveness) and `/ready` (checks Postgres + Redis + storage). Sentry for exceptions; OTel
traces for API + worker when an endpoint is configured.

## 6. Environments

`development` (docker compose) · `staging` (production-like, seedable) · `production`.
Config differs only by environment variables. See [DEPLOYMENT.md](DEPLOYMENT.md).

## 7. Architectural decision records

Key decisions are logged in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#5-decision-log-assumptions-taken).
Material future changes get an ADR entry there with date, context, decision, consequences.

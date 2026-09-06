# Security review & pen-test checklist (release gate)

Expands [SECURITY.md §9](SECURITY.md#9-security-testing-checklist-release-gate) into a
gate with **evidence**. Every item names where it is enforced and the automated test that
proves it. A release ships only when every row is ✅ or has a signed-off, time-boxed
risk acceptance.

Legend: **Code** = where enforced · **Test** = automated proof · **Manual** = pen-test
step performed each release.

---

## 1. Authentication

| # | Check | Code | Test |
|---|---|---|---|
| 1.1 | Passwords Argon2id, OWASP params, no bcrypt fallback | `modules/auth/password.service.ts` (`config.auth.argon2`) | `auth/password.service.spec.ts` |
| 1.2 | Access token short-lived, signed, `jti`+`sessionId` claims | `modules/auth/token.service.ts` | `auth.e2e-spec.ts` "rejects expired / tampered token" |
| 1.3 | Refresh token stored hashed; **rotation on every use** | `token.service.ts` `rotate()` | `auth.e2e-spec.ts` "refresh rotates" |
| 1.4 | Replayed refresh token revokes the whole session chain | `token.service.ts` `rotatedFromId` walk | `auth.e2e-spec.ts` "reused refresh token kills chain" |
| 1.5 | Account lockout (`failedLoginCount` / `lockedUntil`), exponential | `auth.service.ts` `registerFailedLogin()` | `auth.service.spec.ts` |
| 1.6 | No user enumeration — identical response + timing for unknown user / bad password | `auth.service.ts` `login()` | `auth.e2e-spec.ts` "no enumeration" |
| 1.7 | Stricter rate bucket on every `/auth/*` route | `app.module.ts` `ThrottlerModule` `auth` bucket + `@Throttle({auth:{}})` on `AuthController` | `auth.e2e-spec.ts` "429 after AUTH_RATE_LIMIT_MAX" |
| 1.8 | Password reset: single-use hashed token, TTL, invalidates sessions | `auth.service.ts` `resetPassword()` | `auth.e2e-spec.ts` "reset invalidates sessions" |
| 1.9 | MFA (TOTP) enforced at login when enabled; secret stored encrypted | `auth.service.ts`, `crypto.util.ts` | `auth.e2e-spec.ts` "mfa gate" |

## 2. Authorization & multi-tenant isolation

| # | Check | Code | Test |
|---|---|---|---|
| 2.1 | Guard order: Throttler → Auth → Permission → ResourceScope | `app.module.ts` `APP_GUARD` providers | `authz/*.guard.spec.ts` |
| 2.2 | Every mutating route declares `@RequirePermission` (or documents why the service enforces) | `modules/**/**.controller.ts` | `authz/permission-coverage.spec.ts` (route scan) |
| 2.3 | Scope resolved **server-side only** — never from the request body/query | `modules/authz/scope-resolver.service.ts`, `common/scope.util.ts` | `authz/resource-scope.guard.spec.ts` |
| 2.4 | IDOR: owner A cannot read/act on owner B's property, lease, payment, document, statement | scope guard + `ScopedRepository` | **`isolation.e2e-spec.ts`** (release-blocking) |
| 2.5 | Tenant portal never exposes an owner-level figure (mgmt fee, net owner income, other tenants/units) | `modules/tenant-portal/*` projections | **`tenant-portal.e2e-spec.ts`** |
| 2.6 | Vendor portal bound to `user.vendorId`; cannot see another vendor's work order or any owner/admin route | `modules/vendor-portal/*` | **`vendor-portal.e2e-spec.ts`** |
| 2.7 | Privilege escalation: `role`, `clientId`, `assignedPropertyIds`, `scope` in a body are ignored | DTOs omit them; guard recomputes | `authz/resource-scope.guard.spec.ts` "body scope ignored" |
| 2.8 | Not-found vs forbidden: cross-tenant probe returns a generic 403/404 with no existence leak | `scope.util.ts` `denyGeneric()` | isolation + portal specs assert body has no leaked ref/field |
| 2.9 | `SUPER_ADMIN` / `MANAGING_DIRECTOR` scope-exempt but fully audited | scope guard early-return + `AuditInterceptor` | `authz/resource-scope.guard.spec.ts` |

## 3. Objects, files & data exposure

| # | Check | Code | Test |
|---|---|---|---|
| 3.1 | Presigned URLs short-lived (`STORAGE_SIGNED_URL_TTL`), minted only after a scope check | `modules/storage/storage.service.ts`, `modules/documents/documents.service.ts` | `property-health.e2e-spec.ts` "download-url", document specs |
| 3.2 | Cross-tenant document download denied; expired URL rejected by storage | scope check before mint | `isolation.e2e-spec.ts` document case |
| 3.3 | Upload: content-type allowlist, size cap, malware scan hook before a doc is `CLEAN` | `storage.service.ts`, `MALWARE_SCAN_PROVIDER` | `documents` specs |
| 3.4 | Generated PDFs (inspection/statement/rescue) stored as `CLEAN`, scope-tagged | `modules/reports/pdf.service.ts` | statement / rescue e2e |
| 3.5 | List endpoints paginate and never overfetch across scope | `ScopedRepository` + `paginationQuery` | portal + list specs |

## 4. Injection & output handling

| # | Check | Code | Test |
|---|---|---|---|
| 4.1 | ORM-only; no string-built SQL. `$queryRaw` only with tagged params, audited list | grep gate in CI (`rg '\$queryRawUnsafe'` → 0) | `static` job |
| 4.2 | All input validated by Zod DTOs at the edge | `@nexahaus/validation`, `ZodValidationPipe` | per-module spec |
| 4.3 | Stored XSS: names / notes / messages / descriptions round-trip as text, never HTML | API returns JSON; web escapes by default (React) | `messages` + web review |
| 4.4 | Error envelope never leaks stack / SQL / infra on 5xx | `common/http-exception.filter.ts` | `http-exception.filter.spec.ts` |
| 4.5 | CSV import/export: formula-injection guard (`=,+,-,@` prefix) on export; strict parse on import | `common/csv.ts` `toCsv()` | `csv.spec.ts` |

## 5. Money & financial integrity

| # | Check | Code | Test |
|---|---|---|---|
| 5.1 | Money is integer minor units + currency; never float | `@nexahaus/types` `Money` | `money.spec.ts` |
| 5.2 | Every financial write is a DB transaction; ledger append-only | `modules/payments`, `modules/statements` (`prisma.$transaction`) | `payment-webhook.e2e-spec.ts`, `statement-reproduction.e2e-spec.ts` |
| 5.3 | Statement totals are a pure function of the `Transaction` ledger; re-generate = identical | `modules/statements/statements.service.ts` | **`statement-reproduction.e2e-spec.ts`** |
| 5.4 | Payment webhook: bad signature → 400 + nothing written; duplicate `providerEventId` → 200 no-op | `payments/provider/*`, unique `(provider, providerEventId)` | **`payment-webhook.e2e-spec.ts`** |
| 5.5 | Payment **initiation** is provider-abstraction/mock only — no real fund movement in code | `payments/provider/payment-provider.ts` | `payments` spec (mock `redirectUrl`) |
| 5.6 | Reconciled transaction cannot be edited; only reversal/adjustment, audited | no PATCH route; `statements.service` posts fee txn idempotently | `statement-reproduction.e2e-spec.ts` "no total-editing endpoint" |

## 6. Sessions, transport & headers

| # | Check | Code | Test |
|---|---|---|---|
| 6.1 | Refresh cookie `HttpOnly`, `Secure` (prod), `SameSite`; access token in memory only (web) | API `Set-Cookie`; `apps/web/src/lib/auth` | manual + `auth.e2e-spec.ts` |
| 6.2 | Helmet on; CSP enabled in production | `apps/api/src/main.ts` | manual header check |
| 6.3 | Web sets `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | `apps/web/next.config.mjs` `headers()` | manual |
| 6.4 | CORS locked to `APP_URL`; credentials mode explicit | `main.ts` `cors` | manual |
| 6.5 | `GET /health` (liveness) and `GET /ready` (deps) are `@Public` and leak nothing sensitive | `health/health.controller.ts` | `health` behaviour in e2e boot |

## 7. Secrets, config & supply chain

| # | Check | Code | Test |
|---|---|---|---|
| 7.1 | Config validated at boot; a missing/invalid var **fails fast** | `packages/config` `loadConfig()` | `packages/config` typecheck + prod guards |
| 7.2 | Production refuses to boot with a placeholder secret / `SEED_DEMO_DATA=true` | `packages/config/src/index.ts` cross-field guards | — |
| 7.3 | No secret in repo, image, logs, or error body | `.gitignore`, pino `redact`, `.dockerignore` | CI `static` + manual grep of image |
| 7.4 | `pnpm audit` (prod tree) has no High/Critical advisory | `.github/workflows/ci.yml` `static` job | CI |
| 7.5 | Dependencies pinned to exact versions | `package.json` (no `^`/`~`) | review |
| 7.6 | Images run as a non-root user | `apps/api/Dockerfile`, `apps/web/Dockerfile` | `docker run ... id` |

## 8. Audit & observability

| # | Check | Code | Test |
|---|---|---|---|
| 8.1 | Every state-changing action writes an `AuditLog` row (actor, role, before/after, ip, ua, request id) | `audit/audit.interceptor.ts` | `audit` spec + module e2e |
| 8.2 | `AuditLog` is INSERT/SELECT only for the app DB role — no UPDATE/DELETE | migration grants (`docs/DATABASE.md`) | DB role test / manual |
| 8.3 | 5xx captured to Sentry with correlation id only — no body/headers/PII | `http-exception.filter.ts` + `instrumentation.ts` `beforeSend` | `http-exception.filter.spec.ts`, manual |
| 8.4 | Structured JSON logs redact `authorization`, `cookie`, `password`, `mfaCode`, `code` | `app.module.ts` `LoggerModule` `redact` | manual |
| 8.5 | Alerts wired: error-rate spike, `/ready` failing, queue backlog, failed-login spike, webhook signature failures | monitoring stack (`docs/DEPLOYMENT.md §9`) | runbook drill |

## 9. Manual pen-test pass (each release)

Performed against staging with seeded multi-tenant data:

1. Enumerate every route from `GET /api/docs-json`; hit each with (a) no token, (b) a
   `TENANT` token, (c) a `VENDOR` token, (d) an `OWNER` token for a *different* client.
   Expect `401`/`403`/`404` — never data.
2. Swap ids in every path param to a resource owned by another tenant.
3. Add `role`, `clientId`, `assignedPropertyIds`, `scope`, `isPrimary` to write bodies.
4. Replay a captured refresh token after it rotated.
5. Re-deliver a captured payment webhook; then deliver one with a flipped byte in the body.
6. Upload an EICAR test file; confirm it never reaches `CLEAN`.
7. Request a presigned URL, then reuse it after TTL; use one tenant's URL as another.
8. Inject `=cmd|' /C calc'!A0` and `<script>` into every free-text field; export CSV; open it.
9. Confirm no secret appears in `docker history`, image layers, `/proc/1/environ` echoes, or error bodies.

Sign-off: reviewer, date, commit SHA, findings + dispositions recorded in the release ADR.

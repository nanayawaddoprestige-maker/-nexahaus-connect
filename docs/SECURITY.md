# Security

Security, authorization and audit logging are first-class requirements and are never
deferred to a later phase.

## 1. Authentication

| Concern            | Implementation                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password hashing   | **Argon2id** with OWASP params (`ARGON2_MEMORY_KIB=19456`, `iterations=2`, `parallelism=1`). Never bcrypt fallback in production.                                           |
| Credentials        | Email **or** Ghana `+233` phone + password. Email/phone normalised & uniqueness-enforced.                                                                                   |
| Verification       | OTP to email/phone before an account becomes `ACTIVE` (`OtpChallenge`, hashed codes, TTL, max attempts).                                                                    |
| Access token       | Short-lived JWT (`JWT_ACCESS_TTL`, default 15 min). Claims: `sub`, `roles`, `sessionId`, `jti`. Signed `JWT_ACCESS_SECRET`.                                                 |
| Refresh token      | Opaque random 256-bit, stored **hashed** in `Session`. TTL 30 days. **Rotation on every use**; a replayed/rotated token revokes the entire session chain (`rotatedFromId`). |
| Logout             | Revokes the session (`revokedAt`). "Log out all devices" revokes all user sessions.                                                                                         |
| Sessions / devices | `GET /auth/sessions` lists active sessions (device label, ip, last used); user can revoke individually.                                                                     |
| MFA (optional)     | TOTP (`MFA_ISSUER`), secret stored encrypted (`mfaSecretEnc`). Enforced on login when `mfaEnabled`.                                                                         |
| Brute force        | `failedLoginCount` + `lockedUntil` exponential lockout per account; `AUTH_RATE_LIMIT_MAX` per IP+account; generic "invalid credentials" (no user enumeration).              |
| Password reset     | Single-use hashed token, short TTL, invalidates existing sessions on completion.                                                                                            |

## 2. Authorization

### 2.1 Model

**RBAC** (`Role` → `Permission`) **plus resource-scope checks**. Permissions are verb:noun
strings (`property:read`, `payment:approve`, `statement:generate`, `inspection:submit`,
`audit:read`, …). A user may hold multiple roles; effective permissions are the union.

### 2.2 Enforcement layers (defence in depth)

1. **`AuthGuard`** — valid access token; loads `AuthUser` with `roles`, `permissions`,
   `clientIds` (from `ClientUser`), `assignedPropertyIds` (from `PropertyAssignment`).
2. **`PermissionGuard`** — route declares `@RequirePermission('...')`.
3. **`ResourceScopeGuard`** — for a route addressing a specific resource, verifies the
   resource resolves into the caller's `clientIds` / `assignedPropertyIds`.
   - `OWNER` / `TENANT`: strictly their own client / tenancy.
   - Staff: only assigned properties/clients.
   - `SUPER_ADMIN`, `MANAGING_DIRECTOR`: scope-exempt, still fully audited.
4. **Repository layer** — `ScopedRepository` re-injects the ownership `WHERE` on every
   query in an owner/tenant-facing path. An unscoped `prisma.<model>` call in such a path
   fails code review / a custom lint rule.

### 2.3 Rules

- **Never** trust a client-supplied `ownerId` / `clientId` / role claim in the body or
  query — the server derives scope from the authenticated session.
- **UI hiding is not authorization.** Every action is checked server-side.
- Unauthorized access to an existing resource returns the **same** response as a
  non-existent one (generic `403` or `404`) — never reveal existence, never leak fields.
- List endpoints return only in-scope rows; counts/aggregates are computed within scope.

## 3. Multi-tenant data isolation

Single NexaHaus org; isolation boundary is the **Client (owner)**. Test-enforced invariant:

> **Owner A must never read, list, count, aggregate, export, or be notified about Owner B's
> properties, units, tenants, leases, payments, transactions, statements, documents,
> maintenance, inspections, messages, approvals, or personal data.**

Covered by integration + e2e tests (see [TESTING.md](TESTING.md)); part of the release
gate.

## 4. File / document security

- Private S3 buckets only. **No public or permanent URLs.**
- Download = authorization check → `DocumentAccessLog` write → short-lived presigned URL
  (`STORAGE_SIGNED_URL_TTL`, default 300 s).
- Upload = presigned `PUT` scoped to a single key → finalize call records
  checksum/size/mime, enforces `STORAGE_MAX_UPLOAD_BYTES` and an allow-list
  (`pdf, jpg, png, webp, docx`) by magic bytes (not just extension).
- Malware scan hook (`MalwareScanner` interface; `noop` until a provider is set).
  Document is `PENDING` and undownloadable until `CLEAN`; `INFECTED` quarantines + alerts.
- Versioning via `DocumentVersion`; deletes are soft unless a `RetentionPolicy` permits
  hard deletion.
- Object keys are opaque UUID paths — never user-controlled filenames on disk.

## 5. Transport & storage

- TLS everywhere (HSTS at the edge). Secure cookies (`HttpOnly`, `Secure`, `SameSite`)
  where cookies are used (web refresh-token cookie).
- Encryption at rest for Postgres and object storage where the infrastructure supports it.
- Field-level encryption for the TOTP secret and tenant ID-document references.
- Backups encrypted; see [DEPLOYMENT.md](DEPLOYMENT.md#backups--disaster-recovery).

## 6. Application hardening

| Threat          | Control                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Injection       | Prisma parameterised queries only; no string-built SQL. Zod validation on all inputs.                                                                                        |
| XSS             | React auto-escaping; no `dangerouslySetInnerHTML` with user data; strict CSP at the edge.                                                                                    |
| CSRF            | Bearer tokens for API calls (not ambient cookies) on cross-site paths; for the cookie-based web refresh flow, `SameSite=Strict` + CSRF token.                                |
| Clickjacking    | `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`.                                                                                                                       |
| Headers         | Helmet: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.                                                                                             |
| Rate limiting   | Global per-IP bucket + strict `/auth` bucket (Redis-backed).                                                                                                                 |
| Mass assignment | Explicit DTOs; unknown keys rejected by Zod `.strict()`.                                                                                                                     |
| SSRF            | No user-supplied URLs fetched server-side; storage endpoints from config only.                                                                                               |
| Secrets         | Only via env (`packages/config`, fail-fast). Never in source, logs, responses, or client bundles. `.env` git-ignored; `.env.example` documents keys with placeholder values. |
| Dependency risk | Lockfile committed; `pnpm audit` in CI; Dependabot/renovate.                                                                                                                 |
| Logging hygiene | Structured logs never contain passwords, tokens, OTPs, full card/MoMo numbers, or unnecessary PII — ids only.                                                                |

## 7. Payments security

- Webhook endpoint verifies provider signature against `PAYMENT_WEBHOOK_SECRET` over the
  **raw** body before parsing.
- Idempotency: unique `(provider, providerEventId)` on `PaymentProviderWebhookEvent`;
  duplicate deliveries are no-ops and never create a second `Payment`/`Transaction`.
- Payment + allocation + transaction + event are written in one DB transaction.
- Reconciled financial records are immutable; adjustments are new reversal/adjustment
  transactions with an actor and reason. All financial mutations audited.

## 8. Audit logging

- `AuditLog` for every state-changing action: actor, actor role, action, resource
  type/id, `before`/`after` snapshots, ip, user agent, session id, request id, timestamp.
- Examples: approved maintenance expense; changed rent amount; uploaded/deleted document;
  modified tenant record; generated statement; role granted/revoked; login/logout;
  failed-auth lockout.
- **Immutable to application users** — the DB role holds `INSERT` + `SELECT` only on
  `AuditLog`; no `UPDATE`/`DELETE`. Reads gated by `audit:read`.

## 9. Security testing checklist (release gate)

- [ ] IDOR: sequential/guessed ids across owners, tenants, documents, payments → denied.
- [ ] Broken access control: every endpoint tested with under-privileged tokens.
- [ ] Privilege escalation: role/scope cannot be set via request body.
- [ ] Unauthorized file access: presigned URL cannot be minted cross-tenant; expired URL
      rejected.
- [ ] SQL injection: fuzz inputs; ORM-only confirmed.
- [ ] XSS: stored + reflected payloads in names, notes, messages, descriptions.
- [ ] CSRF: state-changing requests without valid token/bearer rejected.
- [ ] Brute force: lockout + rate limit verified; no user enumeration.
- [ ] Token theft: rotated refresh token reuse revokes chain; access token expiry honoured.
- [ ] Webhook: invalid signature rejected; duplicate event id does not double-post.
- [ ] Unauthorized financial modification: reconciled transaction edit blocked;
      only reversal/adjustment path allowed, and audited.
- [ ] Secrets: no secret in repo, bundle, logs, or error responses.

## 10. Incident response (outline)

Structured logs + Sentry alerting → triage severity → contain (revoke sessions / rotate
secrets / quarantine documents) → assess data impact via `AuditLog` + `DocumentAccessLog`
→ notify per Ghana Data Protection Act obligations (see [COMPLIANCE.md](COMPLIANCE.md)) →
post-incident review + ADR. Runbooks maintained in `/docs/runbooks` from Phase 10.

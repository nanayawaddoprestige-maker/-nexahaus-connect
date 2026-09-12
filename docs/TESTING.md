# Testing Strategy

## 1. Layers & tooling

| Layer       | Tool                                                                    | Scope                                                                                                            |
| ----------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest (packages, web) / Jest (api)                                     | Pure logic: money, rent allocation, health score, permissions, lead scoring, statement math, validators          |
| Integration | Jest + Supertest + ephemeral Postgres/Redis (Testcontainers or compose) | HTTP → guard → service → real DB. Auth, authorization, tenant isolation, workflows, idempotency, document access |
| E2E         | Playwright                                                              | Real browser against a seeded compose stack. Critical user journeys + the isolation suite                        |
| Contract    | OpenAPI schema diff                                                     | Fails CI on unintended breaking API changes                                                                      |
| Security    | Scripted suites (part of integration/e2e)                               | The checklist in [SECURITY.md](SECURITY.md#9-security-testing-checklist-release-gate)                            |

Coverage gates (CI-enforced) on critical modules: `finance` (payments, allocations,
statements, fees, distributions), `authz` (guards, scope resolution), `health-score`,
`property-rescue` — **≥ 90% lines / ≥ 85% branches**. Overall target ≥ 75%.

## 2. Mandatory unit tests

### 2.1 Money & rent (spec §81)

```
expected 800000 (GHS 8,000.00 in pesewas), pay 800000
  → paidMinor 800000, outstanding 0, status PAID

expected 800000, pay 500000
  → paidMinor 500000, outstanding 300000, status PARTIALLY_PAID

expected 800000, pay 500000 then pay 300000
  → paidMinor 800000, outstanding 0, status PAID, two allocations

pay 900000 against one 800000 charge
  → charge PAID (800000 allocated), 100000 unallocated credit

Money.percentage(800000, 10) → 80000 ; no floating-point drift across 10k iterations
Money.allocate(1000, [1,1,1]) → [334, 333, 333]  (sum preserved, deterministic)
currency mismatch in add()/allocate() → throws
```

### 2.2 Management fee (spec §98 — never hardcoded 10%)

```
feeType PERCENT_OF_COLLECTED, feePercent 5, collected 2450000 → fee 122500
feeType FIXED_MONTHLY, feeFixedMinor 300000 → fee 300000 regardless of collection
feeType PERCENT_OF_EXPECTED, feePercent 10, expected 2850000 → fee 285000
each property uses its own agreement's fee structure
```

### 2.3 Owner statement (spec §18) — reproducible from transactions

```
given a fixed set of transactions for a period
  → generating the statement twice yields identical totals
  → closingBalance = openingBalance + Σcredits − Σdebits
  → net = grossRentalIncome − managementFees − maintenance − otherExpenses
  → editing a StatementLine total directly is not possible via any endpoint
```

### 2.4 Property Health Score (spec §11) — transparent & configurable

```
with weights config vN and known component inputs
  → score = round(Σ componentValue_i * weight_i), 0..100 clamped
  → components snapshot + methodologyVersion persisted with the score
  → changing HealthScoreConfig weights changes new scores, not historical ones
  → recommendations generated from the lowest-scoring components
```

### 2.5 Permissions & scope resolution

```
OWNER token → clientIds resolved from ClientUser only
PROPERTY_MANAGER token → assignedPropertyIds from PropertyAssignment only
SUPER_ADMIN → scope-exempt but audit entry still written
permission union across multiple roles
request body attempting to set clientId/role is ignored by scope resolver
```

### 2.6 Lead scoring (spec §74)

```
configurable factors → deterministic score → grade bands A/B/C/D
changing LeadScoreConfig re-scores on next evaluation, not retroactively silently
```

## 3. Mandatory integration tests

- **Auth:** register → OTP verify → login → access protected route → refresh (rotation)
  → reuse old refresh token → whole chain revoked → logout.
- **Authorization matrix:** for each endpoint, call with (a) no token, (b) valid token
  missing the permission, (c) valid token + permission but out-of-scope resource,
  (d) fully authorized. Expect 401 / 403 / 403-or-404 / 2xx.
- **Tenant isolation (release-blocking):** Owner A + Property A, Owner B + Property B.
  Owner A attempts read / list / count / aggregate / export / document-download /
  statement / maintenance / inspection / message on Owner B's resources → all denied,
  **no field or existence leak**. Direct id, enumerated id, and filter-injection variants.
- **Payment idempotency:** deliver the same provider webhook event id twice → one
  `Payment`, one `Transaction`, one allocation, one `PAYMENT_RECEIVED` event. Invalid
  signature → rejected, nothing written.
- **Maintenance workflow (spec §82):** REPORTED → ACKNOWLEDGED → ASSIGNED → SCHEDULED →
  IN_PROGRESS → (cost > threshold ⇒ AWAITING_APPROVAL → owner approves) → COMPLETED →
  VERIFIED → CLOSED. Every transition creates a `MaintenanceStatusHistory` + `AuditLog`
  row. Illegal transitions (e.g. REPORTED → CLOSED) rejected.
- **Owner approval (spec §112 journey 4):** estimate over threshold creates `Approval` +
  `APPROVAL_REQUIRED` event + owner notification; approve → work order proceeds +
  `AuditLog`; decline → request halts.
- **Document access (spec §83):** upload insurance with expiry 2027-11-30 → a future
  `DocumentExpiryReminder` is scheduled; only authorized users get a download URL; the
  presigned URL expires; an expired URL is rejected; cross-tenant mint attempt denied.
- **Statement generation:** end-to-end from seeded transactions → totals match §2.3;
  PDF job enqueued; second generation is idempotent under `Idempotency-Key`.

## 4. E2E journeys (Playwright)

1. Owner: invitation → create account → verify → login → dashboard shows real portfolio
   aggregates → open property → latest inspection → rent status → maintenance list →
   documents → download monthly statement PDF.
2. Tenant: login → create maintenance request with photo → (staff) assign vendor →
   schedule → complete with after-photos → owner + tenant see completion.
3. Rent payment (manual adapter): finance officer records a GHS 8,000 payment → allocation
   → rent charge becomes PAID → owner dashboard "Collected" updates → notification → audit
   entry visible to admin.
4. Owner approval: maintenance estimate above threshold → owner notified → reviews photos
   - cost → approves → staff notified → audit logged.
5. Admin: create client → onboard → add property + units → assign property manager →
   property becomes ACTIVE.

## 5. Security tests

Automated coverage of the [SECURITY.md checklist](SECURITY.md#9-security-testing-checklist-release-gate):
IDOR, broken access control, privilege escalation, unauthorized file access, SQL injection,
XSS (stored/reflected in names, notes, messages, descriptions), CSRF, brute force + rate
limiting, refresh-token reuse, webhook signature, unauthorized financial modification,
secret leakage scan of build output.

## 6. CI gates

`lint` + `typecheck` + `prisma validate` + unit + integration + critical-module coverage

- e2e (incl. isolation suite) + OpenAPI contract check + `pnpm audit` (high/critical fails)
- build-output secret scan. All green = mergeable; tagged release additionally requires the
  manual security-checklist sign-off.

## 7. Test data

Fixtures use clearly fictional names and `@nexahaus.example` addresses. No real personal
data, ever. The seed script (`apps/api/prisma/seed.ts`) is the canonical dataset for
integration + e2e and is itself covered by a smoke test.

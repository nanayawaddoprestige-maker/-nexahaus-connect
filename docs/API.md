# API Design

REST, versioned at `/api/v1`. OpenAPI 3 served at `/api/docs` (Swagger UI) and
`/api/docs-json`. All timestamps ISO-8601 UTC. All money as `{ minor: string, currency:
"GHS" }` in payloads (string to avoid JS number precision loss).

## 1. Conventions

- **Auth:** `Authorization: Bearer <access token>` on every protected route. Refresh via
  `POST /api/v1/auth/refresh` (web sends the refresh token in an `HttpOnly` cookie;
  mobile sends it in the body).
- **Content type:** `application/json` except document upload finalize (still JSON;
  bytes go straight to storage via presigned URL).
- **Validation:** every param/query/body validated against a shared Zod schema
  (`packages/validation`). Unknown body keys rejected.
- **Idempotency:** unsafe operations that may be retried (payments, distributions,
  statement generation) accept `Idempotency-Key` header; the server stores the first
  result and replays it for duplicates.
- **Correlation:** every response carries `X-Request-Id`; clients should log it.

## 2. Response envelope

Success:
```json
{
  "success": true,
  "data": { },
  "meta": { "requestId": "..." }
}
```

List:
```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "requestId": "...",
    "page": 1,
    "pageSize": 25,
    "totalItems": 137,
    "totalPages": 6,
    "sort": "createdAt:desc",
    "filters": { "status": "ACTIVE" }
  }
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "The requested property could not be found.",
    "details": [ { "path": "body.rentMinor", "message": "must be a positive integer" } ]
  },
  "meta": { "requestId": "..." }
}
```
`details` is present only for `VALIDATION_FAILED`. Stack traces, SQL, and infra details are
**never** returned.

## 3. Error codes (stable strings)

`VALIDATION_FAILED` (422) · `UNAUTHENTICATED` (401) · `TOKEN_EXPIRED` (401) ·
`FORBIDDEN` (403) · `NOT_FOUND` (404) · `<RESOURCE>_NOT_FOUND` (404) ·
`CONFLICT` (409) · `DUPLICATE_RESOURCE` (409) · `IDEMPOTENCY_REPLAY` (200, replayed) ·
`RATE_LIMITED` (429) · `PAYLOAD_TOO_LARGE` (413) · `UNSUPPORTED_MEDIA_TYPE` (415) ·
`WEBHOOK_SIGNATURE_INVALID` (400) · `APPROVAL_REQUIRED` (409) ·
`RECONCILED_RECORD_IMMUTABLE` (409) · `INTERNAL_ERROR` (500, generic message + requestId).

A cross-tenant access attempt returns `FORBIDDEN` or `NOT_FOUND` with **no** indication
that the resource exists.

## 4. Pagination, filtering, sorting

- `?page=1&pageSize=25` (max `pageSize` 100). Cursor pagination (`?cursor=`) for
  high-volume feeds (audit logs, notifications, messages).
- `?sort=field:asc,field2:desc` — allow-listed fields per resource.
- Filters are explicit query params per resource (allow-listed): e.g. properties support
  `status, type, region, city, clientId, managerId, q`. Admin dashboards additionally:
  `date`, `ownerId`, `propertyType`, `tenantId`, `paymentStatus`, `maintenancePriority`,
  `clientSegment` (spec §53).
- Date ranges: `?from=YYYY-MM-DD&to=YYYY-MM-DD` plus named presets
  `?range=this_month|3m|6m|12m`.

## 5. Module map (`/api/v1`)

| Prefix | Key endpoints (representative) |
|---|---|
| `/auth` | `register`, `verify`, `login`, `refresh`, `logout`, `logout-all`, `sessions`, `sessions/:id` (DELETE), `mfa/setup`, `mfa/enable`, `mfa/verify`, `password/forgot`, `password/reset` |
| `/users` | `me`, `me` (PATCH), `users` (admin CRUD), `users/:id/roles` |
| `/roles` | `roles`, `roles/:id/permissions`, `permissions` |
| `/clients` | CRUD, `:id/users`, `:id/onboarding`, `:id/contacts`, `:id/statements`, `:id/portfolio-summary` |
| `/properties` | CRUD, `:id`, `:id/financials`, `:id/units`, `:id/tenants`, `:id/maintenance`, `:id/inspections`, `:id/documents`, `:id/health`, `:id/health/history`, `:id/rescue`, `:id/assignments`, `:id/agreement`, `:id/onboarding` |
| `/units` | CRUD, `:id`, `:id/leases` |
| `/tenants` | CRUD (scoped), `:id`, `:id/leases`, `:id/payments`, `:id/maintenance`, `:id/documents` |
| `/leases` | CRUD, `:id`, `:id/renew`, `:id/terminate`, `:id/reminders`, `:id/rent-charges` |
| `/rent` | `charges`, `charges/:id`, `charges/:id/waive`, `schedules` |
| `/payments` | `payments`, `payments/:id`, `payments` (POST — manual record), `:id/allocations`, `webhook` (provider callback), `:id/refund` |
| `/expenses` | CRUD, `:id`, `:id/submit`, `:id/approve`, `:id/reject`, `:id/pay` |
| `/maintenance` | `requests` CRUD, `:id`, `:id/transition`, `:id/work-orders`, `:id/media`, `:id/verify`, `:id/close`, `preventive-plans` |
| `/vendors` | CRUD, `:id`, `:id/assignments`, `:id/documents`, `:id/work-orders`, `:id/payments` |
| `/inspections` | CRUD, `:id`, `:id/items`, `:id/media`, `:id/submit`, `:id/review`, `:id/report`, `templates` |
| `/documents` | `documents` (list scoped), `:id`, `upload-url` (POST), `:id/finalize`, `:id/download-url`, `:id/versions`, `:id/access-log` |
| `/statements` | `statements`, `:id`, `generate` (POST), `:id/pdf`, `:id/send` |
| `/reports` | `owner/*`, `management/*`, each supporting filters + `?format=json|csv|pdf` |
| `/property-health` | `:propertyId`, `:propertyId/history`, `config` (GET/PUT, admin), `recompute` (POST) |
| `/property-rescue` | `:propertyId` (GET latest), `assessments`, `:id`, `:id/pdf`, `:id/recommendations` |
| `/approvals` | `approvals` (scoped list), `:id`, `:id/approve`, `:id/decline`, `:id/request-info` |
| `/notifications` | `notifications` (cursor feed), `:id/read`, `read-all`, `preferences` (GET/PUT) |
| `/messages` | `threads`, `threads/:id`, `threads/:id/messages`, `threads` (POST), `threads/:id/read` |
| `/leads` | CRUD, `:id`, `:id/activities`, `:id/convert`, `score-config` |
| `/surveys` | `surveys`, `:id`, `:id/responses`, `public/:key` (GET), `public/:key/respond` (POST) |
| `/health-check` | `public/property-health-check` (POST — lead magnet), `assessments` (request professional) |
| `/onboarding` | `client/:clientId`, `client/:clientId/step`, `property/:propertyId/checklist` |
| `/audit` | `logs` (cursor, `audit:read` only), `logs/:id` |
| `/settings` | `organization` (GET/PUT), `system` (GET/PUT, SUPER_ADMIN) |
| `/imports` | `imports` (POST CSV), `:id/status`, `:id/errors` (Phase 9) |
| `/exports` | `exports` (POST), `:id/status`, `:id/download` |

Health: `GET /health` (liveness), `GET /ready` (Postgres + Redis + storage checks) — no
`/api/v1` prefix, unauthenticated.

## 6. Versioning policy

`/api/v1` is stable. Breaking changes → `/api/v2` with an overlap window; non-breaking
additions go into `v1`. Deprecations announced via `Deprecation` + `Sunset` response
headers and the changelog.

## 7. OpenAPI

Generated from NestJS decorators + `nestjs-zod`. Every endpoint documents: summary,
required permission, path/query/body schema, success + error responses, and an example.
The spec is published as a build artifact and consumed by the web/mobile API clients for
type generation.

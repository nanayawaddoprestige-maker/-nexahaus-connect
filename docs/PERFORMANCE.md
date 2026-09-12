# Performance

Targets, the load model, what the code already does, and how to investigate a regression.

## 1. Service level objectives

| Surface                                | Metric      | Target                                       |
| -------------------------------------- | ----------- | -------------------------------------------- |
| API read endpoints (`GET`, list)       | p95 latency | ≤ 250 ms                                     |
| API write endpoints                    | p95 latency | ≤ 500 ms                                     |
| Statement generation                   | wall time   | ≤ 3 s for a 12-month, single-property period |
| Health-score recompute                 | wall time   | ≤ 1 s per property                           |
| Web (SSR pages)                        | TTFB p95    | ≤ 400 ms                                     |
| Domain event → notification dispatched | p95         | ≤ 30 s                                       |
| Availability (api + web)               | monthly     | ≥ 99.9 %                                     |
| Error budget                           | 5xx / total | ≤ 0.1 %                                      |

## 2. Load model (launch + 12 months)

Sized for NexaHaus's own book, not a public SaaS:

- ~150 properties, ~600 units, ~600 active tenants, ~40 staff, ~50 owners.
- Rent cycle: a monthly burst of ~600 rent charges + payment webhooks over ~72 h.
- Steady state: < 5 req/s API; < 50 background jobs/min.
- Documents: ~30 MB/day of uploads; PDFs generated on demand.

Design headroom: **10×** the above on 2 `api` + 2 `worker` replicas. This is comfortably
within one modest Postgres instance; the architecture (stateless app tier, queue-backed
side effects) scales horizontally before it needs a bigger DB.

## 3. What the code already does

- **Stateless app tier** — sessions in Postgres/Redis, no in-memory state; add replicas freely.
- **Scoped queries** — `ScopedRepository` always adds the ownership `WHERE`; list endpoints
  paginate (`paginationQuery`, capped `MAX_PAGE_SIZE`) and never `findMany` unbounded.
- **Money as `BigInt` minor units** — integer math, no decimal library on the hot path.
- **Transactional outbox** — request handlers do the DB write + enqueue only; email/SMS/
  WhatsApp/push and score recomputes run in the `worker` off a BullMQ queue
  (`attempts: 5`, exponential backoff, `removeOnComplete`).
- **AuthUser cache** — roles/permissions/scope resolved once and cached in Redis
  (`AuthUserService`), so guards don't re-query per request.
- **Statements are ledger folds** — totals are a single pass over `Transaction` rows for
  the period; re-generation is idempotent, not a recompute storm.
- **PDF generation** off the request path where it isn't user-blocking; results stored as
  documents and served via short-lived presigned URLs (no proxying bytes through the API).
- **Indexes** — every foreign key and every scope column (`propertyId`, `clientId`,
  `unitId`, `leaseId`, `tenantId`), plus the webhook unique `(provider, providerEventId)`
  and `DomainEvent (processedAt, occurredAt)` for the relay scan. See `schema.prisma`.
- **Web** — App Router with server components; `recharts` is the only heavy client dep and
  is route-scoped; TanStack Query dedupes and caches client fetches.

## 4. Guardrails in CI

- Coverage gates on `finance`, `authz`, `property-health` (correctness precedes tuning).
- `pnpm audit --prod` — a vulnerable transitive dep is also a perf/stability risk.
- Bundle: `next build` output is reviewed on material change; no client bundle > 300 kB gz
  without a note.

## 5. Investigating a regression

1. **Confirm** on dashboards: which route, read or write, since when, correlates with a deploy?
2. **DB first** — enable `log_min_duration_statement=200ms`; look for a new sequential scan
   or an N+1 (many identical parameterised queries per request). `EXPLAIN (ANALYZE, BUFFERS)`
   the offender. Most regressions are a missing index on a new column or a Prisma
   `include` that fans out — prefer a targeted `select`, or split the query.
3. **Pool** — if `api` waits on connections, check for a long-running transaction (a
   `$transaction` doing I/O it shouldn't) before raising pool size.
4. **Queue** — rising `worker` backlog: inspect failed jobs and `DomainEvent.lastError`;
   scale `worker` replicas; a single poison event should not stall the relay (it's marked
   and skipped after max attempts).
5. **Payload** — a list endpoint returning too much: tighten the `select`, confirm
   pagination, add a projection DTO.
6. **Web** — `next build` then inspect the route's server timing; a slow SSR page is
   usually one un-cached API call — batch or cache it.

## 6. Load & soak testing (pre-launch and before a major release)

- **Rent-burst scenario**: replay 600 payment webhooks + statement generation for 20
  clients within 10 min; assert p95 write ≤ 500 ms, zero 5xx, queue drains < 5 min after.
- **Isolation under load**: run the cross-tenant probe suite concurrently with the burst;
  it must still return 403/404 with no leak.
- **Soak**: 10× steady-state for 2 h; watch RSS, DB connections, and queue depth for drift.
- Tooling: `k6` scripts under `load/` (added alongside the first staging environment),
  run from CI on a manual trigger against staging.

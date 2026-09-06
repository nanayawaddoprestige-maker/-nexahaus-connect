# Deployment

## 1. Local prerequisites

The build machine currently has **only Git**. Install:

| Tool | Version | Why | Windows install |
|---|---|---|---|
| Node.js | 20 LTS (≥ 20.11) | Runs api/web/mobile tooling | `winget install OpenJS.NodeJS.LTS` or nvm-windows |
| Corepack → pnpm | pnpm 9.x | Monorepo package manager | `corepack enable` then `corepack prepare pnpm@latest --activate` |
| Docker Desktop | latest | Local Postgres + Redis + MinIO | `winget install Docker.DockerDesktop` |
| (optional) Expo tooling | via `pnpm` | Mobile app | installed as a workspace dep |

Verify:
```bash
node -v && pnpm -v && docker --version
```

## 2. Environments

| Env | Purpose | Data | Deploy trigger |
|---|---|---|---|
| `development` | Local dev | docker compose; seedable demo data | manual |
| `staging` | Production-like validation | isolated DB; seed or restored anonymised snapshot | merge to `main` |
| `production` | Live | real data; no demo seed | tagged release / manual approval |

Only environment variables differ between environments. Full catalogue: [`.env.example`](../.env.example).

## 3. Local run

```bash
pnpm install
docker compose up -d                 # postgres:5432, redis:6379, minio:9000/9001
cp .env.example .env                  # fill JWT secrets, demo password, etc.
pnpm --filter @nexahaus/api prisma migrate dev
pnpm --filter @nexahaus/api db:seed
pnpm dev                              # turbo: api (4000) + web (3000)
# mobile: pnpm --filter @nexahaus/mobile start
```

`docker-compose.yml` services: `postgres` (16, named volume `pgdata`), `redis` (7),
`minio` (+ `createbuckets` init container that makes `nexahaus-documents`). App
containers (`api`, `web`, `worker`) are defined for parity but usually run via `pnpm dev`
locally.

## 4. Production topology

```
                 ┌─────────── CDN / edge (TLS, HSTS, CSP, WAF) ───────────┐
                 │                                                        │
        ┌────────▼─────────┐                              ┌───────────────▼────────┐
        │  web (Next.js)   │  SSR/ISR, static assets      │  api (NestJS)          │
        │  N replicas      │ ───────────────────────────▶ │  N replicas, stateless │
        └──────────────────┘                              └───┬────────────┬───────┘
                                                              │            │
                                            ┌─────────────────▼──┐   ┌─────▼──────────┐
                                            │ worker (BullMQ)    │   │ PostgreSQL 16  │
                                            │ N replicas         │   │ primary + PITR │
                                            └─────────┬──────────┘   │ + read replica │
                                                      │              └────────────────┘
                                         ┌────────────▼───┐   ┌────────────────────────┐
                                         │ Redis (cache + │   │ S3-compatible object   │
                                         │ queues), HA    │   │ storage (versioned)    │
                                         └────────────────┘   └────────────────────────┘
```

- **api / web / worker** are stateless and horizontally scalable. Sessions live in
  Postgres/Redis, not memory.
- **Migrations** run as a pre-deploy job: `pnpm --filter @nexahaus/api prisma migrate
  deploy`. Never `migrate dev` outside local.
- **Zero-downtime**: migrations are backward-compatible (expand → deploy → contract in a
  later release).

## 5. Containers

Each app ships a multi-stage `Dockerfile` (deps → build → slim runtime, non-root user).
Images tagged with the git SHA. `worker` reuses the api image with a different entrypoint.

## 6. CI/CD pipeline

1. **install** — `pnpm install --frozen-lockfile` (Turbo remote cache).
2. **static** — `pnpm lint`, `pnpm typecheck`, `pnpm prisma validate`, `pnpm audit`.
3. **test** — unit + integration (ephemeral Postgres + Redis services); coverage gates
   for `finance`, `authz`, `health-score` modules.
4. **build** — `pnpm build` for all apps; build Docker images.
5. **e2e** — Playwright against a compose stack with seeded data (incl. the cross-tenant
   isolation suite).
6. **deploy staging** — on `main`: `migrate deploy` → rolling deploy → smoke tests.
7. **deploy production** — on tagged release with manual approval: DB snapshot →
   `migrate deploy` → rolling deploy → smoke tests → notify.

Release gate: all of the above green **plus** the security checklist in
[SECURITY.md](SECURITY.md#9-security-testing-checklist-release-gate).

## 7. Health & readiness

- `GET /health` — process is up (no dependency checks). Used by the orchestrator liveness
  probe.
- `GET /ready` — checks Postgres (`SELECT 1`), Redis (`PING`), storage (`headBucket`).
  Returns `503` with a per-dependency status object if any fail. Used by readiness probe
  and load-balancer registration.
- `worker` exposes `/health` on its own port and reports queue depths to metrics.

## 8. Backups & disaster recovery

| Asset | Strategy | Target |
|---|---|---|
| PostgreSQL | Automated daily base backup + continuous WAL archiving (PITR). Encrypted. Retention 30 days (financial/audit rows also protected by `RetentionPolicy`). | RPO ≤ 5 min, RTO ≤ 1 h |
| Object storage | Versioned bucket + cross-region replication. Lifecycle keeps prior versions 90 days. | RPO ≈ 0 |
| Secrets | Managed secrets store (not in repo/images). Rotation runbook. | — |
| Restore drills | Quarterly: restore latest snapshot to a scratch environment, run smoke + a statement-reproduction check. | verified quarterly |

DR runbook (from Phase 10) in `/docs/runbooks/disaster-recovery.md`: provision infra from
IaC → restore DB (PITR to chosen timestamp) → point storage to replica → deploy last-good
images → run `/ready` + smoke + isolation tests → cut over DNS.

## 9. Observability in production

- Structured JSON logs shipped to a log store; 30-day hot retention.
- Sentry (`SENTRY_DSN`) for exceptions in api/web/worker.
- OpenTelemetry traces (`OTEL_EXPORTER_OTLP_ENDPOINT`) for api + worker; key spans: DB,
  storage, queue, outbound adapters.
- Uptime checks on `/health`, `/ready`, and the web root.
- Alerts: error-rate spike, `/ready` failing, queue backlog, DB connection saturation,
  failed-login spike, webhook signature failures.

## 10. Configuration management

`packages/config` validates env at boot and **fails fast** on missing/invalid values, so a
misconfigured deploy never serves traffic. Business configuration (fees, thresholds,
categories, templates, score weights) is in the database (`OrganizationSetting`), editable
by `SUPER_ADMIN`, and never requires a redeploy.

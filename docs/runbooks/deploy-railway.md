# Runbook: Deploy to Railway

Railway hosting for NexaHaus Connect: one project, two managed databases, three
services (`api`, `worker`, `web`) built from this repo's Dockerfiles. Object
storage is **not** on Railway — bring an S3-compatible bucket.

Config files in the repo root: [`railway.api.json`](../../railway.api.json),
[`railway.worker.json`](../../railway.worker.json),
[`railway.web.json`](../../railway.web.json).

---

## 0. Prerequisites

- [ ] Repo pushed to GitHub **with `pnpm-lock.yaml` and `apps/api/prisma/migrations/`
      committed** (the one-time bootstrap in [DEPLOYMENT.md §5](../DEPLOYMENT.md#5-containers)).
      Railway builds with `--frozen-lockfile` and runs `prisma migrate deploy`; both
      fail without those.
- [ ] An S3-compatible bucket + keys: Cloudflare R2, AWS S3, or Backblaze B2.
- [ ] A Railway account + the GitHub repo connected.

## 1. Project + databases

1. **New Project** → Deploy from GitHub repo → pick this repo. (You'll reconfigure the
   first service in step 2; or delete it and add all three fresh.)
2. **+ New** → **Database** → **PostgreSQL**. Rename the service `Postgres`.
3. **+ New** → **Database** → **Redis**. Rename the service `Redis`.
4. On `Postgres` → Settings, enable **PITR / backups** (Pro plan) — required by the
   [backup-restore runbook](backup-restore.md).

## 2. Create the three app services

For **each** of `api`, `worker`, `web`: **+ New** → **GitHub Repo** → this repo, then in
the service's **Settings**:

| Setting                                  | Value                                                           |
| ---------------------------------------- | --------------------------------------------------------------- |
| **Root Directory**                       | _(leave blank — the Dockerfiles need repo-root context)_        |
| **Config-as-code / Railway Config File** | `railway.api.json` · `railway.worker.json` · `railway.web.json` |
| **Networking → Public Domain**           | Generate for `api` and `web`. **Not** for `worker`.             |

The config file sets the builder, Dockerfile path, start command, health check, and (for
`api`) the `prisma migrate deploy` pre-deploy step.

## 3. Environment variables

Use Railway **reference variables** so URLs stay in sync. Set these on the service noted.

### Shared (set on `api`, `worker`, and `web` — Railway "shared variables" work well)

```
NODE_ENV=production
DATABASE_URL=${{ Postgres.DATABASE_PRIVATE_URL }}
REDIS_URL=${{ Redis.REDIS_PRIVATE_URL }}
APP_URL=https://<web public domain>
API_URL=https://<api public domain>
JWT_ACCESS_SECRET=<32+ random chars>
JWT_REFRESH_SECRET=<32+ random chars, different>
PAYMENT_WEBHOOK_SECRET=<32+ random chars>
EMAIL_FROM=no-reply@yourdomain.com
STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com
STORAGE_BUCKET=nexahaus-documents
STORAGE_ACCESS_KEY=<key>
STORAGE_SECRET_KEY=<secret>
STORAGE_FORCE_PATH_STYLE=true
SEED_DEMO_DATA=false
```

> `DATABASE_PRIVATE_URL` / `REDIS_PRIVATE_URL` keep DB traffic on Railway's internal
> network (no egress cost, lower latency). If a reference name differs in your project,
> check the database service's **Variables** tab.

### `api` service — extra

```
WORKER_ENABLED=false
DISABLE_SCHEDULERS=true
PAYMENT_CALLBACK_URL=https://<api public domain>/api/v1/payments/webhook
PAYMENT_PROVIDER=manual
```

### `worker` service — extra

```
WORKER_ENABLED=true
DISABLE_SCHEDULERS=false
```

### `web` service — extra

```
API_ORIGIN=https://<api public domain>
```

> `web` proxies `/api/*` to `API_ORIGIN` (see `apps/web/next.config.mjs`) so the
> HttpOnly refresh cookie stays first-party. To keep that hop internal instead, set
> `API_ORIGIN=http://${{ api.RAILWAY_PRIVATE_DOMAIN }}:${{ api.PORT }}`.

Optional (add when you have them): `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
`EMAIL_PROVIDER` + `EMAIL_API_KEY`, `SMS_PROVIDER` + `SMS_API_KEY`, real
`PAYMENT_PROVIDER` + `PAYMENT_API_KEY` / `PAYMENT_API_SECRET`, `APP_RELEASE` (git SHA).

## 4. Deploy

Trigger a deploy on all three (push to the tracked branch, or **Deploy** in the UI).
Order does not matter — the `api` service's `preDeployCommand` runs
`prisma migrate deploy` and blocks its own go-live until migrations succeed; `worker`
and `web` just start.

## 5. Smoke test

```bash
API=https://<api public domain>
curl -fsS $API/health         # {"status":"ok",...}
curl -fsS $API/ready          # {"status":"ready","checks":{"database":"up","redis":"up"}}
curl -fsS -o /dev/null -w '%{http_code}\n' https://<web public domain>/   # 200
```

Then in the browser: open the web domain, sign in (create the first admin with
`pnpm --filter @nexahaus/api db:seed` run once from a local shell pointed at the Railway
`DATABASE_URL`, or via a one-off Railway shell), open the owner dashboard, open a
property.

## 6. Operating notes

- **Scale**: bump `numReplicas` in the config file, or set replicas per service in the
  UI. `api` and `worker` are stateless; run 2+ of each for zero-downtime deploys.
- **Migrations on every deploy**: safe — they're expand-only and idempotent. A failed
  migration fails the `api` deploy and leaves the old version serving.
- **Logs / rollback**: per-service **Deployments** tab — redeploy a previous build to
  roll back. Code rollback needs no DB rollback (expand-only).
- **Custom domains**: add under each service's **Networking**; update `APP_URL` /
  `API_URL` / `API_ORIGIN` / `PAYMENT_CALLBACK_URL` to match, then redeploy.
- **Backups / DR**: Railway Postgres backups cover the daily snapshot; the
  [backup-restore](backup-restore.md) and [disaster-recovery](disaster-recovery.md)
  runbooks still apply for the quarterly drill and for off-Railway copies via
  `scripts/backup.sh` (point `DATABASE_URL` at the Railway instance).

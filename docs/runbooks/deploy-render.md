# Runbook: Deploy to Render (fallback)

Render Blueprint hosting: one Postgres, one Key Value (Redis), three services
(`api`, `worker`, `web`) from this repo's Dockerfiles. Object storage is **not** on
Render — bring an S3-compatible bucket.

Config: [`render.yaml`](../../render.yaml) (repo root).

---

## 0. Prerequisites

- [ ] Repo on GitHub with **`pnpm-lock.yaml` and `apps/api/prisma/migrations/` committed**
      (bootstrap — [DEPLOYMENT.md §5](../DEPLOYMENT.md#5-containers)). Render builds with
      `--frozen-lockfile` and runs `prisma migrate deploy`.
- [ ] An S3-compatible bucket + keys (Cloudflare R2 / AWS S3 / Backblaze B2).
- [ ] Paid instance types — `preDeployCommand` (the migration step) does not run on Free.

## 1. Create the Blueprint

1. Render Dashboard → **New → Blueprint** → connect this repo.
2. Render reads `render.yaml` and shows: 1 database, 1 env var group, 3 services.
   Before **Apply**, fill the values it prompts for (the `sync: false` and placeholder
   entries):
   - **Env var group `nexahaus-backend`:** `EMAIL_FROM`, `STORAGE_ENDPOINT`,
     `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` (keep `STORAGE_BUCKET`,
     `STORAGE_FORCE_PATH_STYLE`, `SEED_DEMO_DATA` as given). JWT / webhook secrets are
     generated automatically.
3. **Apply.** Render provisions Postgres + Key Value, builds the images, and (via
   `preDeployCommand`) runs `prisma migrate deploy` before the API goes live.

## 2. Fill the three deferred vars on `nexahaus-api`

`api` and `web` reference each other's URLs, which is a circular Blueprint reference, so
these are left blank. After the first deploy, copy the assigned URLs from the dashboard
and set on **`nexahaus-api` → Environment**:

```
APP_URL=https://nexahaus-web-XXXX.onrender.com
API_URL=https://nexahaus-api-XXXX.onrender.com
PAYMENT_CALLBACK_URL=https://nexahaus-api-XXXX.onrender.com/api/v1/payments/webhook
```

Save → `api` redeploys. (`worker` and `web` already resolve their URLs automatically.)

## 3. Smoke test

```bash
API=https://nexahaus-api-XXXX.onrender.com
curl -fsS $API/health          # {"status":"ok",...}
curl -fsS $API/ready           # {"status":"ready","checks":{"database":"up","redis":"up"}}
curl -fsS -o /dev/null -w '%{http_code}\n' https://nexahaus-web-XXXX.onrender.com/   # 200
```

Open the web URL, sign in, load the owner dashboard. Create the first admin by running
`pnpm --filter @nexahaus/api db:seed` once from a local shell pointed at the Render
**external** `DATABASE_URL`, or from a Render shell on the `api` service.

## 4. Operating notes

- **Migrations run on every deploy** via `preDeployCommand` — safe (expand-only,
  idempotent); a failure fails that deploy and keeps the old version serving.
- **Scale:** raise `numInstances` (or set it in the dashboard). `api` and `worker` are
  stateless — run 2+ for zero-downtime deploys. Redis `maxmemoryPolicy` is `noeviction`
  so BullMQ jobs are never dropped.
- **Custom domains:** add under each web service → **Settings → Custom Domains**, then
  update `APP_URL` / `API_URL` / `API_ORIGIN` / `PAYMENT_CALLBACK_URL` and redeploy.
- **Region:** everything is `frankfurt` (closest Render region to Accra). All services
  must share a region for private networking.
- **Backups / DR:** Render Postgres includes daily backups + PITR on paid plans; the
  [backup-restore](backup-restore.md) and [disaster-recovery](disaster-recovery.md)
  runbooks still apply for the quarterly drill and off-Render copies
  (`scripts/backup.sh` with `DATABASE_URL` pointed at Render).

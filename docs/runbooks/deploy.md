# Runbook: Deploy

Mirrors [DEPLOYMENT.md §6](../DEPLOYMENT.md#6-cicd-pipeline). CI must be green on the
target commit before any step here.

## 0. Preconditions

- [ ] `pnpm-lock.yaml` committed and unchanged by `pnpm install --frozen-lockfile`.
- [ ] CI `static`, `test`, `build` jobs green on the commit SHA.
- [ ] [SECURITY_CHECKLIST.md](../SECURITY_CHECKLIST.md) signed off for this release.
- [ ] Migrations reviewed: backward-compatible (expand → deploy → contract later).
- [ ] `production` only: change-approval recorded; DB snapshot step below is not skipped.

## 1. Build & publish images

```bash
export TAG=$(git rev-parse --short HEAD)
docker build -f apps/api/Dockerfile -t $REGISTRY/nexahaus-api:$TAG .
docker build -f apps/web/Dockerfile -t $REGISTRY/nexahaus-web:$TAG .
docker push $REGISTRY/nexahaus-api:$TAG
docker push $REGISTRY/nexahaus-web:$TAG
```

Images are immutable and tagged with the git SHA. Never deploy `latest`.

## 2. production only — snapshot the database

```bash
scripts/backup.sh production pre-deploy-$TAG
```

Confirm the object appears in the backup bucket and the log line prints `OK`.

## 3. Migrate (pre-deploy job)

Runs as a one-shot task on the new image, before any app pod rolls:

```bash
# compose reference stack:
docker compose -f docker-compose.prod.yml --env-file .env.$ENV run --rm migrate
# k8s: apply the migrate Job, wait for Completed
```

`prisma migrate deploy` only. Never `migrate dev`. If it exits non-zero, **stop** and go
to [incident-response.md](incident-response.md) — do not roll app pods.

## 4. Rolling deploy

- Roll `worker` first (drains BullMQ cleanly on SIGTERM), then `api`, then `web`.
- Keep `maxUnavailable: 0`, `maxSurge: 1`.
- Health gates: a pod joins the LB only when `GET /ready` returns 200 (api) / root 200 (web).

## 5. Smoke test (both envs)

```bash
BASE=https://$ENV.nexahaus.example
curl -fsS $BASE/health            # {"status":"ok"}
curl -fsS $BASE/ready             # {"status":"ready", ...}
curl -fsS -o /dev/null -w '%{http_code}\n' $BASE/           # web 200
# authed probe with a seeded staging owner (staging only):
scripts/smoke-auth.sh $ENV
```

Then in the app: log in, open the owner dashboard, open one property, open one statement
(totals render), file a maintenance request. All must succeed.

## 6. Post-deploy

- [ ] Error rate and `/ready` flat for 15 min (dashboards).
- [ ] Queue depth returns to baseline.
- [ ] Announce done in `#nexahaus-ops` with the SHA.
- [ ] `production`: keep the pre-deploy snapshot for 7 days.

## Rollback

1. Re-point the deployment to the previous image SHA; roll `web` → `api` → `worker`.
2. Migrations are expand-only, so a code rollback needs **no** DB rollback. If a
   contract migration was included by mistake and a column is now missing, restore from
   the step-2 snapshot per [backup-restore.md](backup-restore.md) and open an incident.
3. Announce the rollback and the reason; file the ADR.

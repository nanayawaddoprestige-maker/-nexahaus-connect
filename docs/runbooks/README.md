# Runbooks

Operational procedures for NexaHaus Connect. Each runbook is written to be followed
under pressure: numbered steps, copy-pasteable commands, explicit success checks.

| Runbook | When |
|---|---|
| [deploy.md](deploy.md) | Shipping a release to staging or production |
| [deploy-railway.md](deploy-railway.md) | First deploy to Railway (managed Postgres + Redis, 3 services) |
| [deploy-vercel-web.md](deploy-vercel-web.md) | Hosting `apps/web` on Vercel/Netlify (API + worker still need a container host) |
| [incident-response.md](incident-response.md) | Suspected outage, data exposure, or abuse |
| [disaster-recovery.md](disaster-recovery.md) | Region / cluster / database loss |
| [backup-restore.md](backup-restore.md) | Taking or restoring a backup; the quarterly drill |
| [on-call.md](on-call.md) | Alert response reference and escalation |

Conventions:

- `ENV` is `staging` or `production`. Never run a `production` step without the named approval.
- Secrets come from the managed secrets store, never from a file in the repo or an image.
- Every production change is announced in `#nexahaus-ops` before and after.
- After any incident or DR event, file an ADR under `docs/adr/` within 48h.

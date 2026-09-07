# Runbook: Deploy the web app to Vercel

**Scope: `apps/web` only.** Vercel/Netlify run functions, not long-lived processes, so the
NestJS API, the BullMQ worker, Postgres and Redis are hosted elsewhere (see
[deploy-railway.md](deploy-railway.md) for the API + worker; Neon/Supabase for Postgres,
Upstash for Redis). Pick Vercel **or** Netlify, not both.

Config: [`apps/web/vercel.json`](../../apps/web/vercel.json).

---

## 0. Prerequisites

- [ ] Repo on GitHub with `pnpm-lock.yaml` committed (bootstrap — see
      [DEPLOYMENT.md §5](../DEPLOYMENT.md#5-containers)).
- [ ] The API already deployed and reachable at a public HTTPS URL.

## 1. Import the project

1. Vercel → **Add New… → Project** → import this repo.
2. **Root Directory:** `apps/web`. Vercel detects the pnpm workspace and installs from the
   repo root automatically.
3. Framework preset: **Next.js** (auto). Leave build/install/output blank — `vercel.json`
   sets them:
   - Install: `pnpm install --frozen-lockfile`
   - Build: `cd ../.. && pnpm --filter @nexahaus/web... build` (builds
     `@nexahaus/types` + `@nexahaus/validation` first, then the app)
   - Output: `.next`

## 2. Environment variables (Production + Preview)

```
API_ORIGIN=https://<your-api-host>        # the deployed NestJS API origin, no trailing slash
NEXT_TELEMETRY_DISABLED=1
```

`apps/web/next.config.mjs` rewrites `/api/:path*` → `${API_ORIGIN}/api/:path*`, so the
browser talks only to the Vercel domain and the HttpOnly refresh cookie stays first-party.
The web app holds no secrets — the access token lives in memory, the refresh token in the
proxied cookie.

## 3. Point the API back at the web origin

On the **API** host, set:

```
APP_URL=https://<your-vercel-domain>
```

so CORS (`cors.origin: [APP_URL]` in `apps/api/src/main.ts`) allows the web app. Redeploy
the API. Add your custom domain in Vercel → **Domains**, then update `APP_URL` to it.

## 4. Deploy & verify

Push to the tracked branch (or **Deploy** in the UI). Then:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://<your-vercel-domain>/         # 200
curl -fsS https://<your-vercel-domain>/api/v1/health                             # proxied -> {"status":"ok"}
```

Open the site, sign in, load the owner dashboard.

## Netlify equivalent

If you use Netlify instead: **Base directory** `apps/web`, **Build command**
`cd ../.. && pnpm --filter @nexahaus/web... build`, **Publish directory**
`apps/web/.next`, add the official **@netlify/plugin-nextjs**, and set the same
`API_ORIGIN` env var. Everything else (API, worker, DB, Redis, storage) is identical to
the table in the answer above.

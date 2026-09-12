# Runbook: Deploy the web app to Vercel

**Scope: `apps/web` only.** Vercel/Netlify run functions, not long-lived processes, so the
NestJS API, the BullMQ worker, Postgres and Redis are hosted elsewhere (see
[deploy-railway.md](deploy-railway.md) for the API + worker; Neon/Supabase for Postgres,
Upstash for Redis). Pick Vercel **or** Netlify, not both.

Config: [`apps/web/vercel.json`](../../apps/web/vercel.json).

---

## 0. Prerequisites

- [ ] The API already deployed and reachable at a public HTTPS URL.
- [ ] `pnpm-lock.yaml` **not required** — the config uses
      `pnpm install --no-frozen-lockfile`. Commit a real lockfile later (run
      `pnpm install` once with Node 20 + pnpm 9) and drop `--no-frozen-lockfile`
      for reproducible builds.

## 1. Import the project

1. Vercel → **Add New… → Project** → import this repo.
2. **Settings → General → Root Directory → `apps/web`** → Save. This is required: Vercel
   detects Next.js from `apps/web/package.json` and reads `apps/web/vercel.json`. Without
   it, Vercel builds from the repo root with `npm` and the pnpm workspace never links
   (the `Cannot find module 'zod'` / `BigInt` / `base.json not found` errors).
3. Framework preset: **Next.js** (auto). Leave Build/Install/Output **blank** —
   `apps/web/vercel.json` sets them:

   - Install: `npx --yes pnpm@9.12.0 install --no-frozen-lockfile --filter=@nexahaus/web...`
     — runs pnpm 9 directly (Vercel's bundled pnpm is v6, and Corepack does not reliably
     win the PATH inside the build step), installing only the web app +
     `@nexahaus/types` / `@nexahaus/validation`.
   - Build: `npx --yes pnpm@9.12.0 --filter=@nexahaus/web... build` (builds those two
     workspace packages, then `next build`)
   - Output: `.next` (auto, since Root Directory is `apps/web`)

   > `.npmrc` sets `engine-strict=false` so a build host whose Node/pnpm doesn't exactly
   > match `engines` warns instead of failing with `ERR_PNPM_UNSUPPORTED_ENGINE`.
   >
   > A repo-root `vercel.json` with the same commands + `outputDirectory:
apps/web/.next` is committed as a fallback for the Root-Directory-not-set case, but
   > setting Root Directory to `apps/web` is the reliable path.
   >
   > Optional: add project env var `ENABLE_EXPERIMENTAL_COREPACK=1` to make Vercel's own
   > tooling honour `packageManager: pnpm@9.12.0` too.

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

If you use Netlify instead:

- **Base directory:** `apps/web`
- **Build command:** `corepack enable && pnpm --filter=@nexahaus/web... build`
- **Publish directory:** `apps/web/.next`
- Add the official **@netlify/plugin-nextjs**.
- Environment: `NPM_FLAGS=--version` and `NETLIFY_USE_PNPM=true` (or set
  `PNPM_FLAGS=--no-frozen-lockfile`); Netlify runs `pnpm install` from the repo root when
  it sees `pnpm-workspace.yaml`. Set the same `API_ORIGIN` var.

Everything else (API, worker, DB, Redis, storage) is identical to the table in the answer
above. Use Vercel **or** Netlify, not both.

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

### Marketing site vars

Everything below is `NEXT_PUBLIC_*` (readable in the browser; inlined at build time — a
Preview vs Production value requires a **redeploy**, not just an env var change). All have
safe defaults and the UI hides itself rather than showing a placeholder, so none of these
are required to deploy — set only what's official. Full reference with defaults:
[`.env.example`](../../.env.example).

```
NEXT_PUBLIC_SITE_URL=https://www.nexahaus.com   # canonical origin: metadata, canonical URLs, sitemap
NEXT_PUBLIC_PRE_LAUNCH_MODE=true                # true = "Launching in Accra December 2027" messaging
NEXT_PUBLIC_LAUNCH_DATE=2027-12-01
NEXT_PUBLIC_LAUNCH_CITY=Accra
NEXT_PUBLIC_LAUNCH_LABEL=December 2027
NEXT_PUBLIC_CLIENT_PORTAL_URL=/login            # point at the Connect app in prod, e.g. https://app.nexahaus.com
NEXT_PUBLIC_API_BASE=/api/v1/public
NEXT_PUBLIC_ALLOW_INDEXING=true                 # set false on staging/preview to block all crawlers
NEXT_PUBLIC_WHATSAPP_NUMBER=                    # E.164 without "+"; blank hides the chat button
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_CONTACT_ADDRESS=
NEXT_PUBLIC_CONTACT_CITY=Accra
NEXT_PUBLIC_CONTACT_COUNTRY=Ghana
NEXT_PUBLIC_SOCIAL_LINKEDIN=
NEXT_PUBLIC_SOCIAL_INSTAGRAM=
NEXT_PUBLIC_SOCIAL_FACEBOOK=
NEXT_PUBLIC_SOCIAL_TIKTOK=
NEXT_PUBLIC_SOCIAL_YOUTUBE=
NEXT_PUBLIC_ANALYTICS_PROVIDER=noop             # noop (default) or posthog; no IDs hard-coded
NEXT_PUBLIC_ANALYTICS_KEY=
NEXT_PUBLIC_ANALYTICS_HOST=
NEXT_PUBLIC_HERO_IMAGE=                         # root-relative or absolute URL; blank = design fallback
NEXT_PUBLIC_HERO_IMAGE_ALT=A contemporary residential property in Accra, Ghana
NEXT_PUBLIC_OG_IMAGE=
```

Important: **never invent a value** for the contact/social/WhatsApp vars to make the UI look
more complete — an empty value intentionally hides that element until the real detail is
official (see the `.env.example` comments). Setting `NEXT_PUBLIC_ALLOW_INDEXING=false` on
Preview deployments is recommended so unfinished pages don't get crawled.

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

Config: a repo-root [`netlify.toml`](../../netlify.toml) sets Base directory, Build command
and Publish directory for you (`base = "apps/web"`, the pnpm-filtered install + build, and
`.next`). **This file takes precedence over whatever Base directory / Build command /
Publish directory are set in the Netlify dashboard UI for the site** — if a Netlify site
for this repo was created before this file existed (or was pointed at the wrong directory,
e.g. `apps/mobile`), pushing this file to the deployed branch is what fixes it, not editing
the dashboard.

- Add the official **@netlify/plugin-nextjs** (declared in `netlify.toml`; Netlify should
  offer to install it automatically the first time it reads the file).
- Environment (set in the Netlify dashboard, not the toml — these are secrets): `API_ORIGIN`
  plus the `NEXT_PUBLIC_*` vars from §2 above.
- Only one deployment platform is authoritative at a time. If a Netlify site for this repo
  was previously built with a different Base directory (e.g. `apps/mobile`, from before
  `netlify.toml` existed — Expo/React Native has no web build story here, so a stray site
  configured that way was a mistake, not an alternate deploy target), trigger a fresh deploy
  after this file lands; the toml's settings should override the stale ones.

Everything else (API, worker, DB, Redis, storage) is identical to the table in the answer
above. Use Vercel **or** Netlify, not both.

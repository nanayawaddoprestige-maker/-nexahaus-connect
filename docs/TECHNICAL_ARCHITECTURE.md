# NexaHaus Marketing Site — Technical Architecture

_Companion to `docs/ARCHITECTURE.md` (whole system). Scope here: the public
marketing surface in `apps/web`._

Last updated: 2026-09-09

---

## 1. Stack

- **Next.js 14** (App Router) in `apps/web`, React 18, TypeScript (strict,
  `noUncheckedIndexedAccess`), Tailwind CSS 3.
- Shared workspace packages: `@nexahaus/types`, `@nexahaus/validation` (Zod),
  `@nexahaus/config` (server env schema).
- Marketing pages are **server components + static generation**. Client
  components are limited to: nav/menu, cookie banner, analytics bootstrap,
  interactive tools (health check, rescue, survey), reveal-on-scroll, CTA click
  tracking.
- No UI framework beyond Tailwind + a few local primitives. No animation library
  (`Reveal` uses `IntersectionObserver` + CSS). `recharts` is already a
  dependency and is reused for illustrative dashboards where a chart is needed.

## 2. Routing

```
apps/web/src/app/
  layout.tsx                 root: fonts, metadataBase, title template, skip link
  opengraph-image.tsx        generated default OG image
  icon.svg                   favicon
  robots.ts  sitemap.ts      SEO endpoints
  not-found.tsx  error.tsx   404 / 500
  (marketing)/               PUBLIC SITE — new premium chrome
    layout.tsx               Navbar + footer + analytics + cookie + JSON-LD
    page.tsx                 homepage
    _home/*                  homepage sections (colocated, non-routable)
    _service/ServicePage.tsx shared service-page shell (interim)
    property-management/ asset-management/ diaspora/ property-rescue/
    property-health-check/ about/ contact/ early-access/ founding-100/
    property-owner-survey/ property-owners-club/ nexahaus-connect/
    the-ghana-property-owner-report/ insights/ privacy/ terms/ cookies/
    welcome/                 308 → /
  (owner)/ tenant/ vendor/ admin/ login/    NexaHaus Connect portal + CRM (unchanged)
```

Route groups keep the marketing chrome and the portal chrome separate while both
are served from one app. **Constraint:** a path may exist in only one group —
the portal's Property Rescue was moved from `/property-rescue` to `/rescue` so the
public `/property-rescue` page could take the canonical URL. When the portal
moves to its own origin (`NEXT_PUBLIC_CLIENT_PORTAL_URL`, e.g.
`app.nexahaus.com`) these constraints disappear.

Legacy redirects live in `next.config.mjs` `redirects()`.

## 3. Configuration

`src/lib/site-config.ts` is the single client-readable config module. All values
come from `NEXT_PUBLIC_*` env with production-safe defaults; nothing about
NexaHaus is hard-coded to an unverified value.

Key vars (see repo-root `.env.example`, "Marketing web app" block):

| Var                                                 | Default                                  | Purpose                                       |
| --------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                              | `https://www.nexahaus.com`               | canonical origin                              |
| `NEXT_PUBLIC_PRE_LAUNCH_MODE`                       | `true`                                   | pre/post-launch messaging                     |
| `NEXT_PUBLIC_LAUNCH_DATE` / `_CITY` / `_LABEL`      | `2027-12-01` / `Accra` / `December 2027` | launch badge / countdown                      |
| `NEXT_PUBLIC_CLIENT_PORTAL_URL`                     | `/login`                                 | "Client Login" target                         |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`                       | _(empty)_                                | floating WhatsApp CTA (hidden if unset)       |
| `NEXT_PUBLIC_CONTACT_*`                             | _(empty)_                                | contact details (placeholders until official) |
| `NEXT_PUBLIC_SOCIAL_*`                              | _(empty)_                                | social links (hidden if unset)                |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` / `_KEY` / `_HOST` | `noop`                                   | analytics abstraction                         |
| `NEXT_PUBLIC_ALLOW_INDEXING`                        | `true`                                   | master robots switch                          |
| `NEXT_PUBLIC_HERO_IMAGE` / `_ALT`                   | _(empty)_                                | optional hero photography                     |

Server-side (`API_ORIGIN`, secrets, DB) are unchanged and documented in
`docs/ARCHITECTURE.md`.

## 4. Data & forms

```
Client form ──validate (Zod, shared)──▶ POST /api/v1/public/*  (NestJS modules/public)
     │                                        │
     ├─ honeypot + first-touch UTM             ├─ Zod validate + throttle (5/min/IP)
     │  (sessionStorage → hidden fields)       ├─ record consent (exact wording)
     │                                        ├─ create/update CRM Lead (+ source, campaign, utm)
     └─ analytics events (post-consent)        └─ confirmation email via EMAIL_PROVIDER adapter
```

Existing endpoints: `property-health-check`, `early-access`, `surveys/:key`,
`surveys/:key/respond`. Phase 3 adds `contact` and `property-rescue` schemas
(`packages/validation/src/crm.ts`) + controller/service methods following the
same throttled, consent-recording pattern.

Lead fields / statuses: `docs/PRODUCT_REQUIREMENTS.md` and brief §25.

## 5. Analytics, attribution, consent

- `src/lib/analytics.ts` — provider abstraction (`noop` default, `posthog`
  adapter stub). Closed set of event names. No IDs in code.
- `src/lib/utm.ts` — first-touch capture of `utm_*` + click ids + referrer +
  landing path into `sessionStorage`; `attributionFields()` feeds hidden form
  inputs. Never written to a URL.
- `src/lib/consent.ts` + `CookieBanner` — three categories (necessary always on).
  Analytics init is gated on `consentGranted("analytics")`; the banner only
  appears when a provider is configured.
- `AnalyticsProvider` (in `(marketing)/layout.tsx`) wires it together and emits
  `page_view` on client navigations.

## 6. Performance budget

- Marketing route JS (excl. framework): keep first-load ≤ ~110 kB gzip.
- Fonts: 2 families (Inter, Fraunces), self-hosted via `next/font`, `display:swap`.
- Images: `next/image`, AVIF/WebP, explicit `sizes`, lazy except the hero.
- No blocking third-party scripts. Analytics loads post-consent, async.
- Static generation for all `(marketing)` routes; `opengraph-image` on the edge
  runtime.
- Target: LCP < 2.5s, INP < 200ms, CLS < 0.1 on a mid-range mobile / 4G.

## 7. Security

- Headers in `next.config.mjs` (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`). **TODO (QA):** add a `Content-Security-Policy`
  once the analytics provider (if any) is chosen, plus `frame-ancestors 'none'`.
- All form handling is server-validated in NestJS; the client never holds a
  secret. Rate limiting + honeypot on every public endpoint. Optional CAPTCHA
  provider is an abstraction, off by default.
- Lead data is never rendered publicly and never exposed by a marketing route.

## 8. Known infrastructure debt (fix in QA / Phase 7)

1. **`next lint` broken repo-wide** — ESLint 9 + `eslint-config-next@14.2.13` +
   canary `eslint-plugin-react-hooks` (uses removed ESLint 8 APIs). Options:
   migrate to flat config with compatible plugin versions, or pin ESLint 8.
2. **`@types/react` was duplicated** (18.2.79 vs 18.3.10) causing `tsc` failures
   in every layout. Fixed via `pnpm.overrides` in the root `package.json`. Verify
   `apps/mobile` still typechecks when it is next touched.
3. Shared packages must be built (`pnpm --filter @nexahaus/types build`, same for
   `validation`) before `apps/web` builds off the compiled entry. `pnpm build`
   (turbo) handles ordering; a bare `next build` does not.
4. `opengraph-image` uses a system font; add a brand display font file for
   `next/og`.

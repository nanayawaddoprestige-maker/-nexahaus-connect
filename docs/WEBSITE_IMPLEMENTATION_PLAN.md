# NexaHaus Marketing Site — Implementation Plan

_Scope: `apps/web/src/app/(marketing)` and its supporting `lib` / `components` /
`content`. The platform plan is `docs/IMPLEMENTATION_PLAN.md` (Phases 0–10,
largely complete) and is not superseded._

Last updated: 2026-09-09 · Branch: `feat/marketing-site`

---

## Guardrails (every phase)

- Keep the site production-ready. `tsc` clean; `next build` green (bar the known
  Windows-only `output:"standalone"` symlink step — see
  `docs/TECHNICAL_ARCHITECTURE.md` §8). `next lint` and `format:check` are
  fixed repo-wide as of Phase 7.
- No fabricated facts. Configurable placeholders / "Coming Soon" / launch
  messaging where a real value is missing. Illustrative UI always labelled.
- Reuse existing tokens, `BrandMark`, `ScoreRing`, UI primitives and the NestJS
  `modules/public` endpoints. Do not disturb the portal / admin / API.
- Accessibility, responsiveness and performance are done per-page, not deferred
  wholesale — Phase 7 is a sweep, not the first pass.

---

## Phase 1 — Foundation ✅ _this pass_

- [x] `feat/marketing-site` branch off `master`.
- [x] Repo assessment + architecture / design / page-map / component / data / SEO
      plan (in the session brief response) and 5 docs: `WEBSITE_PRD`,
      `BRAND_GUIDELINES`, `SEO`, `CONTENT_ARCHITECTURE`, `TECHNICAL_ARCHITECTURE`,
      plus this plan.
- [x] `src/lib/site-config.ts` — env-driven single source (domain, launch,
      `PRE_LAUNCH_MODE`, portal URL, WhatsApp, contact, social, analytics, media,
      indexing). `.env.example` "Marketing web app" block added.
- [x] `src/lib/routes.ts` — routes, primary nav, CTA hierarchy, footer nav,
      sitemap route list.
- [x] Route restructure: `(public)` → `(marketing)`; `/` is now the homepage
      (client auth-redirect removed); `git mv health-check → property-health-check`,
      `property-rescue-service → property-rescue`; portal `(owner)/property-rescue`
      → `(owner)/rescue` to free the canonical public URL; `resources` removed.
      Legacy redirects in `next.config.mjs`.
- [x] Design system: Tailwind display scale + `font-display` + `max-w-content` +
      subtle keyframes; `globals.css` `.nx-container` / `.nx-eyebrow` /
      `.nx-display` / `.nx-prose` / skip-link / reduced-motion. `next/font`
      (Inter + Fraunces) via `src/lib/fonts.ts`; root layout updated
      (`metadataBase`, title template, skip link, theme colour).
- [x] Marketing components: `primitives` (Container/Section/Eyebrow/SectionHeader/
      Card/Stat), `cta`, `navbar` + `mobile-menu` (focus-trapped) +
      `client-login-link`, `site-footer`, `social-links` (hidden when unset),
      `launch-badge`, `flow-steps`, `breadcrumbs` (+ JSON-LD), `reveal`
      (IntersectionObserver, reduced-motion aware), `whatsapp-button` (hidden
      when unset), `coming-soon`, `jsonld` (Organization / WebSite / Service /
      Breadcrumb / Article), `analytics-provider`, `cookie-banner`.
- [x] `(marketing)/layout.tsx` — new chrome + Org/WebSite JSON-LD + analytics +
      cookie banner + WhatsApp.
- [x] Homepage core: Hero (with designed illustrative panel fallback), Trust
      strip, Problem, Services, Final CTA. Copy in `_home/content.ts`.
- [x] SEO infra: `src/lib/seo.ts` `buildMetadata()`, `app/robots.ts`,
      `app/sitemap.ts`, `app/opengraph-image.tsx` (edge), `app/icon.svg`.
- [x] Analytics + attribution + consent: `lib/analytics.ts` (provider
      abstraction, closed event list), `lib/utm.ts` (first-touch, sessionStorage),
      `lib/consent.ts` + banner (3 categories, necessary-only default).
- [x] `not-found.tsx` (404) + `error.tsx` (500).
- [x] Placeholder pages (clearly labelled): `/insights`, `/nexahaus-connect`,
      `/founding-100`, `/property-owner-survey`, `/property-owners-club`,
      `/the-ghana-property-owner-report`. Real `/cookies` policy page.
- [x] Repo hygiene: `pnpm.overrides` to dedupe `@types/react` (fixes pre-existing
      `tsc` failures); one pre-existing `noUncheckedIndexedAccess` bug in
      `admin/leads/[id]` fixed.

**Deferred out of Phase 1:** remaining homepage sections; full service pages;
interactive tools; Insights; Connect preview; per-page structured data beyond
Org/WebSite; email templates; CSP; a11y/perf sweep.

---

## Phase 2 — Core pages ✅ _this pass_

- [x] Homepage completed: Diaspora, NexaHaus Connect dashboard preview
      (`connect-preview/portfolio-panel`), Property Rescue, Property Health
      (animated `health-gauge`), How It Works, Transparency, Why NexaHaus, Early
      Access + Founding 100, Insights teaser, FAQ (`faq-accordion` + FAQPage
      JSON-LD). Section copy in `_home/content.ts`.
- [x] Rebuilt `/property-management` ("What We Manage" + property types),
      `/asset-management` (PM-vs-AM + `performance-panel`), `/diaspora`
      ("What You Can See" + pain points + flow), `/property-rescue` (marketing
      narrative; interactive stepper still Phase 3), `/about` (mission / vision /
      8 values / master brand statement), `/contact` (real form).
- [x] `src/content/faq.ts` + topic-filtered FAQ blocks on service pages;
      `ServiceJsonLd` on every service/audience page via `ServiceHero`.
- [x] Shared building blocks: `service-hero`, `feature-list` (`FeatureList` /
      `CheckList`), `cta-band`, `insight-card`, `health-gauge`,
      `connect-preview/{portfolio,performance}-panel`.
- [x] Forms foundation: `lib/form-options.ts`, `lib/submit-public.ts`
      (envelope + attribution + 429 handling), `components/forms/fields.tsx`
      (accessible Field / TextInput / SelectInput / TextArea / ConsentCheckbox /
      Honeypot / FormError), `components/forms/contact-form.tsx`.
- [x] **Pulled forward from Phase 3:** `contactEnquirySchema` +
      `attributionSchema` in `packages/validation/src/crm.ts`;
      `POST /api/v1/public/contact` in `apps/api` `modules/public` (upsert
      lead + NOTE activity + consent + audit; `upsertLead` extended with
      `serviceInterest` / `biggestChallenge`). API `tsc` for `modules/public`
      is clean; pre-existing
      `vendors/*` + test `tsc` errors remain (stale `prisma generate`).
- [x] Retired `_service/ServicePage`.

## Phase 3 — Lead-generation tools ✅ _this pass_

- [x] Multi-step form framework: `components/forms/steps.tsx` (`useSteps`,
      `StepProgress` numbered rail, `StepPanel` with focus management, `StepNav`),
      `choice.tsx` (`ChoiceGroup` / `YesNo` / `MultiChoice` pill controls),
      `score-result.tsx` (shared outcome screen with gauge + breakdown).
- [x] `/property-health-check` — rebuilt in place as a 6-step premium
      questionnaire → server-scored indicative result → `ScoreResult`. Richer
      lead data (rentCollection, maintenanceHandler, biggestChallenge,
      serviceInterest). `/health-check` redirect kept.
- [x] `/property-rescue` — 6-step interactive diagnostic added to the page
      (`#assess`) → `POST /api/v1/public/property-rescue` (new) → score + ranked
      findings via `ScoreResult`. New `property-rescue.util.ts` scorer.
- [x] `/property-owner-survey` — 5-step research survey (About You / Your
      Properties / Your Challenges / What You Need / Contact) →
      `POST /api/v1/public/property-owner-survey` (new; upsert lead + NOTE with
      full answers — no `Survey` row needed).
- [x] `/early-access` + `/founding-100` — rebuilt as real pages sharing
      `early-access-form.tsx`; programme pre-selects from `?programme=`,
      Founding 100 locks the campaign.
- [x] API: `propertyRescueSchema`, `propertyOwnerSurveySchema`,
      `attributionSchema` hoisted; `attribution` + richer fields added to
      `propertyHealthCheckSchema` / `earlyAccessSchema` and persisted in
      `public.service.ts` (consent-record evidence + lead fields). New controller
      routes. Health-check lead `source` corrected `PROPERTY_RESCUE` → `WEBSITE`.
- [x] Analytics: `form_started` / `form_completed` + `health_check_completed` /
      `property_rescue_requested` / `survey_completed` / `early_access_joined`
      wired into every flow. Honeypot on every form.
- [x] `(marketing)` no longer mounts the auth probe: `auth-context.tsx` now
      skips `api.refresh()` unless the path is under a known portal prefix.

**Resolved:** `apps/api/prisma/schema.prisma` used `/** */` block comments, which
Prisma's schema language doesn't parse (only `///` / `//`); fixing that surfaced a
handful of further pre-existing drift between the schema and the service layer
(non-existent relation includes, a readonly-array filter, an OpenTelemetry API
mismatch, a Jest module-resolution gap for `packages/*`'s `.js`-suffixed
specifiers). All fixed — `prisma generate`, `tsc --noEmit` and `pnpm test` are
green on `apps/api`. See the "Fix Prisma schema parse error…" commit for the
full list. Frontend `next build` was unaffected throughout (web imports only the
built `@nexahaus/validation` / `@nexahaus/types`).

## Phase 4 — NexaHaus Connect preview ✅ _this pass_

- [x] `components/connect-preview/*` — six responsive illustrative screens, each
      wrapped in `ConnectFrame` (window chrome + `ModuleRail` + visible
      "Illustrative interface" marker): `dashboard-panel`, `property-detail-panel`,
      `statement-panel` (owner statement, reconcilable lines), `maintenance-panel`
      (report → completion + approval threshold), `inspection-panel` (area
      ratings + photo placeholders), `health-panel` (8-category breakdown).
      Realistic fictional data only. Kept the Phase-2 `portfolio-panel` /
      `performance-panel` for the homepage / asset-management page.
- [x] `showcase.tsx` — client tabbed tour (Dashboard / Property / Finance /
      Maintenance / Inspections / Property Health); emits `connect_preview_viewed`
      once on view.
- [x] `/nexahaus-connect` full page: ServiceHero + `Service` JSON-LD, the
      interactive showcase (`#preview`), 11-feature grid, modules grid, a
      "private by default" data section linking the Privacy Policy, an access
      band (Join Early Access + Client Login), closing CTA band.

## Phase 5 — Insights ✅ _this pass_

- [x] `src/content/insights.ts` filled with 5 education-first articles (no
      fabricated statistics, clients or case studies) across Property
      Management, Asset Management, Diaspora, Maintenance and Ghana Property
      Market. `getInsight` now also computes `readingMinutes` (previously only
      `stripBody()`'d list views did, so the detail page silently omitted it).
- [x] `/insights` listing rebuilt: hero, category filter chips (`?category=`,
      server-rendered, no client JS), Featured grid, full grid.
- [x] `/insights/[slug]` template: hero (breadcrumb, category, title, byline,
      date, reading time), `InsightBlock` renderer (p/h2/h3/ul/quote/callout),
      `ArticleShare` (WhatsApp/LinkedIn/X intents + copy link — same
      no-SDK pattern as `WhatsAppButton`), related articles, `ArticleJsonLd`,
      closing `CtaBand`. `generateStaticParams` prerenders every slug.
- [x] Homepage `InsightsTeaser` and `sitemap.ts` needed no changes — both
      already consumed `getFeaturedInsights` / `getAllInsightSlugs`.

**Scope note:** no ISR config added — articles are file-based content that
only changes on deploy, so `generateStaticParams` (full static generation) is
sufficient; there is no revalidation need until Insights moves to a CMS/API
(the seam `getInsight`/`getAllInsights`/etc. already exists for that move).

## Phase 6 — SEO / analytics / email ✅ _this pass_

Started with an audit (not a guess) of what Phases 1–4 had already wired vs.
what was actually missing, since a lot of this was assumed to be greenfield
and wasn't.

- [x] **Structured data**: already ~90% done from earlier phases (Organization
      /WebSite globally, Service on every service page, FAQ on FAQ pages,
      Article on insight pages, Breadcrumb everywhere `<Breadcrumbs>` is
      used). Fixed the two real gaps found: `privacy` and `terms` had a bare
      `{ title }` `Metadata` object with no canonical/OG/robots wiring at
      all — both now use `buildMetadata()` like every other page.
- [x] **OG images**: found and fixed a bug bigger than the plan item itself —
      the shared default OG image has been 500ing at request time since
      Phase 1 (Satori requires `display:"flex"` on any element with more
      than one child; the footer line mixed a JSX expression with a text
      node and had no `display` at all). Every page's social-share preview
      was broken. Fixed, then added real per-page OG images (`lib/og-image.tsx` + 7 per-route `opengraph-image.tsx` files) for the highest-traffic
      pages per `sitemap.ts`'s own `HIGH_PRIORITY` set, plus Insights.
- [x] **UTM → CRM lead mapping**: browser capture → form submission → API
      validation was already complete; the missing link was persistence —
      `Lead` only had `campaign` (from `utm_campaign` alone), so the rest of
      the attribution set was buried in a per-submission `ConsentRecord`
      JSON blob, not queryable from the Lead itself. Added
      `utmSource/utmMedium/utmContent/utmTerm/clickId/landingPath/referrer`
      columns to `Lead`, populated at creation (first-touch: never
      overwritten by a later submission) from all 5 public endpoints.
- [x] **Confirmation emails**: none of the 5 public endpoints sent one, even
      though the `EmailAdapter` interface already existed. Built 5 branded
      HTML+text templates (`public-email-templates.ts`) and wired
      `PublicService` to send one after each transaction commits
      (best-effort — a failed send is logged, never fails the request).
- [ ] **Analytics event audit**: verified every declared `AnalyticsEvent` is
      actually fired from a real CTA/form (including `assessment_requested`,
      which an initial grep for `track(` missed — it's set via a JSX `event=`
      prop in `service-hero.tsx`, `hero.tsx`, `final-cta.tsx`, `health.tsx`).
      No dead events found; nothing to wire.

**Deliberately not done — matches an existing, deliberate pattern, not a gap:**
Real analytics (PostHog) and real email delivery (SES/SendGrid/Postmark) both
still resolve to their console/noop adapters regardless of the configured
`*_PROVIDER` env var. This mirrors the exact same, already-existing pattern
for SMS/WhatsApp/Push across the whole `NotificationsModule` — every channel
has a real interface and a working console fallback, with a real third-party
transport deferred until an actual provider account exists, per the standing
instruction not to invent external credentials. `lib/analytics.ts`'s PostHog
adapter is real code with an intentionally empty `init()` (comment: "until
posthog-js is added") — wiring it is one dependency + one env var away
whenever a project key exists.

## Phase 7 — QA

- [x] **`next lint` fixed repo-wide** (flat-config migration). Two separate
      root causes, both resolved:
  - `next lint` (bundled with `next@14.2.13`) still invokes ESLint with
    removed legacy `CLIEngine` options and fails outright under ESLint 9 —
    `apps/web`'s `lint` script now calls `eslint .` directly against a real
    flat config (`apps/web/eslint.config.mjs`), bridging the legacy
    `eslint-config-next@14` shareable config via `@eslint/eslintrc`'s
    `FlatCompat` (the Next-documented approach for this exact combination).
  - Two of `eslint-config-next`'s own bundled plugins call ESLint APIs
    removed in v9 (`context.getScope`, `context.getAncestors`):
    `eslint-plugin-react-hooks` was pinned to an old pre-release canary by
    `eslint-config-next`'s peer range, and `@next/eslint-plugin-next` hadn't
    been patched in the 14.2.x line. Overrode both via `pnpm.overrides` in
    the root `package.json` to real stable releases
    (`eslint-plugin-react-hooks@5.1.0`; a patch bump within Next's own 15.x
    line for the lint plugin only — its rules are static AST checks, not
    coupled to the Next 14 runtime).
- [x] Fixed the shared `eqeqeq` rule (`packages/eslint-config/index.js`): it
      had no `{ null: "ignore" }` exception, so every idiomatic `== null` /
      `!= null` check across `apps/api` and `apps/web` (the correct,
      one-line way to catch both `null` and `undefined`) was flagged as an
      error.
- [x] Fixed ~25 small, genuine, pre-existing lint findings across both apps
      and `apps/mobile` — unused imports/params, unnecessary type
      assertions, an unsafe-`any` BullMQ event handler, an enum/number type
      mismatch in `http-exception.filter.ts`, and one dead `rentCharge`
      query in `reports.service.ts` (confirmed dead, not a missing metric —
      the report's own `notes` field documents actual, not billed, income).
      `pnpm lint` now passes clean, repo-wide, matching exactly what CI's
      `static` job runs.
- [x] **`pnpm format:check` fixed repo-wide.** Found while fixing the
      `next lint` issue above (an independent problem, not previously
      listed under "Known blockers"): most of the pre-existing codebase
      didn't match the repo's own Prettier config. Applied
      `prettier --write` across the whole repo as its own isolated commit —
      zero logic changes, every diff spot-checked as line-wrapping/
      quote-style only. `pnpm lint`, `typecheck`, `test` and `next build`
      all still green; `format:check` now passes clean, matching CI's
      `static` job.
- [ ] WCAG 2.2 AA sweep (axe + manual keyboard / SR).
- [ ] Responsive verification at 320 / 375 / 390 / 768 / 1024 / 1280 / 1440 / 1920.
- [ ] Performance: Lighthouse / CWV against the budget; image + font audit.
- [ ] Security: add CSP (+ `frame-ancestors 'none'`); re-check headers; confirm no
      lead-data exposure.

## Phase 8 — Acceptance & deploy

- Walk the brief §68 checklist.
- Update deploy runbooks with the new `NEXT_PUBLIC_*` vars.
- `pnpm build` (turbo, full) green on a Linux target.

---

## Decision log

| #   | Decision                                                                                                     | Why                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | `/` is the marketing homepage; root auth-redirect removed; portal entry via "Client Login".                  | Brief page map + SEO; portal is destined for its own origin.                                                                                                      |
| W2  | Route group renamed `(public)` → `(marketing)`.                                                              | Matches brief; route groups don't affect URLs.                                                                                                                    |
| W3  | Portal `(owner)/property-rescue` → `(owner)/rescue`.                                                         | Next.js forbids the same path in two groups; the public canonical URL `/property-rescue` (brief §10) takes precedence. One nav line changed; API paths untouched. |
| W4  | Insights = typed file-based content layer now (`src/content/insights.ts`), CMS/API later behind 4 accessors. | Ships a real section fast; zero infra; clean swap seam. (User: "all the above".)                                                                                  |
| W5  | New public form endpoints extend `apps/api/modules/public` (Phase 3), not Next route handlers.               | Keeps every form server-validated, throttled, consent-recording, CRM-connected.                                                                                   |
| W6  | `pnpm.overrides` pin `@types/react` 18.3.10 / `@types/react-dom` 18.3.0.                                     | Two copies (18.2.79 vs 18.3.10) broke `tsc` in every layout, pre-existing.                                                                                        |
| W7  | Photography is optional/config-driven; designed non-photo fallback until licensed images exist.              | No stock imagery; brief §69 / §3.                                                                                                                                 |
| W8  | `opengraph-image` on the edge runtime.                                                                       | Supported target for `next/og`; node prerender throws "Invalid URL".                                                                                              |

## Known blockers / debt

- ~~`next lint` broken repo-wide (ESLint 9 vs `eslint-config-next@14` +
  canary `eslint-plugin-react-hooks`).~~ Fixed in Phase 7 (flat-config
  migration + plugin overrides) — see that section for the full breakdown.
- ~~`pnpm format:check` fails repo-wide.~~ Fixed in Phase 7 — a repo-wide
  `prettier --write`, committed on its own with no logic changes.
- `output:"standalone"` local build step fails on Windows (symlink EPERM); builds
  clean with `VERCEL=1` and on Linux hosts. Environmental only.
- Shared packages (`@nexahaus/types`, `@nexahaus/validation`) must be built
  before a bare `next build`; `pnpm build` (turbo) orders this automatically.

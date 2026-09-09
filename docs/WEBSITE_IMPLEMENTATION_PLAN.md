# NexaHaus Marketing Site — Implementation Plan

_Scope: `apps/web/src/app/(marketing)` and its supporting `lib` / `components` /
`content`. The platform plan is `docs/IMPLEMENTATION_PLAN.md` (Phases 0–10,
largely complete) and is not superseded._

Last updated: 2026-09-09 · Branch: `feat/marketing-site`

---

## Guardrails (every phase)

- Keep the site production-ready. `tsc` clean; `next build` green (bar the known
  Windows-only `output:"standalone"` symlink step and the repo-wide `next lint`
  breakage — see `docs/TECHNICAL_ARCHITECTURE.md` §8).
- No fabricated facts. Configurable placeholders / "Coming Soon" / launch
  messaging where a real value is missing. Illustrative UI always labelled.
- Reuse existing tokens, `BrandMark`, `ScoreRing`, UI primitives and the NestJS
  `modules/public` endpoints. Do not disturb the portal / admin / API.
- Accessibility, responsiveness and performance are done per-page, not deferred
  wholesale — Phase 7 is a sweep, not the first pass.

---

## Phase 1 — Foundation  ✅ _this pass_

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

## Phase 2 — Core pages

- Complete the homepage: Diaspora flow, NexaHaus Connect dashboard preview,
  Property Rescue, Property Health gauge, How It Works, Transparency, Why
  NexaHaus, Early Access, Founding 100, Insights teaser, FAQ.
- Rebuild `/property-management` (+ "What We Manage", property types),
  `/asset-management` (+ illustrative performance dashboard), `/diaspora`
  (+ "What You Can See"), `/property-rescue` (marketing narrative; interactive
  flow is Phase 3), `/about` (mission / vision / values), `/contact` (real form).
- `src/content/faq.ts` + `<FAQAccordion>`; `ServiceJsonLd` on service pages.
- Retire the interim `_service/ServicePage` shell.

## Phase 3 — Lead-generation tools

- `/property-health-check` — premium multi-step questionnaire → indicative score
  → lead capture (rebuild in place; keep `/health-check` redirect).
- `/property-rescue` — 6-step interactive diagnostic → preliminary score → lead.
- `/property-owner-survey` — 5-step research survey.
- `/early-access` + `/founding-100` — full forms with programme pre-select.
- `packages/validation` schemas + `apps/api` `modules/public` endpoints for
  `contact` and `property-rescue`; UTM + `leadSource` / `campaign` passthrough;
  `form_started` / `form_completed` + specific events; honeypot; success/error
  states.

## Phase 4 — NexaHaus Connect preview

- `/nexahaus-connect` full page.
- `components/connect-preview/*` — responsive illustrative dashboards (portfolio,
  property detail, maintenance, financial statement, inspection report, property
  health). Realistic fictional data, "Illustrative interface" labels.

## Phase 5 — Insights

- Fill `src/content/insights.ts` (4–5 education-first articles, no fabricated
  data). `/insights` listing (categories, featured), `/insights/[slug]` template
  (hero, meta, reading time, body renderer, related, lead CTA), `ArticleJsonLd`,
  share intents, ISR.

## Phase 6 — SEO / analytics / email

- Per-page structured data pass; per-page OG images where valuable.
- Wire analytics events end-to-end; verify UTM → CRM lead mapping (brief §25).
- Confirmation email templates (Early Access, Survey, Assessment, Rescue,
  Contact) in NexaHaus branding via the `EMAIL_PROVIDER` adapter.

## Phase 7 — QA

- WCAG 2.2 AA sweep (axe + manual keyboard / SR).
- Responsive verification at 320 / 375 / 390 / 768 / 1024 / 1280 / 1440 / 1920.
- Performance: Lighthouse / CWV against the budget; image + font audit.
- Security: add CSP (+ `frame-ancestors 'none'`); re-check headers; confirm no
  lead-data exposure.
- Fix `next lint` (flat-config migration or ESLint 8 pin) and re-enable in CI.

## Phase 8 — Acceptance & deploy

- Walk the brief §68 checklist.
- Update deploy runbooks with the new `NEXT_PUBLIC_*` vars.
- `pnpm build` (turbo, full) green on a Linux target.

---

## Decision log

| # | Decision | Why |
|---|---|---|
| W1 | `/` is the marketing homepage; root auth-redirect removed; portal entry via "Client Login". | Brief page map + SEO; portal is destined for its own origin. |
| W2 | Route group renamed `(public)` → `(marketing)`. | Matches brief; route groups don't affect URLs. |
| W3 | Portal `(owner)/property-rescue` → `(owner)/rescue`. | Next.js forbids the same path in two groups; the public canonical URL `/property-rescue` (brief §10) takes precedence. One nav line changed; API paths untouched. |
| W4 | Insights = typed file-based content layer now (`src/content/insights.ts`), CMS/API later behind 4 accessors. | Ships a real section fast; zero infra; clean swap seam. (User: "all the above".) |
| W5 | New public form endpoints extend `apps/api/modules/public` (Phase 3), not Next route handlers. | Keeps every form server-validated, throttled, consent-recording, CRM-connected. |
| W6 | `pnpm.overrides` pin `@types/react` 18.3.10 / `@types/react-dom` 18.3.0. | Two copies (18.2.79 vs 18.3.10) broke `tsc` in every layout, pre-existing. |
| W7 | Photography is optional/config-driven; designed non-photo fallback until licensed images exist. | No stock imagery; brief §69 / §3. |
| W8 | `opengraph-image` on the edge runtime. | Supported target for `next/og`; node prerender throws "Invalid URL". |

## Known blockers / debt

- `next lint` broken repo-wide (ESLint 9 vs `eslint-config-next@14` + canary
  `eslint-plugin-react-hooks`). Type checking via `tsc` is green. → Phase 7.
- `output:"standalone"` local build step fails on Windows (symlink EPERM); builds
  clean with `VERCEL=1` and on Linux hosts. Environmental only.
- Shared packages (`@nexahaus/types`, `@nexahaus/validation`) must be built
  before a bare `next build`; `pnpm build` (turbo) orders this automatically.

# NexaHaus Marketing Site — SEO

Last updated: 2026-09-09

---

## 1. Principles

- Build SEO in from the start; never keyword-stuff.
- One primary keyword theme per page, expressed naturally in the H1, the intro
  paragraph and (where present) the FAQ.
- Every indexable page has a **unique** title, meta description, canonical URL,
  Open Graph and Twitter card.
- Marketing pages are indexable. The client portal, admin/CRM and API are not.
- No structured data we cannot substantiate (no `aggregateRating`, no invented
  address, no review markup).

## 2. Implementation

| Concern | Where |
|---|---|
| Per-page metadata | `buildMetadata()` in `src/lib/seo.ts`, called from each page's `generateMetadata` / `metadata` export |
| Global defaults, title template, `metadataBase` | `src/app/layout.tsx` |
| Canonical | `alternates.canonical` set by `buildMetadata` from the page `path` |
| `robots.txt` | `src/app/robots.ts` — allow all, disallow `/api/`, `/admin/`, portal routes; `NEXT_PUBLIC_ALLOW_INDEXING=false` blocks everything (staging) |
| `sitemap.xml` | `src/app/sitemap.ts` — static routes from `src/lib/routes.ts` + published Insight slugs |
| Default OG image | `src/app/opengraph-image.tsx` (generated, 1200×630); per-page override via `buildMetadata({ image })` |
| Favicon | `src/app/icon.svg` |
| Structured data | `src/components/marketing/jsonld.tsx` |

### Structured data coverage

- **Organization** + **WebSite** — emitted site-wide from `(marketing)/layout.tsx`.
- **Service** — on each service page (`ServiceJsonLd`).
- **BreadcrumbList** — via the `<Breadcrumbs>` component (visible trail + JSON-LD).
- **Article** — on Insight detail pages (`ArticleJsonLd`), Phase 5.
- `LocalBusiness` — intentionally **not** emitted until a verified physical
  address exists.

## 3. Keyword map (primary theme per page)

| Page | Primary theme |
|---|---|
| `/` | property management Ghana / Accra |
| `/property-management` | property management services Ghana; rental property management Ghana |
| `/asset-management` | property asset management Ghana |
| `/diaspora` | diaspora property management Ghana; property management for diaspora Ghana |
| `/property-rescue` | underperforming rental property Ghana; property management review |
| `/property-health-check` | property assessment Ghana; property health check |
| `/nexahaus-connect` | property management software / platform Ghana |
| `/about` | property management company Accra |
| `/insights/*` | long-tail educational queries (per article) |
| `/contact` | property managers Ghana; property management company Accra |

Secondary terms to weave in where natural: property maintenance Ghana, property
investment Ghana, property management for landlords Ghana, property managers
Accra Ghana.

## 4. Content SEO rules

- H1 once per page, matches the page's intent.
- Descriptive, keyword-aware but human headings (H2/H3).
- Internal links between related service / education pages, using descriptive
  anchor text (not "click here").
- Image `alt` text describes the image and, where relevant, the context.
- Insight articles: title ≤ ~60 chars where possible, meta description
  150–160 chars, one clear primary query, a lead-gen CTA, related links.

## 5. Social / sharing

- OG + Twitter tags on every page (via `buildMetadata`).
- Insight pages (Phase 5/6) get share intents for LinkedIn, Facebook, WhatsApp
  and X, plus a per-article OG image.

## 6. Performance = SEO

Core Web Vitals are a ranking input. See `docs/PERFORMANCE.md` and the perf
budget in `docs/TECHNICAL_ARCHITECTURE.md`. Marketing pages are statically
generated; fonts are self-hosted; JS is minimal.

## 7. Known gaps / TODO

- `next lint` is currently broken repo-wide (ESLint 9 vs `eslint-config-next@14`
  + canary `eslint-plugin-react-hooks`). Fix in QA (flat-config migration or
  ESLint 8 pin). Does not affect runtime SEO.
- OG image font is system sans; swap to the brand display face once a static
  font file is added to the repo for `next/og`.
- Add `hreflang` only if/when localised routes are introduced.

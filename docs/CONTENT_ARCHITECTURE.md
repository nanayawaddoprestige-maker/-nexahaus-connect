# NexaHaus Marketing Site — Content Architecture

Last updated: 2026-09-09

---

## 1. Where content lives

| Content type                                     | Source (now)                                                        | Future                              |
| ------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------- |
| Page copy (home, services, about)                | Typed modules under `src/app/(marketing)/**/_*` and `src/content/*` | CMS entries; same shape             |
| Navigation, routes, CTAs                         | `src/lib/routes.ts`                                                 | unchanged                           |
| Site facts, launch status, URLs, contact, social | `src/lib/site-config.ts` (env-driven)                               | admin-editable settings             |
| Insights (articles)                              | `src/content/insights.ts` — typed `Insight[]`, currently empty      | CMS or `apps/api` `insights` module |
| FAQs                                             | `src/content/faq.ts` (Phase 2)                                      | CMS                                 |
| Legal (privacy / terms / cookies)                | Page components                                                     | CMS / legal review                  |
| Illustrative dashboard data                      | Colocated constants in preview components, labelled illustrative    | unchanged (never real data)         |

**Rule:** copy is data, not markup. Layout components take content as props so a
CMS swap is a change to four accessor functions, not to pages.

## 2. Insights model

`src/content/insights.ts` defines:

- `InsightCategory` — a closed list (Property Management, Ghana Property Market,
  Diaspora, Property Investment, Maintenance, Asset Management, Property
  Technology, Landlord Education, Tenant Management).
- `InsightMeta` — slug, title, description, category, author, `publishedAt`,
  `updatedAt?`, `readingMinutes?`, `heroImage?`, `heroAlt?`, `draft?`, `featured?`.
- `Insight` — `InsightMeta` + `body: InsightBlock[]` (`p` / `h2` / `h3` / `ul` /
  `quote` / `callout`). A structured body keeps rendering safe and portable; MDX
  can be layered later if authors need it.
- Accessors — `getAllInsights`, `getInsightsByCategory`, `getFeaturedInsights`,
  `getInsight`, `getRelatedInsights`, `getAllInsightSlugs`,
  `estimateReadingMinutes`. **These are the only integration seam.**

Publishing states: `draft` (excluded everywhere), published (default). Scheduling
= set `publishedAt` in the future and filter (add when needed). Archiving =
remove or add an `archived` flag.

Every article page (Phase 5) renders: title, category, author, publish date, hero
image, reading time, body, related articles, and a lead-generation CTA
("Own property in Ghana? Request a Property Assessment.").

## 3. Content mix (pre-launch, brief §35)

60% education · 20% market intelligence · 10% brand · 10% service promotion.

Seed article themes (education-first, no fabricated data):

- Signs a property is being poorly managed
- What to expect from a professional property manager in Ghana
- Why diaspora owners need regular inspections
- How preventive maintenance protects property value
- How to monitor rental performance
- Questions to ask before appointing a property manager
- How to reduce vacancy
- Why property documentation matters
- Understanding property operating costs
- How technology improves property management

## 4. Signature content

**The Ghana Property Owner Report** (`/the-ghana-property-owner-report`) — page
structure exists now; findings are published only when the primary research
(Property Owner Survey) produces real data. No placeholder statistics.

## 5. Governance

- No fabricated stats, testimonials, case studies, awards, partnerships, licence
  numbers, or contact details (see `docs/WEBSITE_PRD.md` §5).
- Case studies (`docs`-tracked structure only): Challenge / Property / Situation /
  Intervention / Actions / Results / Client quote / Photos / Metrics — populated
  **only** with verified, consented client information.
- Testimonials: component architecture only; section hidden until real, attributed
  testimonials exist.
- Illustrative UI always labelled; figures fictional but realistic.

## 6. Editorial voice

See `docs/BRAND_GUIDELINES.md` §10. Simple English, short paragraphs, strong
headlines, explain rather than assert, no hype words.

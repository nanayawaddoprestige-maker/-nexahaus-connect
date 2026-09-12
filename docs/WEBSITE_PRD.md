# NexaHaus Marketing Website — Product Requirements

_Scope: the public marketing site in `apps/web/src/app/(marketing)`. The client
portal (`(owner)`, `tenant`, `vendor`), the CRM/admin console (`admin`) and the
NestJS API (`apps/api`) are covered by `docs/PRODUCT_REQUIREMENTS.md` and are
consumed by, not replaced by, this work._

Last updated: 2026-09-09 · Owner: Web

---

## 1. Purpose

The marketing site is one asset that must simultaneously act as: corporate
website, brand platform, lead-generation engine, property-owner education
platform, diaspora acquisition channel, market-research instrument, and the entry
point to NexaHaus Connect.

Six objectives (from the brief):

1. **Build trust** — a property owner should immediately feel NexaHaus is
   professional, organised, transparent and capable of protecting their asset.
2. **Generate leads** — assessment requests, management enquiries, Property
   Rescue requests, diaspora / developer / corporate enquiries, early-access
   registrations.
3. **Educate** — become a credible property-management knowledge platform.
4. **Validate the market** — pre-launch research: survey, health check, early
   access, Founding 100, consultations.
5. **Introduce the technology** — present NexaHaus Connect and its modules.
6. **Establish a premium brand** — look capable of managing individual homes
   through to institutional portfolios.

## 2. Positioning

NexaHaus is **not** a property listing / sales business. Primary positioning:
**Property Management + Asset Management + Facilities & Maintenance + Property
Advisory + Technology.**

Central promise: _visibility, control, transparency and professional management of
your assets._ For diaspora owners: _own property in Ghana without the stress of
managing it from abroad._

## 3. Audiences

Property owners and landlords; investors and developers; commercial, apartment
and short-stay owners; busy professionals; the Ghanaian diaspora; corporate /
institutional owners. Initial geographic focus: Accra and Greater Accra;
long-term: all of Ghana.

## 4. Pre-launch reality

First physical office is planned for **December 2027**. Marketing begins before
then. Messaging frames this as momentum ("Building now. Launching in Accra
December 2027."), never as a credibility gap. Controlled by `PRE_LAUNCH_MODE`
(`NEXT_PUBLIC_PRE_LAUNCH_MODE`, default `true`); when flipped to `false` the site
switches to "now operating" language without removing any page.

## 5. Non-negotiable content rules (brief §33, §69)

Never fabricate: statistics, testimonials, client names, case studies, awards,
partnerships, regulatory licence numbers (REAC etc.), company registration
numbers, tax / insurance certificates, physical addresses, phone numbers, email
addresses, social media URLs, years in business, properties-managed counts,
headcount.

Where a real value is not yet available: use a configurable placeholder, a
clearly-labelled illustrative example, "Coming Soon", or the launch message.
Every illustrative dashboard figure carries an "Illustrative interface" label.

Regulated agency activities (e.g. leasing / brokerage) are described only as
"subject to applicable Ghanaian regulatory requirements" and "offered where
NexaHaus holds the required licensing and qualified personnel". No advice claims
(legal / valuation / tax / investment).

## 6. Page inventory

| Route                              | Purpose                                                     | Phase                   |
| ---------------------------------- | ----------------------------------------------------------- | ----------------------- |
| `/`                                | Homepage — full narrative, ~15 sections                     | 1 (core) → 2 (complete) |
| `/property-management`             | Service detail + "what we manage"                           | 2                       |
| `/asset-management`                | Service detail + illustrative performance dashboard         | 2 / 4                   |
| `/diaspora`                        | Diaspora acquisition, "what you can see"                    | 2                       |
| `/property-rescue`                 | Interactive 6-step diagnostic → preliminary score → lead    | 3                       |
| `/property-health-check`           | Premium interactive questionnaire → indicative score → lead | 3                       |
| `/nexahaus-connect`                | Product preview + illustrative dashboards                   | 4                       |
| `/about`                           | Mission, vision, values, why                                | 2                       |
| `/insights` + `/insights/[slug]`   | Editorial platform                                          | 5                       |
| `/contact`                         | Enquiry form                                                | 2                       |
| `/early-access`                    | Pre-launch research capture                                 | 3                       |
| `/founding-100`                    | Founding cohort                                             | 3                       |
| `/property-owner-survey`           | Multi-step market-research survey                           | 3                       |
| `/property-owners-club`            | Future community                                            | placeholder now         |
| `/the-ghana-property-owner-report` | Signature research (structure only)                         | placeholder now         |
| `/privacy`, `/terms`, `/cookies`   | Legal                                                       | 1–2                     |
| `not-found`, `error`               | 404 / 500                                                   | 1                       |

Redirects: `/welcome → /`, `/health-check → /property-health-check`,
`/property-rescue-service → /property-rescue`, `/resources → /insights`.

## 7. Navigation & CTAs

Header nav: Property Management · Asset Management · Diaspora · Property Rescue ·
About · Insights · Contact. Plus **Client Login** (→ `NEXT_PUBLIC_CLIENT_PORTAL_URL`)
and the primary CTA button.

CTA hierarchy (do not add competing CTAs): **Request Property Assessment**
(primary) → **Join Early Access** (secondary) → **Check Your Property Health**
(tertiary) → **Client Login**.

## 8. Lead & funnel model

Funnel: social → site → education → health check / survey → lead capture → CRM →
nurture → consultation → assessment → proposal → onboarding → client → Connect →
referral.

All forms are server-validated (NestJS `modules/public`), rate-limited, record
explicit consent with the exact wording shown, and attach first-touch campaign
attribution (`utm_*`, click ids, referrer, landing path) captured client-side in
`sessionStorage` — never in a URL. CRM lead fields and statuses per brief §25.

Tracked events (§26): `page_view`, `cta_clicked`, `form_started`,
`form_completed`, `assessment_requested`, `health_check_completed`,
`survey_completed`, `early_access_joined`, `property_rescue_requested`,
`contact_submitted`, `client_login_clicked`, `connect_preview_viewed`.

## 9. Non-functional requirements

- **Performance**: excellent Core Web Vitals. Static generation for all marketing
  pages; ISR for Insights. Minimal JS; no heavy libraries for simple effects.
  `next/font` self-hosted. Images via `next/image`, AVIF/WebP, lazy by default.
- **Accessibility**: WCAG 2.2 AA. Semantic landmarks, keyboard operability,
  visible focus, labelled forms, `prefers-reduced-motion`, no meaning by colour
  alone, alt text.
- **Responsive**: mobile-first; verified at 320 / 375 / 390 / 768 / 1024 / 1280 /
  1440 / 1920.
- **SEO**: unique title / description / canonical / OG / Twitter per page;
  `sitemap.xml`; `robots` (marketing indexable, portal/admin/api excluded);
  Schema.org Organization, WebSite, Service, Article, BreadcrumbList.
- **Security**: security headers / CSP, server-side validation, rate limiting,
  honeypot + optional CAPTCHA abstraction, no secrets in the client, secure
  cookies, no exposure of lead data.
- **Privacy**: designed against Ghana's Data Protection Act, 2012 (Act 843).
  Consent-gated analytics/marketing cookies; necessary-only by default.

## 10. Acceptance criteria

Tracked in `docs/IMPLEMENTATION_PLAN.md` against the brief §68 checklist. The site
is kept production-ready at the end of every phase.

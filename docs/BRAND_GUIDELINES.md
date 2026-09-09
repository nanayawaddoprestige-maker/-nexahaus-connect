# NexaHaus — Brand Guidelines (web)

_Applies to the marketing site. The client portal reuses the same tokens with a
denser, more utilitarian application._

Last updated: 2026-09-09

---

## 1. Brand in one line

NexaHaus Properties & Asset Management Ltd. — a modern, professional,
technology-enabled property and asset management company for Ghana.

**Tagline:** Managing Properties. Maximizing Assets.
**Product:** NexaHaus Connect.

## 2. Personality

Professional · trustworthy · transparent · intelligent · modern · calm ·
sophisticated · accountable · human · technology-enabled · performance-focused.

Reference set: private wealth management, premium real-estate advisory,
institutional asset management, luxury hospitality, enterprise SaaS — **not** a
typical real-estate agency.

## 3. Avoid

Cheap real-estate aesthetics · stock-photo-heavy layouts · excessive gold · loud
gradients · heavy animation · flashy startup design · "we are the best" language ·
unrealistic promises · fake stats / testimonials / awards / partnerships.

## 4. Colour

Navy is the principal corporate colour; gold is a restrained premium accent.
Tokens live in `apps/web/tailwind.config.ts`.

| Token | Hex | Use |
|---|---|---|
| `navy-900` | `#0a1f44` | Primary brand, dark sections, primary buttons, headings |
| `navy-800` | `#0f1f3d` | Primary button hover |
| `navy-700` | `#182d54` | Secondary text on light, links |
| `navy-50` | `#eef1f7` | Tint hovers |
| `gold-400` | `#c9a227` | Accent: eyebrow rule, status dot, CTA on navy |
| `gold-500/600` | `#a9871d` / `#856a16` | Accent text on light (AA contrast) |
| `ink` / `ink-muted` / `ink-subtle` | `#111827` / `#4b5563` / `#6b7280` | Body copy scale |
| `surface` / `surface-sunken` | `#ffffff` / `#f7f8fa` | Page and band backgrounds |
| `line` | `#e5e7eb` | Hairline borders |
| `positive` / `warning` / `critical` | `#0f766e` / `#b45309` / `#b91c1c` | Score bands, states |

Rules: never use gold for large fills or body text. Never communicate meaning by
colour alone — always pair with a label, icon or text. Health-score bands: < 60
critical, 60–79 warning, ≥ 80 positive (see `ui/score-ring.tsx`).

## 5. Typography

- **Body / UI:** Inter (`--font-sans`), self-hosted via `next/font`.
- **Display:** Fraunces (`--font-display`), optical-size axis, weights 400–600.
  Used only for large headings (`text-display-*`, `.nx-display`). Not for body,
  labels or anything below ~1.25rem.
- Editorial display scale is fluid/clamped: `display-2xl` (hero) →
  `display-md` (in-section). Tight tracking on display; normal on body.
- Long-form copy uses `.nx-prose` (max width ~68ch).
- Eyebrows: `.nx-eyebrow` — 12px, uppercase, 0.14em tracking, gold-600.

## 6. Layout & spacing

- Page width: `max-w-content` (1200px) via `.nx-container`, gutters
  `px-5 → sm:px-6 → lg:px-8`.
- Section rhythm: `py-16 sm:py-20 lg:py-24` (`<Section>`).
- Generous whitespace; strong hierarchy; hairline (`border-line`) not heavy
  borders. Radius: cards `rounded-xl`, pills `rounded-full`.
- Shadows: `shadow-card` default, `shadow-raised` on hover / overlays. No
  decorative drop shadows on text.

## 7. Motion

Subtle only. `Reveal` fades content up ~12px on first view. Hover: colour and
shadow transitions ≤ 200ms. Everything is wrapped in `motion-safe:` /
`prefers-reduced-motion` — reduced motion renders final state instantly.
Animation must never delay usability or block interaction.

## 8. Imagery

Represent modern Ghana and Accra: contemporary residential and commercial
properties, apartments, professional property managers and maintenance
professionals, Ghanaian and diaspora property owners, modern urban settings.
Never informal / low-end framing.

Photography is **configurable and optional** (`NEXT_PUBLIC_HERO_IMAGE`, etc.).
Until real, licensed photography is supplied, the UI uses designed,
non-photographic treatments (e.g. the hero's illustrative portfolio panel) rather
than stock images.

## 9. Illustrative UI

Any NexaHaus Connect mockup on the marketing site:

- uses realistic **fictional** data (e.g. GHS 28,500 expected rent),
- carries a visible "Illustrative interface" / "Illustrative example" label,
- is never described as real company performance,
- is responsive and looks like a real product surface, not a screenshot.

## 10. Voice

Simple English. Confident but humble. Short paragraphs. Strong headlines. Human.
Explain, don't assert. Avoid "revolutionary", "game-changing", "cutting-edge",
"disruptive", "world-class". Sound like a serious Ghanaian company operating to
international standards.

Recurring messages to reinforce: "Know what is happening with your property." ·
"Own property without losing visibility." · "Professional management. Transparent
reporting." · "Your property. Your data. Your control." · "Managing Properties.
Maximizing Assets."

## 11. Logo

`BrandMark` (`apps/web/src/components/brand.tsx`) — an abstract N/H gable in gold
on a navy rounded square. Favicon: `src/app/icon.svg`. Minimum clear space = the
square's corner radius on all sides. Do not recolour outside navy/gold.

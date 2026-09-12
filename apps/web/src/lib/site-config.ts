/**
 * Single source of truth for the public marketing site: brand facts, launch
 * status, external URLs, and contact placeholders.
 *
 * Everything that could change per environment or before the company launches
 * is read from `NEXT_PUBLIC_*` env vars with safe defaults, so the site builds
 * and runs with zero configuration and nothing about NexaHaus is hard-coded to
 * a value we cannot yet stand behind.
 *
 * NOTE: only `NEXT_PUBLIC_*` vars are readable in the browser. Reference them by
 * their full literal name (never computed) so Next.js can inline them at build.
 */

function env(value: string | undefined, fallback = ""): string {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") return fallback;
  return value === "true" || value === "1";
}

/** Canonical origin, no trailing slash. Used for metadata, sitemap, JSON-LD. */
export const SITE_URL = env(
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://www.nexahaus.com",
).replace(/\/$/, "");

/** Bare host for display ("www.nexahaus.com"). */
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

/**
 * Pre-launch mode. When true the site leads with research/early-access CTAs and
 * uses "launching" language; when false it switches to "now operating" language.
 * The physical office is planned for December 2027 — see `LAUNCH`.
 */
export const PRE_LAUNCH_MODE = flag(
  process.env.NEXT_PUBLIC_PRE_LAUNCH_MODE,
  true,
);

export const LAUNCH = {
  /** ISO date the countdown targets. Configurable; day is intentionally the 1st
   *  until an exact launch day is confirmed. */
  date: env(process.env.NEXT_PUBLIC_LAUNCH_DATE, "2027-12-01"),
  city: env(process.env.NEXT_PUBLIC_LAUNCH_CITY, "Accra"),
  /** Human label, e.g. "December 2027". */
  label: env(process.env.NEXT_PUBLIC_LAUNCH_LABEL, "December 2027"),
} as const;

/**
 * Where "Client Login" and portal links point. Defaults to the in-repo portal
 * route; set to the standalone NexaHaus Connect app URL in production.
 */
export const CLIENT_PORTAL_URL = env(
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL,
  "/login",
);

/** Optional WhatsApp business number in E.164 without "+", e.g. "233201234567".
 *  Empty until an official number exists — the WhatsApp CTA hides itself. */
export const WHATSAPP_NUMBER = env(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "");

export const WHATSAPP_LINK = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}`
  : "";

/**
 * Contact details. Deliberately blank until official details are provided —
 * components fall back to routing enquiries through the on-site forms rather
 * than inventing an address, phone number or inbox.
 */
export const CONTACT = {
  email: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, ""),
  phone: env(process.env.NEXT_PUBLIC_CONTACT_PHONE, ""),
  addressLine: env(process.env.NEXT_PUBLIC_CONTACT_ADDRESS, ""),
  city: env(process.env.NEXT_PUBLIC_CONTACT_CITY, "Accra"),
  country: env(process.env.NEXT_PUBLIC_CONTACT_COUNTRY, "Ghana"),
} as const;

/** Social profiles. Empty entries are not rendered. */
export const SOCIAL = {
  linkedin: env(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN, ""),
  instagram: env(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, ""),
  facebook: env(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, ""),
  tiktok: env(process.env.NEXT_PUBLIC_SOCIAL_TIKTOK, ""),
  youtube: env(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE, ""),
} as const;

export const ANALYTICS = {
  provider: env(process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER, "noop"),
  /** e.g. a PostHog project key or GA measurement id. */
  key: env(process.env.NEXT_PUBLIC_ANALYTICS_KEY, ""),
  host: env(process.env.NEXT_PUBLIC_ANALYTICS_HOST, ""),
} as const;

/** Base path of the NestJS marketing endpoints (proxied same-origin in dev). */
export const PUBLIC_API_BASE = env(
  process.env.NEXT_PUBLIC_API_BASE,
  "/api/v1/public",
);

/**
 * Optional photography. Paths are root-relative (put files in /public) or
 * absolute URLs on a configured image host. When a slot is empty the UI falls
 * back to a designed, non-photographic treatment rather than a stock image.
 */
export const MEDIA = {
  heroImage: env(process.env.NEXT_PUBLIC_HERO_IMAGE, ""),
  heroImageAlt: env(
    process.env.NEXT_PUBLIC_HERO_IMAGE_ALT,
    "A contemporary residential property in Accra, Ghana",
  ),
  ogImage: env(process.env.NEXT_PUBLIC_OG_IMAGE, ""),
} as const;

/** Allow indexing? Defaults to on; set false to keep a staging deploy private. */
export const ALLOW_INDEXING = flag(
  process.env.NEXT_PUBLIC_ALLOW_INDEXING,
  true,
);

export const COMPANY = {
  legalName: "NexaHaus Properties & Asset Management Ltd.",
  shortName: "NexaHaus",
  product: "NexaHaus Connect",
  tagline: "Managing Properties. Maximizing Assets.",
  description:
    "NexaHaus is a technology-enabled property and asset management company for Ghana — protecting properties, improving rental performance and giving owners visibility, control and transparent reporting wherever they are.",
} as const;

export type SiteConfig = {
  url: string;
  domain: string;
  preLaunch: boolean;
  launch: typeof LAUNCH;
  portalUrl: string;
  whatsappLink: string;
  contact: typeof CONTACT;
  social: typeof SOCIAL;
  company: typeof COMPANY;
};

export const siteConfig: SiteConfig = {
  url: SITE_URL,
  domain: SITE_DOMAIN,
  preLaunch: PRE_LAUNCH_MODE,
  launch: LAUNCH,
  portalUrl: CLIENT_PORTAL_URL,
  whatsappLink: WHATSAPP_LINK,
  contact: CONTACT,
  social: SOCIAL,
  company: COMPANY,
};

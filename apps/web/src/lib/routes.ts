/**
 * Canonical marketing routes and the site navigation model. Kept in one place so
 * the header, footer, sitemap and breadcrumbs never drift apart.
 */

export const routes = {
  home: "/",
  propertyManagement: "/property-management",
  assetManagement: "/asset-management",
  diaspora: "/diaspora",
  propertyRescue: "/property-rescue",
  propertyHealthCheck: "/property-health-check",
  nexahausConnect: "/nexahaus-connect",
  about: "/about",
  insights: "/insights",
  contact: "/contact",
  earlyAccess: "/early-access",
  founding100: "/founding-100",
  propertyOwnerSurvey: "/property-owner-survey",
  propertyOwnersClub: "/property-owners-club",
  ghanaReport: "/the-ghana-property-owner-report",
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
} as const;

export type RouteKey = keyof typeof routes;

export interface NavItem {
  label: string;
  href: string;
  /** Optional short description for the mobile menu / mega-menu. */
  description?: string;
}

/** Primary header navigation (brief §5). */
export const primaryNav: NavItem[] = [
  {
    label: "Property Management",
    href: routes.propertyManagement,
    description: "Day-to-day management that protects your property.",
  },
  {
    label: "Asset Management",
    href: routes.assetManagement,
    description: "Understand and improve how your property performs.",
  },
  {
    label: "Diaspora",
    href: routes.diaspora,
    description: "Own property in Ghana from anywhere.",
  },
  {
    label: "Property Rescue",
    href: routes.propertyRescue,
    description: "Find out what is holding a property back.",
  },
  {
    label: "About",
    href: routes.about,
    description: "Why we are building NexaHaus.",
  },
  {
    label: "Insights",
    href: routes.insights,
    description: "Property management knowledge for owners.",
  },
  {
    label: "Contact",
    href: routes.contact,
    description: "Talk to us about your property.",
  },
];

/** Primary and secondary calls to action (brief §39). */
export const cta = {
  primary: {
    label: "Request Property Assessment",
    href: routes.propertyHealthCheck,
  },
  secondary: { label: "Join Early Access", href: routes.earlyAccess },
  tertiary: {
    label: "Check Your Property Health",
    href: routes.propertyHealthCheck,
  },
} as const;

export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Company",
    items: [
      { label: "About", href: routes.about },
      { label: "Insights", href: routes.insights },
      { label: "Contact", href: routes.contact },
      { label: "The Ghana Property Owner Report", href: routes.ghanaReport },
    ],
  },
  {
    heading: "Services",
    items: [
      { label: "Property Management", href: routes.propertyManagement },
      { label: "Asset Management", href: routes.assetManagement },
      { label: "Diaspora", href: routes.diaspora },
      { label: "Property Rescue", href: routes.propertyRescue },
    ],
  },
  {
    heading: "Resources",
    items: [
      { label: "Property Owner Survey", href: routes.propertyOwnerSurvey },
      { label: "Property Health Check", href: routes.propertyHealthCheck },
      { label: "Early Access", href: routes.earlyAccess },
      { label: "NexaHaus Connect", href: routes.nexahausConnect },
      { label: "Property Owners Club", href: routes.propertyOwnersClub },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy Policy", href: routes.privacy },
      { label: "Terms", href: routes.terms },
      { label: "Cookie Policy", href: routes.cookies },
      { label: "Data Protection", href: `${routes.privacy}#data-protection` },
    ],
  },
];

/** Routes eligible for the XML sitemap (public, indexable, stable). */
export const sitemapRoutes: string[] = [
  routes.home,
  routes.propertyManagement,
  routes.assetManagement,
  routes.diaspora,
  routes.propertyRescue,
  routes.propertyHealthCheck,
  routes.nexahausConnect,
  routes.about,
  routes.insights,
  routes.contact,
  routes.earlyAccess,
  routes.founding100,
  routes.propertyOwnerSurvey,
  routes.propertyOwnersClub,
  routes.ghanaReport,
  routes.privacy,
  routes.terms,
  routes.cookies,
];

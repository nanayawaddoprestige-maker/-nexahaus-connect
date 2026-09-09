/**
 * Homepage copy (brief §6). Kept as data so it can move to a CMS later without
 * touching layout. Wording follows the brief closely; nothing here asserts a
 * fact about NexaHaus that is not yet true.
 */

export const hero = {
  headline: "Your Property Deserves More Than Management.",
  subhead:
    "Professional property and asset management for owners who expect visibility, accountability and performance.",
  body: "NexaHaus helps property owners protect their properties, improve rental performance and manage their assets with confidence — wherever they are.",
  primaryCta: { label: "Request Property Assessment", href: "/property-health-check" },
  secondaryCta: { label: "Explore Our Services", href: "/property-management" },
} as const;

export const trustStrip: { label: string; caption: string }[] = [
  { label: "Property Management", caption: "Day-to-day operations, handled" },
  { label: "Asset Performance", caption: "Measured, not assumed" },
  { label: "Transparent Reporting", caption: "Reproducible from every transaction" },
  { label: "Technology", caption: "NexaHaus Connect" },
  { label: "Accountability", caption: "Every decision logged" },
];

export const problem = {
  headline: "Owning Property Shouldn't Feel Like Managing a Second Job.",
  body: "Late rent. Unresolved maintenance. Vacant units. Unclear expenses. Unresponsive caretakers. Missing inspection reports. For owners living outside Ghana, the challenge can be even greater.",
  bridge: "NexaHaus was built to change that.",
  cards: [
    {
      title: "Rent Collection",
      body: "Know what is due, what has been collected and what remains outstanding.",
    },
    {
      title: "Maintenance",
      body: "Track issues from the first report through completion.",
    },
    {
      title: "Inspections",
      body: "Know the condition of your property without being physically present.",
    },
    {
      title: "Reporting",
      body: "Understand where your money is going and how your property is performing.",
    },
    {
      title: "Tenant Management",
      body: "Professional processes designed to improve accountability and communication.",
    },
    {
      title: "Diaspora",
      body: "Manage property in Ghana with greater visibility from wherever you live.",
    },
  ],
} as const;

export const services = {
  headline: "One Partner. Your Entire Property Lifecycle.",
  items: [
    {
      title: "Property Management",
      href: "/property-management",
      summary:
        "Professional day-to-day management designed to protect your property and give you greater control.",
      includes: [
        "Rent collection",
        "Tenant coordination",
        "Property inspections",
        "Maintenance coordination",
        "Property reporting",
        "Issue resolution",
        "Documentation",
        "Owner communication",
      ],
      cta: "Explore Property Management",
    },
    {
      title: "Asset Management",
      href: "/asset-management",
      summary:
        "Move beyond collecting rent. Understand how your property is performing as an asset.",
      includes: [
        "Portfolio oversight",
        "Income tracking",
        "Expense analysis",
        "Occupancy",
        "Rental performance",
        "Asset reporting",
        "Performance improvement",
        "Strategic recommendations",
      ],
      cta: "Explore Asset Management",
    },
    {
      title: "Facilities & Maintenance",
      href: "/property-management#maintenance",
      summary:
        "Protect the condition and long-term value of your property through structured maintenance.",
      includes: [
        "Preventive maintenance",
        "Corrective maintenance",
        "Vendor coordination",
        "Inspection",
        "Repairs",
        "Cleaning",
        "Landscaping",
        "Building systems",
      ],
      cta: "Explore Facilities & Maintenance",
    },
    {
      title: "Leasing",
      href: "/property-management#leasing",
      summary:
        "Professional support for preparing, marketing and managing the leasing process, subject to applicable regulatory requirements.",
      includes: [
        "Lease preparation",
        "Marketing support",
        "Tenant screening process",
        "Move-in coordination",
        "Renewals and expiries",
      ],
      cta: "Explore Leasing",
    },
    {
      title: "Short-Stay Management",
      href: "/property-management#short-stay",
      summary: "Professional oversight for owners who operate short-stay properties.",
      includes: [
        "Guest coordination",
        "Property readiness",
        "Cleaning",
        "Maintenance",
        "Reporting",
        "Revenue tracking",
      ],
      note: "Available according to property suitability and applicable requirements.",
      cta: "Explore Short-Stay Management",
    },
    {
      title: "Property Advisory",
      href: "/asset-management#advisory",
      summary: "Practical insight to help property owners make better decisions.",
      includes: [
        "Property assessment",
        "Rental performance review",
        "Maintenance planning",
        "Asset improvement",
        "Property strategy",
        "Portfolio review",
      ],
      cta: "Explore Property Advisory",
    },
  ],
} as const;

export const finalCta = {
  headline: "Let's Start With Your Property.",
  body: "Tell us about your property and the challenges you want solved.",
  primary: { label: "Request Property Assessment", href: "/property-health-check" },
  secondary: { label: "Join Early Access", href: "/early-access" },
} as const;

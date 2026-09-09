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

export const diaspora = {
  eyebrow: "For owners abroad",
  headline: "Own Property in Ghana While Living Abroad?",
  lede: "Distance should not mean uncertainty.",
  body: "Whether you live in Dubai, London, New York, Toronto or elsewhere, NexaHaus is being built to give you visibility into what is happening with your property in Ghana.",
  flow: [
    { label: "Your property", detail: "The asset you own in Ghana." },
    { label: "Your NexaHaus team", detail: "A professional layer between you and the property." },
    { label: "Real-time updates", detail: "Status, tenants, rent and issues — with dates." },
    { label: "Reports", detail: "A branded owner statement every month." },
    { label: "Maintenance", detail: "Tracked from report to completion, with your approval." },
    { label: "Financial visibility", detail: "What came in, what went out, what is outstanding." },
    { label: "Peace of mind", detail: "You know what is happening without being there." },
  ],
  cta: { label: "Explore Diaspora Property Management", href: "/diaspora" },
} as const;

export const connect = {
  eyebrow: "NexaHaus Connect",
  headline: "Your Property. Your Data. Your Control.",
  body: "NexaHaus Connect is our technology platform being built to give property owners a secure digital view of their assets.",
  dashboard: {
    label: "Illustrative interface — example data",
    stats: [
      { label: "Properties", value: "5" },
      { label: "Occupied", value: "4" },
      { label: "Vacant", value: "1" },
      { label: "Open maintenance", value: "2" },
    ],
    finance: [
      { label: "Expected rent", value: "GHS 28,500" },
      { label: "Collected", value: "GHS 24,500" },
      { label: "Outstanding", value: "GHS 4,000" },
    ],
    portfolioHealth: 87,
  },
  modules: [
    "Properties",
    "Finance",
    "Maintenance",
    "Inspections",
    "Documents",
    "Approvals",
    "Reports",
    "Property Health",
  ],
  primary: { label: "Explore NexaHaus Connect", href: "/nexahaus-connect" },
  secondary: { label: "Client Login", href: "/nexahaus-connect" },
} as const;

export const rescue = {
  eyebrow: "Property Rescue",
  headline: "Is Your Property Making Money — Or Costing You Money?",
  body: "Some properties do not need another caretaker. They need a proper assessment.",
  detail:
    "Property Rescue is NexaHaus's structured approach to identifying management, maintenance, occupancy, rental and performance problems that may be affecting an asset.",
  flow: [
    { label: "Assess" },
    { label: "Identify" },
    { label: "Prioritize" },
    { label: "Improve" },
    { label: "Monitor" },
  ],
  exampleScore: 72,
  exampleLabel: "Illustrative example",
  cta: { label: "Request Property Rescue", href: "/property-rescue" },
} as const;

export const health = {
  eyebrow: "Property Health Score",
  headline: "Know the Health of Your Property.",
  body: "The Property Health Score is a single 0–100 read on how your property is doing across the things that protect its value and income.",
  categories: [
    "Occupancy",
    "Rent Collection",
    "Maintenance",
    "Property Condition",
    "Tenant Experience",
    "Documentation",
    "Security",
    "Financial Performance",
  ],
  exampleScore: 91,
  disclaimer:
    "Property Health Score is a NexaHaus management assessment framework and is not a professional valuation, legal opinion or investment recommendation.",
  cta: { label: "Check Your Property", href: "/property-health-check" },
} as const;

export const howItWorks = {
  eyebrow: "How it works",
  headline: "From Property Ownership to Property Confidence.",
  steps: [
    {
      title: "Tell us about your property",
      body: "A few questions about the property, how it is managed today and what you want solved.",
    },
    {
      title: "Property assessment",
      body: "We review condition, occupancy, rent, documentation and the current management setup.",
    },
    {
      title: "Management plan",
      body: "A clear plan for what NexaHaus will do, what it costs and what you can expect.",
    },
    {
      title: "Digital onboarding",
      body: "Your property, tenants, leases and documents set up in NexaHaus Connect.",
    },
    {
      title: "Ongoing management",
      body: "Day-to-day operations, rent collection, maintenance and inspections — handled.",
    },
    {
      title: "Reporting & performance",
      body: "Monthly statements and asset-performance reporting you can see any time.",
    },
  ],
} as const;

export const transparency = {
  eyebrow: "Transparency",
  headline: "Transparency Is Not a Feature. It Is the Standard.",
  principles: [
    { title: "See it", body: "Know what is happening." },
    { title: "Track it", body: "Follow issues and activities." },
    { title: "Approve it", body: "Maintain control over significant decisions." },
    { title: "Report it", body: "Understand the financial and operational performance." },
  ],
} as const;

export const whyNexahaus = {
  eyebrow: "Why NexaHaus",
  headline: "Built Differently.",
  body: "We are building NexaHaus around the belief that professional property management should give owners more than a rent collection service.",
  pillars: [
    { title: "Professional management", body: "Structured processes, not ad-hoc caretaking." },
    { title: "Technology", body: "NexaHaus Connect gives you a live view of your asset." },
    { title: "Transparency", body: "Statements reproducible from every transaction." },
    { title: "Accountability", body: "Every decision, approval and action is logged." },
    { title: "Asset performance", body: "We manage with an asset-performance mindset, not just occupancy." },
  ],
} as const;

export const earlyAccess = {
  eyebrow: "Early Access",
  headline: "NexaHaus Is Coming to Accra.",
  body: [
    "Our first office is scheduled to open in Accra in December 2027. But the work starts before the doors open.",
    "We are speaking with property owners now to understand the real challenges they face and build our services around those needs.",
  ],
  primary: { label: "Join NexaHaus Early Access", href: "/early-access" },
  secondary: { label: "Take the Property Owner Survey", href: "/property-owner-survey" },
} as const;

export const founding100 = {
  eyebrow: "The NexaHaus Founding 100",
  headline: "Be Among the First 100.",
  body: "Be among the first 100 property owners to join the NexaHaus journey.",
  benefits: [
    "Early access to NexaHaus services and NexaHaus Connect",
    "Priority onboarding when the Accra office opens",
    "Participation in property-owner research",
    "Early product feedback",
    "Access to selected property education and events",
    "Launch communications",
  ],
  cta: { label: "Join the Founding 100", href: "/founding-100" },
} as const;

export const insightsTeaser = {
  eyebrow: "Insights",
  headline: "Property Knowledge for Owners.",
  body: "Practical guides on managing, maintaining and improving property in Ghana — with a section for diaspora owners.",
  categories: [
    "Property Management",
    "Property Investment",
    "Diaspora Property",
    "Maintenance",
    "Asset Performance",
    "Ghana Real Estate",
    "Property Technology",
  ],
  cta: { label: "View All Insights", href: "/insights" },
} as const;

export const finalCta = {
  headline: "Let's Start With Your Property.",
  body: "Tell us about your property and the challenges you want solved.",
  primary: { label: "Request Property Assessment", href: "/property-health-check" },
  secondary: { label: "Join Early Access", href: "/early-access" },
} as const;

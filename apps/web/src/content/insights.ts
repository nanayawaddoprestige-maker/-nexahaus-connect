/**
 * Insights content layer.
 *
 * Phase 1 ships the typed interface and an empty article set. Phase 5 fills
 * `articles` with real, education-first pieces (MDX or structured data). When
 * Insights later moves to a CMS or the NestJS API, only the four accessor
 * functions below change — pages, sitemap and metadata consume these and never
 * touch the storage.
 *
 * No fabricated statistics, clients, or case studies (brief §33, §69).
 */

export const INSIGHT_CATEGORIES = [
  "Property Management",
  "Ghana Property Market",
  "Diaspora",
  "Property Investment",
  "Maintenance",
  "Asset Management",
  "Property Technology",
  "Landlord Education",
  "Tenant Management",
] as const;

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export interface InsightMeta {
  slug: string;
  title: string;
  description: string;
  category: InsightCategory;
  /** Byline. Use "NexaHaus" until named authors are confirmed. */
  author: string;
  /** ISO date (YYYY-MM-DD). */
  publishedAt: string;
  updatedAt?: string;
  /** Whole minutes; computed from body length when omitted. */
  readingMinutes?: number;
  /** Root-relative hero image path, or omit for the category placeholder. */
  heroImage?: string;
  heroAlt?: string;
  draft?: boolean;
  featured?: boolean;
}

export interface Insight extends InsightMeta {
  /** Article body as an ordered list of blocks (renderer in Phase 5). */
  body: InsightBlock[];
}

export type InsightBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; text: string };

/** All published articles, newest first. Filled in Phase 5. */
const articles: Insight[] = [
  {
    slug: "what-to-expect-from-a-professional-property-manager",
    title: "What to Expect From a Professional Property Manager",
    description:
      "A professional manager does more than collect rent. Here is the full scope of work you should expect — and the questions worth asking before you hand over a property.",
    category: "Property Management",
    author: "NexaHaus",
    publishedAt: "2026-06-08",
    featured: true,
    body: [
      {
        type: "p",
        text: 'In Ghana, "property management" can mean very different things depending on who you ask. For some it means a caretaker who collects rent and calls when something breaks. For others it means a fully accountable service covering finances, maintenance, compliance and reporting. Before you hand over a property — or evaluate whether your current arrangement is working — it helps to know what a professional standard of management actually looks like.',
      },
      { type: "h2", text: "1. A documented onboarding, not a handshake" },
      {
        type: "p",
        text: "A professional manager starts by recording the property properly: its condition, existing tenants and leases, outstanding maintenance, insurance status, and ownership documents. This baseline matters — without it, there is no reliable way to measure whether the property is being looked after, or to settle a dispute later about what condition it was in when management began.",
      },
      { type: "h2", text: "2. Rent collection with a paper trail" },
      {
        type: "p",
        text: "Every payment should be recorded against the specific tenant, unit and period it covers, with a clear status: paid, partially paid, or outstanding. Cash handled informally, with no reconciliation and no receipt trail, is the single biggest source of disputes between owners, managers and tenants. Ask how payments are recorded and how you, as the owner, can see the same numbers your manager sees.",
      },
      {
        type: "h2",
        text: "3. Maintenance that is reported, approved, and closed out",
      },
      {
        type: "p",
        text: "A reported issue should move through a visible sequence: acknowledged, assigned to a vendor, scheduled, completed, and — for larger items — verified before it is marked closed. For any cost above a threshold you set, you should be asked to approve it before work proceeds, with photos and a quoted cost, not informed after the invoice arrives.",
      },
      { type: "h2", text: "4. Regular inspections, not just emergency visits" },
      {
        type: "p",
        text: "Inspections protect the property and the relationship with your tenant. A professional manager inspects on a defined schedule — not only when something has already gone wrong — and produces a written report with photos, not a verbal summary over a phone call.",
      },
      { type: "h2", text: "5. Reporting you can actually read" },
      {
        type: "p",
        text: "You should receive a regular statement showing rental income, management fees, maintenance and other expenses, and your net distribution for the period — reproducible from the underlying transactions, not a single total with no supporting detail.",
      },
      {
        type: "callout",
        text: "A simple test: ask your manager to explain how this month's net amount was calculated, line by line. If they cannot, the reporting is not yet at a professional standard.",
      },
      {
        type: "h2",
        text: "Questions worth asking before you sign a management agreement",
      },
      {
        type: "ul",
        items: [
          "How is the management fee structured — a percentage of collected rent, a fixed fee, or something else?",
          "What is the threshold above which you require my approval for maintenance spend?",
          "How often will the property be inspected, and will I receive the report?",
          "How will I see rent collection status without having to ask?",
          "What happens if a tenant falls into arrears — what is the process, and when am I told?",
        ],
      },
      {
        type: "p",
        text: "None of this requires exotic technology — it requires discipline and a system that makes the information available rather than something you have to chase. That is the standard we are building NexaHaus Connect around.",
      },
    ],
  },
  {
    slug: "how-to-read-your-owner-statement",
    title: "How to Read a Rental Performance Report (Owner Statement)",
    description:
      "Gross income, management fees, expenses, net distribution — a line-by-line guide to the owner statement your property manager should be sending you.",
    category: "Asset Management",
    author: "NexaHaus",
    publishedAt: "2026-06-22",
    featured: true,
    body: [
      {
        type: "p",
        text: "An owner statement is the single most important document a property manager produces for you. Done properly, it should let you understand — without a phone call — exactly how much your property earned, what was spent, and why the amount that reached your account is what it is. Here is how to read one, and what to check.",
      },
      { type: "h2", text: "Opening balance" },
      {
        type: "p",
        text: "The starting point for the period, usually the closing balance carried over from the previous statement. If this figure changes without explanation between statements, ask why.",
      },
      { type: "h2", text: "Rental income" },
      {
        type: "p",
        text: "This should be broken down by property and, ideally, by unit — showing what was expected for the period against what was actually collected. A single combined figure hides useful information: you cannot tell whether a shortfall is a vacancy, a late payment, or a tenant in genuine arrears.",
      },
      { type: "h2", text: "Management fees" },
      {
        type: "p",
        text: "Usually a percentage of collected rent (not expected rent — check which basis your agreement uses) or a fixed amount. The fee structure should be written into your management agreement, not applied inconsistently month to month.",
      },
      { type: "h2", text: "Maintenance and other expenses" },
      {
        type: "p",
        text: "Each expense should be itemised: category, vendor, amount and date, with an invoice on file. Any expense above your agreed approval threshold should already have your sign-off recorded before it appears here — not be a surprise on the statement.",
      },
      { type: "h2", text: "Net owner distribution" },
      {
        type: "p",
        text: "Gross rental income, minus management fees, minus approved expenses, equals what should reach you. This number should be fully traceable to the lines above it — if you add up the components and the total does not match, that is worth raising immediately.",
      },
      { type: "h2", text: "Closing balance" },
      {
        type: "p",
        text: "Opening balance, plus net income for the period, minus what was actually paid out to you, equals the closing balance — which becomes next period's opening balance.",
      },
      {
        type: "quote",
        text: "A statement you cannot reconstruct from its own numbers is not a statement — it is a summary you are being asked to trust without evidence.",
      },
      { type: "h2", text: "A short checklist for your next statement" },
      {
        type: "ul",
        items: [
          "Does the opening balance match the previous statement's closing balance?",
          "Is rental income broken down by property or unit, and does it distinguish expected from collected?",
          "Is every expense itemised with a category and, ideally, an invoice reference?",
          "Does gross income minus fees minus expenses equal the stated net distribution?",
          "Were any expenses above your approval threshold actually approved by you, in writing, before being deducted?",
        ],
      },
    ],
  },
  {
    slug: "why-diaspora-owners-need-regular-inspections",
    title:
      "Why Diaspora Owners Need Regular Inspections — Not Just Phone Calls",
    description:
      "Living outside Ghana makes it harder to know what is really happening at your property. Regular, documented inspections close that gap. Here is why they matter and what a good report should contain.",
    category: "Diaspora",
    author: "NexaHaus",
    publishedAt: "2026-07-06",
    featured: true,
    body: [
      {
        type: "p",
        text: "If you own property in Ghana but live abroad, the hardest part of ownership is often not the distance itself — it is not knowing. A tenant says everything is fine. A caretaker says the roof is holding up. Without an independent, documented check, you are relying entirely on the word of people who may have reasons, however well-intentioned, to tell you what you want to hear.",
      },
      { type: "h2", text: "What an inspection actually verifies" },
      {
        type: "p",
        text: "A proper inspection is not a courtesy visit. It is a structured walk-through — room by room, system by system — checking condition against a consistent standard: living areas, kitchen, bedrooms, bathrooms, exterior, roof, electrical, plumbing and security. Each area is rated (good, needs attention, urgent, or not applicable), photographed, and noted, so the same property can be compared inspection to inspection.",
      },
      { type: "h2", text: "Why timing matters" },
      {
        type: "p",
        text: "Different moments call for different inspections: an initial baseline when management begins, move-in and move-out checks tied to a tenancy, routine periodic visits, and a follow-up after any significant maintenance work. Waiting until something is visibly wrong means the problem — a leak, a damp patch, a failing electrical circuit — has usually already been developing for a while.",
      },
      { type: "h2", text: "What a good report gives you" },
      {
        type: "ul",
        items: [
          "Dated, timestamped photographs — not a description you have to take on faith.",
          "A clear rating per area, so you can see at a glance where attention is needed.",
          'Specific, prioritised recommendations, not a vague "all fine".',
          "A comparison point against the previous inspection, so you can see whether an issue is new, worsening, or resolved.",
        ],
      },
      {
        type: "callout",
        text: "The goal is to be able to answer, in seconds and without a call to Ghana: when was my property last inspected, and what did the inspector find?",
      },
      { type: "h2", text: "This does not replace trust — it protects it" },
      {
        type: "p",
        text: "Regular inspections are not about suspicion of your manager or tenant. They are about removing the need for anyone to rely on memory or reassurance when real money and a real asset are involved. A manager confident in their own work should welcome a documented record as much as you do.",
      },
    ],
  },
  {
    slug: "preventive-maintenance-protects-property-value",
    title: "Preventive Maintenance: The Quiet Way Property Value Is Protected",
    description:
      "Most costly repairs were once small, inexpensive ones. A preventive maintenance schedule catches problems while they are still cheap to fix.",
    category: "Maintenance",
    author: "NexaHaus",
    publishedAt: "2026-07-20",
    body: [
      {
        type: "p",
        text: "Maintenance tends to get attention only when something breaks. But the more consequential work in property management is the maintenance nobody notices — the servicing and checks that stop breakdowns from happening in the first place. This is preventive maintenance, and it is one of the clearest ways an owner's money is either protected or quietly wasted.",
      },
      { type: "h2", text: "Reactive vs. preventive" },
      {
        type: "p",
        text: "Reactive maintenance responds after a tenant reports a problem: the air conditioning stops cooling, a pipe leaks, the generator fails to start when the power goes. Preventive maintenance is scheduled ahead of failure — servicing the AC before the rainy season, having plumbing checked annually, testing the generator on a fixed interval. The unit cost of reactive repairs is almost always higher: a small leak found early is a minor plumbing job; the same leak left for months can mean replacing damaged flooring, treating mould, and repainting a ceiling.",
      },
      { type: "h2", text: "What belongs on a preventive schedule" },
      {
        type: "ul",
        items: [
          "Air conditioning servicing, typically ahead of the hottest months",
          "Plumbing inspection, checking for slow leaks and corrosion before they become visible damage",
          "Electrical inspection, particularly in older properties or after any rewiring work",
          "Generator and backup power servicing, tested under load, not just started and switched off",
          "Pest control, on a fixed interval rather than only when a tenant complains",
          "Roof and gutter checks, especially before and after the rainy season",
          "Painting and general exterior upkeep, which protects surfaces as much as it protects appearance",
        ],
      },
      {
        type: "h2",
        text: "Why this is an asset-management decision, not a chore",
      },
      {
        type: "p",
        text: "Every property has systems with a working life — a roof, a water heater, an electrical installation. Preventive maintenance does not stop that clock, but it does mean the property reaches the end of a system's working life in a controlled, budgeted way, rather than through a sudden failure that is more expensive to fix and disruptive to a tenant. For an owner comparing properties or managers, the presence of a preventive maintenance schedule — and a record that it is actually being followed — is a meaningful signal of how seriously a property is being looked after.",
      },
      {
        type: "quote",
        text: "The most expensive repair on a property is usually the one that was avoidable eighteen months earlier.",
      },
      {
        type: "p",
        text: "If your current management arrangement has no preventive schedule at all, that is a reasonable thing to raise — not as a complaint, but as a request for the kind of asset care that protects the value of what you own.",
      },
    ],
  },
  {
    slug: "what-actually-determines-fair-rent-in-ghana",
    title:
      'What Actually Determines a Fair Rent — Beyond "What the Market Will Bear"',
    description:
      "Setting rent by guesswork leaves money on the table or drives good tenants away. Here are the factors a disciplined rent review actually considers.",
    category: "Ghana Property Market",
    author: "NexaHaus",
    publishedAt: "2026-08-03",
    body: [
      {
        type: "p",
        text: 'Ask most owners how their rent was set, and the honest answer is often "roughly what similar places seem to be going for." That is not necessarily wrong, but it is incomplete — and it tends to leave owners either under-charging for a well-kept property or over-pricing one that then sits vacant for months. A more disciplined review looks at several factors together, not rent-of-thumb comparisons alone.',
      },
      { type: "h2", text: "Location and access" },
      {
        type: "p",
        text: "Proximity to main roads, reliability of the surrounding infrastructure (water, power, drainage), and ease of access all affect what a property can reasonably command — sometimes more than the property itself.",
      },
      { type: "h2", text: "Condition and recent investment" },
      {
        type: "p",
        text: "A property that has been well maintained, with working systems and recent, visible upkeep, justifies a different rent than a comparable unit that has been neglected — even on the same street. This is one of the direct, measurable returns on the preventive maintenance discussed elsewhere in this series.",
      },
      { type: "h2", text: "Vacancy cost versus rent level" },
      {
        type: "p",
        text: "A higher rent that leaves a unit vacant for an extra two or three months can cost more than a slightly lower rent that keeps it continuously occupied. Any rent review should weigh the achievable rent against realistic time-to-let, not just the headline figure.",
      },
      { type: "h2", text: "Tenant quality and stability" },
      {
        type: "p",
        text: "A reliable, long-staying tenant paying slightly below an aggressive market rate can be worth more, over a year, than a succession of short-term tenants at a higher rate — once you account for vacancy gaps, turnover costs, and the wear of repeated move-ins and move-outs.",
      },
      { type: "h2", text: "What a documented rent review looks like" },
      {
        type: "ul",
        items: [
          "Compare against genuinely similar properties — type, size, location and condition — not the nearest available listing.",
          "Factor in the property's own condition and maintenance history, not just its category.",
          "Model the cost of vacancy at different rent levels, not only the rent itself.",
          "Review on a set schedule (for example, at each lease renewal), rather than leaving rent unexamined for years.",
        ],
      },
      {
        type: "callout",
        text: "This is general education, not a valuation. A specific rent recommendation for your property should come from someone who has actually seen it.",
      },
    ],
  },
];

function published(): Insight[] {
  return articles
    .filter((a) => !a.draft)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getAllInsights(): InsightMeta[] {
  return published().map(stripBody);
}

export function getInsightsByCategory(
  category: InsightCategory,
): InsightMeta[] {
  return published()
    .filter((a) => a.category === category)
    .map(stripBody);
}

export function getFeaturedInsights(limit = 3): InsightMeta[] {
  const feat = published().filter((a) => a.featured);
  return (feat.length ? feat : published()).slice(0, limit).map(stripBody);
}

export function getInsight(slug: string): Insight | null {
  const article = published().find((a) => a.slug === slug);
  if (!article) return null;
  return {
    ...article,
    readingMinutes:
      article.readingMinutes ?? estimateReadingMinutes(article.body),
  };
}

export function getRelatedInsights(slug: string, limit = 3): InsightMeta[] {
  const current = getInsight(slug);
  if (!current) return [];
  return published()
    .filter((a) => a.slug !== slug)
    .sort((a, b) => {
      const score = (x: Insight) => (x.category === current.category ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, limit)
    .map(stripBody);
}

export function getAllInsightSlugs(): string[] {
  return published().map((a) => a.slug);
}

export function estimateReadingMinutes(body: InsightBlock[]): number {
  const words = body.reduce((n, b) => {
    if ("text" in b) return n + b.text.split(/\s+/).length;
    if ("items" in b) return n + b.items.join(" ").split(/\s+/).length;
    return n;
  }, 0);
  return Math.max(1, Math.round(words / 220));
}

function stripBody(a: Insight): InsightMeta {
  const { body: _body, ...meta } = a;
  return {
    ...meta,
    readingMinutes: a.readingMinutes ?? estimateReadingMinutes(a.body),
  };
}

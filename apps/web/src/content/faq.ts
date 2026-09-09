/**
 * Frequently asked questions (brief §47). Answers state what NexaHaus is
 * building and how it will work — no unsupported promises, no invented
 * timelines beyond the stated December 2027 launch.
 */

export interface FaqItem {
  question: string;
  answer: string;
  /** Optional grouping for topic-specific FAQ blocks on service pages. */
  topics?: string[];
}

export const faqs: FaqItem[] = [
  {
    question: "What does NexaHaus manage?",
    answer:
      "Residential homes, apartments and multi-unit buildings, commercial and mixed-use property, and short-stay properties where they are suitable. We provide property management, asset management, and facilities and maintenance, plus property advisory. Regulated agency activities such as leasing are offered only where NexaHaus holds the required Ghanaian licensing and qualified personnel.",
    topics: ["general", "property-management"],
  },
  {
    question: "Do you manage properties for owners living abroad?",
    answer:
      "Yes. Diaspora owners are a core part of who NexaHaus is built for. The aim is to give you visibility into your property's status, tenants, rent, maintenance, inspections and finances — with clear dates — so you can manage from another country without a stream of phone calls.",
    topics: ["general", "diaspora"],
  },
  {
    question: "Where does NexaHaus operate?",
    answer:
      "NexaHaus is starting in Accra and Greater Accra, with the long-term ambition to serve owners and properties across Ghana.",
    topics: ["general"],
  },
  {
    question: "When is NexaHaus launching?",
    answer:
      "Our first office is scheduled to open in Accra in December 2027. We are speaking with property owners now, running research and onboarding a founding group ahead of launch.",
    topics: ["general"],
  },
  {
    question: "How does property management work?",
    answer:
      "After a property assessment we agree a management plan, onboard the property, tenants and documents into NexaHaus Connect, and then handle day-to-day operations: rent collection, tenant coordination, maintenance, inspections and reporting. You keep approval over significant costs and decisions.",
    topics: ["property-management"],
  },
  {
    question: "How often will my property be inspected?",
    answer:
      "Inspection frequency is agreed in your management plan and depends on the property type and tenancy. Each inspection produces an area-by-area report with photos that you can see in NexaHaus Connect.",
    topics: ["property-management"],
  },
  {
    question: "Will I receive financial reports?",
    answer:
      "Yes. You receive a monthly owner statement that can be reproduced from every underlying transaction — nothing is edited by hand — plus asset-performance reporting across your portfolio.",
    topics: ["property-management", "asset-management"],
  },
  {
    question: "Can I monitor my property online?",
    answer:
      "That is the purpose of NexaHaus Connect: a secure digital view of your properties, rent and finances, maintenance, inspections, documents, approvals and Property Health. It is being built now and previewed on this site.",
    topics: ["general", "technology"],
  },
  {
    question: "What is NexaHaus Connect?",
    answer:
      "NexaHaus Connect is our technology platform. It is designed to give owners a secure login to see what is happening with their property and portfolio — status, finances, maintenance, inspections, documents and performance — in one place.",
    topics: ["technology"],
  },
  {
    question: "What is Property Rescue?",
    answer:
      "Property Rescue is a structured assessment for a property that is underperforming. It looks at occupancy, rental pricing, vacancy, rent collection, maintenance backlog, condition and documentation, produces an overall score, and gives a prioritised list of corrective actions.",
    topics: ["property-rescue", "asset-management"],
  },
  {
    question: "What is the Property Health Score?",
    answer:
      "The Property Health Score is a 0–100 management assessment across occupancy, rent collection, maintenance, condition, tenant experience, documentation, security and financial performance. It is a NexaHaus framework — not a professional valuation, legal opinion or investment recommendation.",
    topics: ["property-rescue", "asset-management"],
  },
  {
    question: "Can NexaHaus manage multiple properties?",
    answer:
      "Yes. NexaHaus Connect is built around a portfolio view, with reporting and Property Health at both the property and portfolio level.",
    topics: ["general", "asset-management"],
  },
  {
    question: "Can NexaHaus manage commercial properties?",
    answer:
      "Yes — commercial and mixed-use properties are in scope alongside residential. The management plan is tailored to the property and its tenancies.",
    topics: ["general", "property-management"],
  },
];

export function faqsForTopic(topic: string): FaqItem[] {
  return faqs.filter((f) => f.topics?.includes(topic));
}

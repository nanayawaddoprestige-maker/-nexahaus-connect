/** Shared option lists for lead-capture forms. */

export const PROPERTY_TYPES = [
  "Residential home",
  "Apartment",
  "Multi-unit building",
  "Commercial",
  "Mixed-use",
  "Short-stay",
  "Land",
  "Other",
] as const;

export const SERVICE_OPTIONS = [
  "Property Management",
  "Asset Management",
  "Facilities & Maintenance",
  "Leasing",
  "Short-Stay Management",
  "Property Advisory",
  "Property Rescue",
  "Not sure yet",
] as const;

export const PROPERTY_COUNT_OPTIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6-10",
  "10+",
] as const;

export const PREFERRED_CONTACT = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone call" },
  { value: "WHATSAPP", label: "WhatsApp" },
] as const;

/**
 * Countries with a meaningful NexaHaus audience: Ghana plus the largest diaspora
 * hubs, then a general "Other". Deliberately short — a full ISO list is noise
 * here and can be added later.
 */
export const COUNTRY_OPTIONS = [
  "Ghana",
  "United Kingdom",
  "United States",
  "Canada",
  "United Arab Emirates",
  "Germany",
  "Netherlands",
  "Italy",
  "Australia",
  "South Africa",
  "Nigeria",
  "Other",
] as const;

/** Parse a "count" option ("1", "6-10", "10+") into an integer for the CRM. */
export function parsePropertyCount(value: string): number | undefined {
  if (!value) return undefined;
  if (value === "10+") return 10;
  if (value.includes("-")) {
    const lo = Number(value.split("-")[0]);
    return Number.isFinite(lo) ? lo : undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

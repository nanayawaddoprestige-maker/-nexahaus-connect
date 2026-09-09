import { z } from "zod";
import { LeadSource, LeadStatus } from "@nexahaus/types";
import { email, ghanaPhone, paginationQuery, uuid } from "./common.js";

export const createLeadSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: email,
    phone: ghanaPhone,
    source: z.nativeEnum(LeadSource).default(LeadSource.OTHER),
    campaign: z.string().trim().max(120).optional(),
    segment: z.string().trim().max(60).optional(),
    propertyCount: z.number().int().min(0).max(1000).optional(),
    propertyType: z.string().trim().max(60).optional(),
    location: z.string().trim().max(160).optional(),
    serviceInterest: z.array(z.string().trim().max(60)).max(20).optional(),
    livesInGhana: z.boolean().optional(),
    biggestChallenge: z.string().trim().max(1000).optional(),
    consent: z
      .object({
        marketing: z.boolean(),
        purpose: z.string().trim().max(200).optional(),
        wording: z.string().trim().max(2000).optional(),
      })
      .optional(),
  })
  .strict();

export const updateLeadSchema = createLeadSchema
  .partial()
  .extend({
    status: z.nativeEnum(LeadStatus).optional(),
    ownerUserId: uuid.optional(),
  })
  .strict();

export const listLeadQuery = paginationQuery.extend({
  status: z.nativeEnum(LeadStatus).optional(),
  grade: z.enum(["A", "B", "C", "D"]).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  ownerUserId: uuid.optional(),
  q: z.string().trim().max(120).optional(),
});

export const leadActivitySchema = z
  .object({
    type: z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "TASK"]),
    body: z.string().trim().min(1).max(4000),
    dueAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export const convertLeadSchema = z
  .object({
    clientType: z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
    segment: z
      .enum(["DIASPORA", "RESIDENT", "INVESTOR", "DEVELOPER", "COMMERCIAL", "OTHER"])
      .default("OTHER"),
    servicePackage: z
      .enum(["BASIC", "PROFESSIONAL", "PREMIUM", "ENTERPRISE"])
      .optional(),
    accountManagerId: uuid.optional(),
  })
  .strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadQuery = z.infer<typeof listLeadQuery>;
export type LeadActivityInput = z.infer<typeof leadActivitySchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

// -- Public lead-magnet + survey inputs ------------------------------------

/** First-touch campaign attribution passed through from the marketing site.
 *  Never contains personal data — see apps/web/src/lib/utm.ts. */
export const attributionSchema = z
  .object({
    utm_source: z.string().trim().max(200).optional(),
    utm_medium: z.string().trim().max(200).optional(),
    utm_campaign: z.string().trim().max(200).optional(),
    utm_content: z.string().trim().max(200).optional(),
    utm_term: z.string().trim().max(200).optional(),
    click_id: z.string().trim().max(220).optional(),
    landing_path: z.string().trim().max(300).optional(),
    referrer: z.string().trim().max(400).optional(),
  })
  .strict();

const marketingConsent = z.object({
  marketing: z.literal(true),
  wording: z.string().trim().min(3).max(2000),
});

export const propertyHealthCheckSchema = z
  .object({
    contactName: z.string().trim().min(2).max(160),
    email: email,
    phone: ghanaPhone,
    livesInGhana: z.boolean(),
    location: z.string().trim().max(160).optional(),
    propertyType: z.string().trim().max(60).optional(),
    propertyCount: z.number().int().min(1).max(1000).default(1),
    answers: z.object({
      occupied: z.boolean(),
      managedProfessionally: z.boolean(),
      tenantsPayOnTime: z.enum(["ALWAYS", "USUALLY", "SOMETIMES", "RARELY"]),
      inspectionFrequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "NEVER"]),
      receivesFinancialReports: z.boolean(),
      documentsInOrder: z.boolean(),
      lastMaintenanceRecent: z.boolean(),
    }),
    /** Optional richer context captured by the premium multi-step flow. */
    rentCollection: z
      .enum(["SELF", "CARETAKER", "AGENT", "MANAGER", "FAMILY", "OTHER"])
      .optional(),
    maintenanceHandler: z
      .enum(["SELF", "CARETAKER", "AGENT", "MANAGER", "FAMILY", "AD_HOC", "OTHER"])
      .optional(),
    biggestChallenge: z.string().trim().max(1000).optional(),
    serviceInterest: z.array(z.string().trim().max(60)).max(12).optional(),
    attribution: attributionSchema.optional(),
    consent: marketingConsent,
  })
  .strict();

export const earlyAccessSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: email,
    phone: ghanaPhone,
    propertyCount: z.number().int().min(1).max(1000).optional(),
    location: z.string().trim().max(160).optional(),
    livesInGhana: z.boolean().optional(),
    interest: z.string().trim().max(500).optional(),
    serviceInterest: z.array(z.string().trim().max(60)).max(12).optional(),
    campaign: z.enum(["FOUNDING_100", "EARLY_ACCESS", "OWNER_CLUB"]).default("EARLY_ACCESS"),
    attribution: attributionSchema.optional(),
    consent: marketingConsent,
  })
  .strict();

export const surveyResponseSchema = z
  .object({
    leadEmail: email.optional(),
    answers: z.record(z.string(), z.unknown()),
    consent: z
      .object({ marketing: z.boolean(), wording: z.string().trim().max(2000) })
      .optional(),
  })
  .strict();

export const contactEnquirySchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: email,
    phone: ghanaPhone,
    /** ISO country name or code, free text from a country selector. */
    country: z.string().trim().max(80).optional(),
    propertyLocation: z.string().trim().max(160).optional(),
    propertyType: z.string().trim().max(60).optional(),
    propertyCount: z.number().int().min(0).max(1000).optional(),
    serviceNeeded: z.string().trim().max(80).optional(),
    message: z.string().trim().min(1).max(4000),
    preferredContact: z.enum(["EMAIL", "PHONE", "WHATSAPP"]).default("EMAIL"),
    livesInGhana: z.boolean().optional(),
    attribution: attributionSchema.optional(),
    consent: marketingConsent,
  })
  .strict();

/**
 * Property Rescue diagnostic (brief §10). Six steps of self-reported inputs
 * about an underperforming property. Scored server-side into a preliminary,
 * clearly-labelled indicative result — not a valuation.
 */
export const propertyRescueSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: email,
    phone: ghanaPhone,
    propertyLocation: z.string().trim().max(160).optional(),
    propertyType: z.string().trim().max(60).optional(),
    propertyCount: z.number().int().min(1).max(1000).default(1),
    ownerLocation: z.enum(["GHANA", "ABROAD"]),
    answers: z.object({
      occupancy: z.enum(["FULLY_OCCUPIED", "PARTLY_VACANT", "MOSTLY_VACANT", "VACANT"]),
      rentVsMarket: z.enum(["ABOVE", "AT", "BELOW", "NOT_SURE"]),
      collectionReliability: z.enum(["ALWAYS", "USUALLY", "SOMETIMES", "RARELY"]),
      arrears: z.boolean(),
      maintenanceBacklog: z.enum(["NONE", "MINOR", "SIGNIFICANT", "SEVERE"]),
      conditionConcerns: z.boolean(),
      lastInspection: z.enum(["WITHIN_3M", "WITHIN_12M", "OVER_12M", "NEVER"]),
      documentsInOrder: z.boolean(),
      professionallyManaged: z.boolean(),
      knowsExpenses: z.boolean(),
    }),
    biggestConcern: z.string().trim().max(1000).optional(),
    attribution: attributionSchema.optional(),
    consent: marketingConsent,
  })
  .strict();

/**
 * Property Owner Survey (brief §16). Market-research instrument; answers are a
 * structured record. Contact fields link the response to a CRM lead.
 */
export const propertyOwnerSurveySchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: email,
    phone: ghanaPhone,
    country: z.string().trim().max(80).optional(),
    livesInGhana: z.boolean().optional(),
    propertyCount: z.number().int().min(0).max(1000).optional(),
    location: z.string().trim().max(160).optional(),
    biggestChallenge: z.string().trim().max(1000).optional(),
    serviceInterest: z.array(z.string().trim().max(60)).max(20).optional(),
    answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
    attribution: attributionSchema.optional(),
    consent: marketingConsent,
  })
  .strict();

export type PropertyHealthCheckInput = z.infer<typeof propertyHealthCheckSchema>;
export type EarlyAccessInput = z.infer<typeof earlyAccessSchema>;
export type SurveyResponseInput = z.infer<typeof surveyResponseSchema>;
export type AttributionInput = z.infer<typeof attributionSchema>;
export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;
export type PropertyRescueInput = z.infer<typeof propertyRescueSchema>;
export type PropertyOwnerSurveyInput = z.infer<typeof propertyOwnerSurveySchema>;

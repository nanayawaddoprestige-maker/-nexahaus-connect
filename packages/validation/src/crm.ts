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
    consent: z.object({
      marketing: z.literal(true),
      wording: z.string().trim().min(3).max(2000),
    }),
  })
  .strict();

export const earlyAccessSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: email,
    phone: ghanaPhone,
    propertyCount: z.number().int().min(1).max(1000).optional(),
    location: z.string().trim().max(160).optional(),
    interest: z.string().trim().max(500).optional(),
    campaign: z.enum(["FOUNDING_100", "EARLY_ACCESS", "OWNER_CLUB"]).default("EARLY_ACCESS"),
    consent: z.object({
      marketing: z.literal(true),
      wording: z.string().trim().min(3).max(2000),
    }),
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

export type PropertyHealthCheckInput = z.infer<typeof propertyHealthCheckSchema>;
export type EarlyAccessInput = z.infer<typeof earlyAccessSchema>;
export type SurveyResponseInput = z.infer<typeof surveyResponseSchema>;

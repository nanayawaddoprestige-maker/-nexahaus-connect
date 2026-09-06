import { z } from "zod";
import {
  ClientSegment,
  ClientStatus,
  ClientType,
  ServicePackage,
} from "@nexahaus/types";
import { email, ghanaPhone, paginationQuery, uuid } from "./common.js";

export const createClientSchema = z
  .object({
    type: z.nativeEnum(ClientType),
    displayName: z.string().trim().min(2).max(160),
    legalName: z.string().trim().max(200).optional(),
    segment: z.nativeEnum(ClientSegment).default(ClientSegment.OTHER),
    primaryEmail: email.optional(),
    primaryPhone: ghanaPhone.optional(),
    countryOfResidence: z.string().trim().length(2).toUpperCase().optional(),
    servicePackage: z.nativeEnum(ServicePackage).optional(),
    accountManagerId: uuid.optional(),
  })
  .strict();

export const updateClientSchema = createClientSchema
  .partial()
  .extend({ status: z.nativeEnum(ClientStatus).optional() })
  .strict();

export const listClientQuery = paginationQuery.extend({
  status: z.nativeEnum(ClientStatus).optional(),
  segment: z.nativeEnum(ClientSegment).optional(),
  q: z.string().trim().max(120).optional(),
});

export const inviteClientUserSchema = z
  .object({
    email: email.optional(),
    phone: ghanaPhone.optional(),
    fullName: z.string().trim().min(2).max(120),
    relationship: z
      .enum(["PRIMARY", "MEMBER", "ACCOUNTANT", "REPRESENTATIVE"])
      .default("MEMBER"),
    canApprove: z.boolean().default(false),
  })
  .strict()
  .refine((v) => v.email ?? v.phone, {
    message: "an email or phone number is required",
    path: ["email"],
  });

export const clientContactSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    role: z.string().trim().max(80).optional(),
    email: email.optional(),
    phone: ghanaPhone.optional(),
    isEmergency: z.boolean().default(false),
  })
  .strict();

export const advanceOnboardingSchema = z
  .object({
    step: z.number().int().min(1).max(10),
    kycStatus: z
      .enum(["NOT_STARTED", "SUBMITTED", "VERIFIED", "REJECTED"])
      .optional(),
    agreementAccepted: z.boolean().optional(),
  })
  .strict();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientQuery = z.infer<typeof listClientQuery>;
export type InviteClientUserInput = z.infer<typeof inviteClientUserSchema>;
export type ClientContactInput = z.infer<typeof clientContactSchema>;

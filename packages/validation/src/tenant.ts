import { z } from "zod";
import { TenantStatus } from "@nexahaus/types";
import { email, ghanaPhone, paginationQuery } from "./common.js";

export const createTenantSchema = z
  .object({
    fullName: z.string().trim().min(2).max(160),
    phone: ghanaPhone,
    email: email.optional(),
    emergencyContactName: z.string().trim().max(120).optional(),
    emergencyContactPhone: ghanaPhone.optional(),
    idDocumentType: z
      .enum(["GHANA_CARD", "PASSPORT", "DRIVERS_LICENCE", "VOTER_ID", "OTHER"])
      .optional(),
    /** Stored encrypted at rest; never returned in full. */
    idDocumentRef: z.string().trim().max(64).optional(),
  })
  .strict();

export const updateTenantSchema = createTenantSchema
  .partial()
  .extend({ status: z.nativeEnum(TenantStatus).optional() })
  .strict();

export const listTenantQuery = paginationQuery.extend({
  status: z.nativeEnum(TenantStatus).optional(),
  propertyId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type ListTenantQuery = z.infer<typeof listTenantQuery>;

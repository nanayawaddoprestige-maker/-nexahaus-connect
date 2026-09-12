import { z } from "zod";
import { LeaseFrequency, LeaseStatus } from "@nexahaus/types";
import {
  dateOnly,
  moneyInput,
  paginationQuery,
  positiveMinor,
  uuid,
} from "./common.js";

export const createLeaseSchema = z
  .object({
    propertyId: uuid,
    unitId: uuid,
    tenantIds: z.array(uuid).min(1).max(6),
    primaryTenantId: uuid,
    startDate: dateOnly,
    endDate: dateOnly,
    rent: moneyInput,
    frequency: z.nativeEnum(LeaseFrequency).default(LeaseFrequency.MONTHLY),
    customFrequencyDays: z.number().int().min(1).max(3650).optional(),
    deposit: moneyInput.optional(),
    noticePeriodDays: z.number().int().min(0).max(365).default(30),
    documentId: uuid.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Date(v.endDate) <= new Date(v.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "end date must be after the start date",
      });
    }
    if (!v.tenantIds.includes(v.primaryTenantId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryTenantId"],
        message: "the primary tenant must be one of the lease tenants",
      });
    }
    if (v.frequency === "CUSTOM" && !v.customFrequencyDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customFrequencyDays"],
        message: "customFrequencyDays is required for a custom frequency",
      });
    }
  });

export const updateLeaseSchema = z
  .object({
    endDate: dateOnly.optional(),
    rent: moneyInput.optional(),
    noticePeriodDays: z.number().int().min(0).max(365).optional(),
    documentId: uuid.optional(),
  })
  .strict();

export const renewLeaseSchema = z
  .object({
    newEndDate: dateOnly,
    newRent: moneyInput.optional(),
  })
  .strict();

export const terminateLeaseSchema = z
  .object({
    effectiveDate: dateOnly,
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export const listLeaseQuery = paginationQuery.extend({
  status: z.nativeEnum(LeaseStatus).optional(),
  propertyId: uuid.optional(),
  unitId: uuid.optional(),
  tenantId: uuid.optional(),
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
});

export const waiveRentChargeSchema = z
  .object({ reason: z.string().trim().min(3).max(300) })
  .strict();

export const recordPaymentSchema = z
  .object({
    leaseId: uuid,
    amount: moneyInput,
    receivedAt: z.string().datetime({ offset: true }),
    method: z.enum([
      "MOBILE_MONEY",
      "BANK_TRANSFER",
      "BANK_DEPOSIT",
      "CASH",
      "ONLINE",
      "OTHER",
    ]),
    reference: z.string().trim().max(120).optional(),
    /** Allocate explicitly to charges; otherwise oldest-first. */
    allocations: z
      .array(z.object({ rentChargeId: uuid, amount: positiveMinor }))
      .optional(),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type RenewLeaseInput = z.infer<typeof renewLeaseSchema>;
export type TerminateLeaseInput = z.infer<typeof terminateLeaseSchema>;
export type ListLeaseQuery = z.infer<typeof listLeaseQuery>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

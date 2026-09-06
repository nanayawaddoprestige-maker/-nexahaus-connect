import { z } from "zod";
import { MaintenancePriority, MaintenanceStatus } from "@nexahaus/types";
import { dateOnly, isoDate, moneyInput, paginationQuery, uuid } from "./common.js";

export const createMaintenanceSchema = z
  .object({
    propertyId: uuid,
    unitId: uuid.optional(),
    leaseId: uuid.optional(),
    category: z.string().trim().min(2).max(60),
    priority: z.nativeEnum(MaintenancePriority).default(MaintenancePriority.MEDIUM),
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(3).max(4000),
    mediaDocumentIds: z.array(uuid).max(20).optional(),
  })
  .strict();

export const transitionMaintenanceSchema = z
  .object({
    toStatus: z.nativeEnum(MaintenanceStatus),
    note: z.string().trim().max(1000).optional(),
    estimatedCost: moneyInput.optional(),
    scheduledFor: isoDate.optional(),
  })
  .strict();

export const assignVendorSchema = z
  .object({
    vendorId: uuid.optional(),
    assignedUserId: uuid.optional(),
    scheduledFor: isoDate.optional(),
    estimatedCost: moneyInput.optional(),
  })
  .strict()
  .refine((v) => v.vendorId ?? v.assignedUserId, {
    message: "assign a vendor or a staff member",
    path: ["vendorId"],
  });

export const completeWorkOrderSchema = z
  .object({
    actualCost: moneyInput,
    completionNotes: z.string().trim().max(2000).optional(),
    invoiceDocumentId: uuid.optional(),
    afterMediaDocumentIds: z.array(uuid).max(20).optional(),
  })
  .strict();

export const listMaintenanceQuery = paginationQuery.extend({
  status: z.nativeEnum(MaintenanceStatus).optional(),
  priority: z.nativeEnum(MaintenancePriority).optional(),
  propertyId: uuid.optional(),
  openOnly: z.coerce.boolean().optional(),
});

export const createVendorSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    type: z.enum(["COMPANY", "INDIVIDUAL"]).default("COMPANY"),
    categories: z.array(z.string().trim().min(2).max(40)).min(1).max(20),
    phone: z.string().trim().min(7).max(20),
    email: z.string().email().optional(),
    region: z.string().trim().max(80).optional(),
    servicesDescription: z.string().trim().max(1000).optional(),
    insuranceExpiryAt: isoDate.optional(),
  })
  .strict();

export const updateVendorSchema = createVendorSchema
  .partial()
  .extend({ status: z.enum(["ACTIVE", "SUSPENDED", "BLACKLISTED"]).optional() })
  .strict();

export const preventivePlanSchema = z
  .object({
    propertyId: uuid,
    unitId: uuid.optional(),
    serviceType: z.string().trim().min(2).max(60),
    frequency: z.enum(["MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL", "CUSTOM"]),
    intervalDays: z.number().int().min(1).max(3650).optional(),
    nextDueAt: dateOnly,
    vendorId: uuid.optional(),
    active: z.boolean().default(true),
  })
  .strict();

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type TransitionMaintenanceInput = z.infer<typeof transitionMaintenanceSchema>;
export type AssignVendorInput = z.infer<typeof assignVendorSchema>;
export type CompleteWorkOrderInput = z.infer<typeof completeWorkOrderSchema>;
export type ListMaintenanceQuery = z.infer<typeof listMaintenanceQuery>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type PreventivePlanInput = z.infer<typeof preventivePlanSchema>;

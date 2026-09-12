import { z } from "zod";
import {
  InspectionFrequency,
  ManagementFeeType,
  PropertyStatus,
  PropertyType,
  UnitStatus,
} from "@nexahaus/types";
import {
  dateOnly,
  moneyInput,
  paginationQuery,
  positiveMinor,
  uuid,
} from "./common.js";

export const createPropertySchema = z
  .object({
    clientId: uuid,
    name: z.string().trim().min(2).max(160),
    type: z.nativeEnum(PropertyType),
    addressLine: z.string().trim().min(3).max(240),
    areaId: uuid.optional(),
    city: z.string().trim().min(2).max(120),
    region: z.string().trim().min(2).max(120),
    country: z.string().trim().length(2).default("GH"),
    gpsLat: z.number().gte(-90).lte(90).optional(),
    gpsLng: z.number().gte(-180).lte(180).optional(),
    ownershipStatus: z.string().max(120).optional(),
    acquisitionDate: dateOnly.optional(),
    estimatedValue: moneyInput.optional(),
    bedrooms: z.number().int().min(0).max(100).optional(),
    bathrooms: z.number().int().min(0).max(100).optional(),
    floorAreaSqm: z.number().positive().optional(),
    landSizeSqm: z.number().positive().optional(),
    description: z.string().max(4000).optional(),
  })
  .strict();

export const updatePropertySchema = createPropertySchema
  .partial()
  .extend({ status: z.nativeEnum(PropertyStatus).optional() })
  .strict();

export const listPropertyQuery = paginationQuery.extend({
  status: z.nativeEnum(PropertyStatus).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  clientId: uuid.optional(),
  managerId: uuid.optional(),
  q: z.string().trim().max(120).optional(),
});

export const createUnitSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    buildingId: uuid.optional(),
    floorId: uuid.optional(),
    bedrooms: z.number().int().min(0).max(100).optional(),
    bathrooms: z.number().int().min(0).max(100).optional(),
    floorAreaSqm: z.number().positive().optional(),
    marketRent: moneyInput.optional(),
    status: z.nativeEnum(UnitStatus).default(UnitStatus.VACANT),
  })
  .strict();

export const updateUnitSchema = createUnitSchema.partial().strict();

export const managementAgreementSchema = z
  .object({
    feeType: z.nativeEnum(ManagementFeeType),
    feePercent: z.number().gt(0).lte(100).optional(),
    feeFixedMinor: positiveMinor.optional(),
    feeCurrency: z.string().length(3).default("GHS"),
    startDate: dateOnly,
    endDate: dateOnly.optional(),
    inspectionFrequency: z.nativeEnum(InspectionFrequency),
    maintenanceApprovalThresholdMinor: positiveMinor,
    thresholdCurrency: z.string().length(3).default("GHS"),
    documentId: uuid.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const pct =
      v.feeType === "PERCENT_OF_COLLECTED" ||
      v.feeType === "PERCENT_OF_EXPECTED";
    if (pct && v.feePercent === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feePercent"],
        message: "feePercent is required for a percentage fee type",
      });
    }
    if (v.feeType === "FIXED_MONTHLY" && v.feeFixedMinor === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feeFixedMinor"],
        message: "feeFixedMinor is required for a fixed fee type",
      });
    }
  });

export const assignManagerSchema = z
  .object({
    userId: uuid,
    role: z.enum([
      "PROPERTY_MANAGER",
      "MAINTENANCE_OFFICER",
      "INSPECTOR",
      "LEASING_OFFICER",
      "SUPPORT_STAFF",
    ]),
    startDate: dateOnly,
    endDate: dateOnly.optional(),
  })
  .strict();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type ListPropertyQuery = z.infer<typeof listPropertyQuery>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type ManagementAgreementInput = z.infer<
  typeof managementAgreementSchema
>;

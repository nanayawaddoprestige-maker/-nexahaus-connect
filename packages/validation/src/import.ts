import { z } from "zod";
import {
  ClientSegment,
  ClientType,
  PropertyType,
  TenantStatus,
  UnitStatus,
} from "@nexahaus/types";
import { email, ghanaPhone } from "./common.js";

/** CSV cells arrive as strings; coerce where a number/int is expected. */
const intFromString = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" || v == null ? undefined : Number(v)))
  .pipe(z.number().int().nonnegative().optional());

const minorFromString = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" || v == null ? undefined : String(v)))
  .pipe(z.string().regex(/^\d+$/, "must be whole minor units").optional());

export const importClientRow = z
  .object({
    type: z.nativeEnum(ClientType).default(ClientType.INDIVIDUAL),
    displayName: z.string().trim().min(2).max(160),
    legalName: z.string().trim().max(200).optional().or(z.literal("")),
    segment: z.nativeEnum(ClientSegment).default(ClientSegment.OTHER),
    primaryEmail: email.optional().or(z.literal("")),
    primaryPhone: ghanaPhone.optional().or(z.literal("")),
    countryOfResidence: z.string().trim().max(2).optional().or(z.literal("")),
  })
  .strip();

export const importPropertyRow = z
  .object({
    clientRef: z.string().trim().min(3),
    name: z.string().trim().min(2).max(160),
    type: z.nativeEnum(PropertyType),
    addressLine: z.string().trim().min(3).max(240),
    city: z.string().trim().min(2).max(120),
    region: z.string().trim().min(2).max(120),
    country: z.string().trim().length(2).default("GH").catch("GH"),
    bedrooms: intFromString,
    bathrooms: intFromString,
    estimatedValueMinor: minorFromString,
    estimatedValueCurrency: z
      .string()
      .trim()
      .length(3)
      .optional()
      .or(z.literal("")),
  })
  .strip();

export const importUnitRow = z
  .object({
    propertyRef: z.string().trim().min(3),
    label: z.string().trim().min(1).max(60),
    bedrooms: intFromString,
    bathrooms: intFromString,
    marketRentMinor: minorFromString,
    marketRentCurrency: z
      .string()
      .trim()
      .length(3)
      .optional()
      .or(z.literal("")),
    status: z.nativeEnum(UnitStatus).default(UnitStatus.VACANT),
  })
  .strip();

export const importTenantRow = z
  .object({
    fullName: z.string().trim().min(2).max(160),
    phone: ghanaPhone,
    email: email.optional().or(z.literal("")),
    emergencyContactName: z
      .string()
      .trim()
      .max(120)
      .optional()
      .or(z.literal("")),
    emergencyContactPhone: ghanaPhone.optional().or(z.literal("")),
    status: z.nativeEnum(TenantStatus).default(TenantStatus.ACTIVE),
  })
  .strip();

export const IMPORT_ROW_SCHEMAS = {
  CLIENT: importClientRow,
  PROPERTY: importPropertyRow,
  UNIT: importUnitRow,
  TENANT: importTenantRow,
} as const;

export type ImportEntity = keyof typeof IMPORT_ROW_SCHEMAS;

export const createImportSchema = z
  .object({
    entity: z.enum(["CLIENT", "PROPERTY", "UNIT", "TENANT"]),
    csv: z.string().max(5_000_000).optional(),
    rows: z.array(z.record(z.string(), z.unknown())).max(20_000).optional(),
  })
  .strict()
  .refine((v) => v.csv || v.rows, { message: "provide csv or rows" });

export type CreateImportInput = z.infer<typeof createImportSchema>;

import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@nexahaus/types";

/** Reusable primitives shared across all resource schemas. */

export const uuid = z.string().uuid();

/** Ghana phone numbers in E.164 (+233XXXXXXXXX) or local 0XXXXXXXXX form. */
export const ghanaPhone = z
  .string()
  .trim()
  .regex(/^(\+233\d{9}|0\d{9})$/, "must be a valid Ghana phone number");

export const email = z.string().trim().toLowerCase().email();

export const password = z
  .string()
  .min(12, "password must be at least 12 characters")
  .max(128)
  .regex(/[a-z]/, "must contain a lowercase letter")
  .regex(/[A-Z]/, "must contain an uppercase letter")
  .regex(/\d/, "must contain a digit");

/** Money in a request/response body: integer minor units as a string + currency. */
export const moneyInput = z.object({
  minor: z
    .string()
    .regex(/^-?\d+$/, "minor units must be an integer string")
    .refine((v) => {
      try {
        BigInt(v);
        return true;
      } catch {
        return false;
      }
    }, "minor units out of range"),
  currency: z.string().length(3).toUpperCase(),
});

export const positiveMinor = z
  .string()
  .regex(/^\d+$/, "must be a non-negative integer string");

export const isoDate = z.string().datetime({ offset: true });
export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),
  sort: z
    .string()
    .regex(/^[a-zA-Z]+:(asc|desc)(,[a-zA-Z]+:(asc|desc))*$/)
    .optional(),
});

export const dateRangeQuery = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  range: z.enum(["this_month", "3m", "6m", "12m"]).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;
export type DateRangeQuery = z.infer<typeof dateRangeQuery>;
export type MoneyInput = z.infer<typeof moneyInput>;

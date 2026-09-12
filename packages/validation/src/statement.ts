import { z } from "zod";
import { dateOnly, moneyInput, paginationQuery, uuid } from "./common.js";

export const generateStatementSchema = z
  .object({
    clientId: uuid,
    /** Omit for a portfolio statement across all the client's properties. */
    propertyId: uuid.optional(),
    periodStart: dateOnly,
    periodEnd: dateOnly,
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Date(v.periodEnd) <= new Date(v.periodStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodEnd"],
        message: "period end must be after the start",
      });
    }
  });

export const listStatementQuery = paginationQuery.extend({
  clientId: uuid.optional(),
  propertyId: uuid.optional(),
  status: z.enum(["DRAFT", "ISSUED", "SENT", "ARCHIVED"]).optional(),
});

export const createDistributionSchema = z
  .object({
    clientId: uuid,
    propertyId: uuid.optional(),
    statementId: uuid.optional(),
    periodStart: dateOnly,
    periodEnd: dateOnly,
    amount: moneyInput,
    method: z
      .enum(["MOBILE_MONEY", "BANK_TRANSFER", "OTHER"])
      .default("BANK_TRANSFER"),
  })
  .strict();

export type GenerateStatementInput = z.infer<typeof generateStatementSchema>;
export type ListStatementQuery = z.infer<typeof listStatementQuery>;
export type CreateDistributionInput = z.infer<typeof createDistributionSchema>;

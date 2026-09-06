import { z } from "zod";
import { ExpenseCategory } from "@nexahaus/types";
import { isoDate, moneyInput, paginationQuery, uuid } from "./common.js";

export const createExpenseSchema = z
  .object({
    propertyId: uuid,
    unitId: uuid.optional(),
    vendorId: uuid.optional(),
    category: z.nativeEnum(ExpenseCategory),
    description: z.string().trim().min(3).max(1000),
    amount: moneyInput,
    tax: moneyInput.optional(),
    invoiceDocumentId: uuid.optional(),
    incurredAt: isoDate,
    maintenanceRequestId: uuid.optional(),
  })
  .strict();

export const updateExpenseSchema = createExpenseSchema.partial().strict();

export const listExpenseQuery = paginationQuery.extend({
  status: z
    .enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID", "VOID"])
    .optional(),
  approvalStatus: z
    .enum(["NOT_REQUIRED", "PENDING", "APPROVED", "DECLINED"])
    .optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  propertyId: uuid.optional(),
});

export const payExpenseSchema = z
  .object({
    method: z.enum(["MOBILE_MONEY", "BANK_TRANSFER", "BANK_DEPOSIT", "CASH", "OTHER"]),
    reference: z.string().trim().max(120).optional(),
    paidAt: isoDate.optional(),
  })
  .strict();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpenseQuery = z.infer<typeof listExpenseQuery>;
export type PayExpenseInput = z.infer<typeof payExpenseSchema>;

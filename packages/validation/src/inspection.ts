import { z } from "zod";
import {
  ConditionRating,
  InspectionItemRating,
  InspectionType,
} from "@nexahaus/types";
import { isoDate, paginationQuery, uuid } from "./common.js";

export const createInspectionSchema = z
  .object({
    propertyId: uuid,
    unitId: uuid.optional(),
    type: z.nativeEnum(InspectionType),
    templateId: uuid.optional(),
    inspectorUserId: uuid,
    scheduledFor: isoDate.optional(),
  })
  .strict();

export const inspectionItemInput = z.object({
  area: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  rating: z.nativeEnum(InspectionItemRating),
  note: z.string().trim().max(1000).optional(),
  recommendation: z.string().trim().max(1000).optional(),
  mediaDocumentIds: z.array(uuid).max(10).optional(),
});

export const submitInspectionSchema = z
  .object({
    overallCondition: z.nativeEnum(ConditionRating),
    inspectorSignatureRef: z.string().trim().max(200).optional(),
    items: z.array(inspectionItemInput).min(1).max(200),
  })
  .strict();

export const reviewInspectionSchema = z
  .object({
    note: z.string().trim().max(1000).optional(),
    issueReport: z.boolean().default(true),
  })
  .strict();

export const listInspectionQuery = paginationQuery.extend({
  status: z
    .enum([
      "ASSIGNED",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "REVIEWED",
      "REPORT_ISSUED",
    ])
    .optional(),
  type: z.nativeEnum(InspectionType).optional(),
  propertyId: uuid.optional(),
  inspectorUserId: uuid.optional(),
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type SubmitInspectionInput = z.infer<typeof submitInspectionSchema>;
export type ReviewInspectionInput = z.infer<typeof reviewInspectionSchema>;
export type ListInspectionQuery = z.infer<typeof listInspectionQuery>;

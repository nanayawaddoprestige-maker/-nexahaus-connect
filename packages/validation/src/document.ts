import { z } from "zod";
import { DocumentCategory, DocumentScopeType } from "@nexahaus/types";
import { isoDate, paginationQuery, uuid } from "./common.js";

/** Upload allow-list — enforced again server-side by magic bytes on finalize. */
export const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const requestUploadSchema = z
  .object({
    scopeType: z.nativeEnum(DocumentScopeType),
    scopeId: uuid,
    category: z.nativeEnum(DocumentCategory),
    title: z.string().trim().min(1).max(200),
    mimeType: z.enum(ALLOWED_MIME),
    sizeBytes: z.number().int().positive(),
    expiresAt: isoDate.optional(),
  })
  .strict();

export const finalizeUploadSchema = z
  .object({
    checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i, "expected a SHA-256 hex digest"),
  })
  .strict();

export const newVersionSchema = z
  .object({
    mimeType: z.enum(ALLOWED_MIME),
    sizeBytes: z.number().int().positive(),
  })
  .strict();

export const listDocumentQuery = paginationQuery.extend({
  scopeType: z.nativeEnum(DocumentScopeType).optional(),
  scopeId: uuid.optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type FinalizeUploadInput = z.infer<typeof finalizeUploadSchema>;
export type ListDocumentQuery = z.infer<typeof listDocumentQuery>;

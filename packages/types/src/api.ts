/**
 * Shared API contract types — the response envelope, pagination, and the stable
 * machine-readable error codes. Mirrors docs/API.md.
 */

export interface ResponseMeta {
  requestId: string;
  [key: string]: unknown;
}

export interface ListMeta extends ResponseMeta {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  /** Present for cursor-paginated feeds. */
  nextCursor?: string | null;
  sort?: string;
  filters?: Record<string, unknown>;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ListResponse<T> {
  success: true;
  data: T[];
  meta: ListMeta;
}

export interface ErrorDetail {
  path: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
  meta: ResponseMeta;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export const ApiErrorCode = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  IDEMPOTENCY_REPLAY: "IDEMPOTENCY_REPLAY",
  RATE_LIMITED: "RATE_LIMITED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  WEBHOOK_SIGNATURE_INVALID: "WEBHOOK_SIGNATURE_INVALID",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
  RECONCILED_RECORD_IMMUTABLE: "RECONCILED_RECORD_IMMUTABLE",
  ILLEGAL_STATE_TRANSITION: "ILLEGAL_STATE_TRANSITION",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
}

export interface DateRangeQuery {
  from?: string;
  to?: string;
  range?: "this_month" | "3m" | "6m" | "12m";
}

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { map, type Observable } from "rxjs";
import type { SuccessResponse, ListResponse } from "@nexahaus/types";

/**
 * Wraps every successful controller return value in the standard envelope
 * (docs/API.md §2). A controller that returns `{ data, meta }` where `data` is
 * an array is emitted as a ListResponse; otherwise a SuccessResponse.
 *
 * Controllers may attach list metadata by returning
 * `{ __list: true, items, meta }`.
 */
interface ListEnvelope<T> {
  __list: true;
  items: T[];
  meta?: Record<string, unknown>;
}

function isListEnvelope(value: unknown): value is ListEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { __list?: unknown }).__list === true
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<unknown> | ListResponse<unknown>> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse<Response>();
    const requestId = req.id ?? req.header("x-request-id") ?? randomUUID();
    res.setHeader("x-request-id", requestId);

    return next.handle().pipe(
      map((payload: unknown) => {
        if (isListEnvelope(payload)) {
          return {
            success: true as const,
            data: payload.items,
            meta: { requestId, ...(payload.meta ?? {}) },
          };
        }
        return {
          success: true as const,
          data: payload ?? null,
          meta: { requestId },
        };
      }),
    );
  }
}

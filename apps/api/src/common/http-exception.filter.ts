import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { ApiErrorCode, type ErrorResponse } from "@nexahaus/types";
import { AppError } from "./app-error";

/**
 * Maps every thrown error to the standard error envelope (docs/API.md §2).
 * 5xx never leaks a stack trace, SQL, or infra detail to the client — only a
 * generic message plus the correlation id, which is logged server-side.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();
    const requestId = req.id ?? req.header("x-request-id") ?? randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorResponse["error"] = {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred. Please try again.",
    };

    if (exception instanceof AppError) {
      status = exception.getStatus();
      const payload = exception.getResponse() as {
        code: ApiErrorCode;
        message: string;
        details?: ErrorResponse["error"]["details"];
      };
      body = { code: payload.code, message: payload.message, details: payload.details };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();
      const message =
        typeof raw === "string"
          ? raw
          : ((raw as { message?: string | string[] }).message ?? exception.message);
      body = {
        code: mapStatusToCode(status),
        message: Array.isArray(message) ? message.join("; ") : message,
      };
    }

    if (status >= 500) {
      this.logger.error(
        { requestId, err: exception, path: req.url, method: req.method },
        "Unhandled error",
      );
    } else {
      this.logger.warn({ requestId, code: body.code, path: req.url }, body.message);
    }

    res.setHeader("x-request-id", requestId);
    res.status(status).json({
      success: false,
      error: body,
      meta: { requestId },
    } satisfies ErrorResponse);
  }
}

function mapStatusToCode(status: number): ApiErrorCode {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return ApiErrorCode.UNAUTHENTICATED;
    case HttpStatus.FORBIDDEN:
      return ApiErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ApiErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ApiErrorCode.CONFLICT;
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return ApiErrorCode.VALIDATION_FAILED;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ApiErrorCode.RATE_LIMITED;
    case HttpStatus.PAYLOAD_TOO_LARGE:
      return ApiErrorCode.PAYLOAD_TOO_LARGE;
    case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
      return ApiErrorCode.UNSUPPORTED_MEDIA_TYPE;
    default:
      return ApiErrorCode.INTERNAL_ERROR;
  }
}

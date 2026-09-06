import { HttpException, HttpStatus } from "@nestjs/common";
import { ApiErrorCode, type ErrorDetail } from "@nexahaus/types";

/**
 * The single error type thrown throughout the API. The HttpExceptionFilter maps
 * it to the standard error envelope. `code` is a stable machine string; `message`
 * is safe to show an end user.
 */
export class AppError extends HttpException {
  readonly code: ApiErrorCode;
  readonly details?: ErrorDetail[];

  constructor(
    code: ApiErrorCode,
    message: string,
    status: HttpStatus,
    details?: ErrorDetail[],
  ) {
    super({ code, message, details }, status);
    this.code = code;
    this.details = details;
  }

  static validation(message: string, details?: ErrorDetail[]): AppError {
    return new AppError(
      ApiErrorCode.VALIDATION_FAILED,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    );
  }

  static unauthenticated(message = "Authentication is required."): AppError {
    return new AppError(
      ApiErrorCode.UNAUTHENTICATED,
      message,
      HttpStatus.UNAUTHORIZED,
    );
  }

  static tokenExpired(message = "Your session has expired. Please sign in again."): AppError {
    return new AppError(ApiErrorCode.TOKEN_EXPIRED, message, HttpStatus.UNAUTHORIZED);
  }

  /**
   * Use for BOTH "not permitted" and "not in your scope". The message is
   * deliberately generic so it never reveals whether the resource exists
   * (docs/SECURITY.md §2.3).
   */
  static forbidden(message = "You do not have access to this resource."): AppError {
    return new AppError(ApiErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }

  static notFound(resource = "resource", code: ApiErrorCode = ApiErrorCode.NOT_FOUND): AppError {
    return new AppError(
      code,
      `The requested ${resource} could not be found.`,
      HttpStatus.NOT_FOUND,
    );
  }

  static conflict(
    message: string,
    code: ApiErrorCode = ApiErrorCode.CONFLICT,
  ): AppError {
    return new AppError(code, message, HttpStatus.CONFLICT);
  }

  static illegalTransition(message: string): AppError {
    return new AppError(
      ApiErrorCode.ILLEGAL_STATE_TRANSITION,
      message,
      HttpStatus.CONFLICT,
    );
  }

  static reconciledImmutable(
    message = "This financial record is reconciled and cannot be modified. Post an adjustment instead.",
  ): AppError {
    return new AppError(
      ApiErrorCode.RECONCILED_RECORD_IMMUTABLE,
      message,
      HttpStatus.CONFLICT,
    );
  }

  static rateLimited(message = "Too many requests. Please try again shortly."): AppError {
    return new AppError(
      ApiErrorCode.RATE_LIMITED,
      message,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  static approvalRequired(message = "Owner approval is required before this action can proceed."): AppError {
    return new AppError(
      ApiErrorCode.APPROVAL_REQUIRED,
      message,
      HttpStatus.CONFLICT,
    );
  }

  static webhookSignatureInvalid(): AppError {
    return new AppError(
      ApiErrorCode.WEBHOOK_SIGNATURE_INVALID,
      "Webhook signature verification failed.",
      HttpStatus.BAD_REQUEST,
    );
  }
}

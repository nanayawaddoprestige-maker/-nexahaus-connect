import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import {
  recordPaymentSchema,
  type RecordPaymentInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, Public, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { AppError } from "../../common/app-error";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @Get()
  @RequirePermission("payment:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("propertyId") propertyId?: string,
    @Query("leaseId") leaseId?: string,
    @Query("status") status?: string,
    @Query("reconciliationStatus") reconciliationStatus?: string,
  ) {
    return this.payments.list(user, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      propertyId,
      leaseId,
      status,
      reconciliationStatus,
    });
  }

  @ApiBearerAuth()
  @Post("reconcile")
  @RequirePermission("payment:record")
  reconcile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).strict()))
    body: { ids: string[] },
    @Req() req: Request,
  ) {
    return this.payments.reconcile(user, body.ids, auditCtxFromRequest(req, user));
  }

  @ApiBearerAuth()
  @Get(":id")
  @RequirePermission("payment:read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.payments.getById(user, id);
  }

  @ApiBearerAuth()
  @Post()
  @RequirePermission("payment:record")
  record(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(recordPaymentSchema)) body: RecordPaymentInput,
    @Req() req: Request,
  ) {
    return this.payments.recordManual(user, body, auditCtxFromRequest(req, user));
  }

  @ApiBearerAuth()
  @Post(":id/refund")
  @RequirePermission("payment:refund")
  refund(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(z.object({ reason: z.string().trim().min(3).max(300) }).strict()))
    body: { reason: string },
    @Req() req: Request,
  ) {
    return this.payments.refund(user, id, body.reason, auditCtxFromRequest(req, user));
  }

  /** Provider callback — no auth; verified by signature over the raw body. */
  @Public()
  @ApiExcludeEndpoint()
  @Post("webhook")
  @HttpCode(200)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-signature") signature?: string,
  ) {
    const raw = req.rawBody;
    if (!raw) throw AppError.webhookSignatureInvalid();
    return this.payments.handleWebhook(raw, signature);
  }
}

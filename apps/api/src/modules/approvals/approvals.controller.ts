import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { ApprovalsService } from "./approvals.service";

const decideSchema = z
  .object({
    decision: z.enum(["APPROVED", "DECLINED", "INFO_REQUESTED"]),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

@ApiTags("approvals")
@ApiBearerAuth()
@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  @RequirePermission("approval:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("status") status?: string,
    @Query("propertyId") propertyId?: string,
  ) {
    return this.approvals.list(user, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      propertyId,
    });
  }

  @Get(":id")
  @RequirePermission("approval:read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.approvals.getById(user, id);
  }

  @Post(":id/decision")
  @RequirePermission("approval:read")
  decide(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(decideSchema))
    body: z.infer<typeof decideSchema>,
    @Req() req: Request,
  ) {
    return this.approvals.decide(
      user,
      id,
      body.decision,
      body.note,
      auditCtxFromRequest(req, user),
    );
  }
}

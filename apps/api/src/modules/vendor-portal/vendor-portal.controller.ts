import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import {
  completeWorkOrderSchema,
  type CompleteWorkOrderInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { VendorPortalService } from "./vendor-portal.service";

@ApiTags("vendor")
@ApiBearerAuth()
@Controller("vendor")
export class VendorPortalController {
  constructor(private readonly portal: VendorPortalService) {}

  @Get("me")
  @RequirePermission("workorder:read")
  me(@CurrentUser() user: AuthUser) {
    return this.portal.profile(user);
  }

  @Get("work-orders")
  @RequirePermission("workorder:read")
  workOrders(
    @CurrentUser() user: AuthUser,
    @Query("openOnly") openOnly?: string,
  ) {
    return this.portal.workOrders(user, openOnly === "true");
  }

  @Get("work-orders/:id")
  @RequirePermission("workorder:read")
  getWorkOrder(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.portal.getWorkOrder(user, id);
  }

  @Post("work-orders/:id/start")
  @RequirePermission("workorder:read")
  start(@CurrentUser() user: AuthUser, @Param("id") id: string, @Req() req: Request) {
    return this.portal.start(user, id, auditCtxFromRequest(req, user));
  }

  @Post("work-orders/:id/complete")
  @RequirePermission("workorder:read")
  complete(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(completeWorkOrderSchema)) body: CompleteWorkOrderInput,
    @Req() req: Request,
  ) {
    return this.portal.complete(user, id, body, auditCtxFromRequest(req, user));
  }
}

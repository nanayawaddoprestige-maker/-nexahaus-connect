import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import {
  assignVendorSchema,
  completeWorkOrderSchema,
  createMaintenanceSchema,
  listMaintenanceQuery,
  transitionMaintenanceSchema,
  type AssignVendorInput,
  type CompleteWorkOrderInput,
  type CreateMaintenanceInput,
  type ListMaintenanceQuery,
  type TransitionMaintenanceInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { MaintenanceService } from "./maintenance.service";

const addMediaSchema = z
  .object({
    documentIds: z.array(z.string().uuid()).min(1).max(20),
    kind: z.enum(["BEFORE", "AFTER", "OTHER"]).default("OTHER"),
  })
  .strict();

@ApiTags("maintenance")
@ApiBearerAuth()
@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Get()
  @RequirePermission("maintenance:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listMaintenanceQuery)) query: ListMaintenanceQuery,
  ) {
    return this.maintenance.list(user, query);
  }

  @Get(":id")
  @RequirePermission("maintenance:read")
  @ScopedResource({ type: "maintenance", param: "id" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.maintenance.getById(user, id);
  }

  @Post()
  @RequirePermission("maintenance:read")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createMaintenanceSchema)) body: CreateMaintenanceInput,
    @Req() req: Request,
  ) {
    return this.maintenance.create(user, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/transition")
  @RequirePermission("maintenance:transition")
  @ScopedResource({ type: "maintenance", param: "id" })
  transition(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(transitionMaintenanceSchema))
    body: TransitionMaintenanceInput,
    @Req() req: Request,
  ) {
    return this.maintenance.transition(user, id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/work-orders")
  @RequirePermission("workorder:write")
  @ScopedResource({ type: "maintenance", param: "id" })
  assign(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(assignVendorSchema)) body: AssignVendorInput,
    @Req() req: Request,
  ) {
    return this.maintenance.assignVendor(user, id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/work-orders/:workOrderId/complete")
  @RequirePermission("workorder:write")
  @ScopedResource({ type: "maintenance", param: "id" })
  completeWorkOrder(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("workOrderId") workOrderId: string,
    @Body(new ZodValidationPipe(completeWorkOrderSchema)) body: CompleteWorkOrderInput,
    @Req() req: Request,
  ) {
    return this.maintenance.completeWorkOrder(
      user,
      id,
      workOrderId,
      body,
      auditCtxFromRequest(req, user),
    );
  }

  @Post(":id/media")
  @RequirePermission("maintenance:write")
  @ScopedResource({ type: "maintenance", param: "id" })
  addMedia(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addMediaSchema)) body: z.infer<typeof addMediaSchema>,
    @Req() req: Request,
  ) {
    return this.maintenance.addMedia(
      user,
      id,
      body.documentIds,
      body.kind,
      auditCtxFromRequest(req, user),
    );
  }
}

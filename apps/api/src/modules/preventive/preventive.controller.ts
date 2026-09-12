import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import {
  preventivePlanSchema,
  type PreventivePlanInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { PreventiveService } from "./preventive.service";

const updateSchema = preventivePlanSchema
  .partial()
  .extend({ markRun: z.boolean().optional() })
  .strict();

@ApiTags("preventive-maintenance")
@ApiBearerAuth()
@Controller()
export class PreventiveController {
  constructor(private readonly preventive: PreventiveService) {}

  @Get("properties/:propertyId/preventive-plans")
  @RequirePermission("preventive:read")
  @ScopedResource({ type: "property", param: "propertyId" })
  list(@CurrentUser() user: AuthUser, @Param("propertyId") propertyId: string) {
    return this.preventive.listForProperty(user, propertyId);
  }

  @Post("preventive-plans")
  @RequirePermission("preventive:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(preventivePlanSchema))
    body: PreventivePlanInput,
    @Req() req: Request,
  ) {
    return this.preventive.create(user, body, auditCtxFromRequest(req, user));
  }

  @Patch("preventive-plans/:id")
  @RequirePermission("preventive:write")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema))
    body: z.infer<typeof updateSchema>,
    @Req() req: Request,
  ) {
    return this.preventive.update(
      user,
      id,
      body as never,
      auditCtxFromRequest(req, user),
    );
  }
}

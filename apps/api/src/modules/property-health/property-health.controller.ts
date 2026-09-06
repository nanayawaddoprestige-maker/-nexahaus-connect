import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { PropertyHealthService } from "./property-health.service";

const weightsSchema = z
  .object({
    weights: z.record(
      z.enum([
        "OCCUPANCY",
        "RENT_COLLECTION",
        "MAINTENANCE",
        "CONDITION",
        "TENANT_SATISFACTION",
        "DOCUMENTATION",
        "SECURITY",
        "FINANCIAL",
      ]),
      z.number().min(0).max(1),
    ),
  })
  .strict()
  .refine(
    (v) => Math.abs(Object.values(v.weights).reduce((s, w) => s + w, 0) - 1) < 0.001,
    { message: "weights must sum to 1", path: ["weights"] },
  );

@ApiTags("property-health")
@ApiBearerAuth()
@Controller("property-health")
export class PropertyHealthController {
  constructor(private readonly health: PropertyHealthService) {}

  @Get("config")
  @RequirePermission("health:read")
  getConfig() {
    return this.health.getConfig();
  }

  @Put("config")
  @RequirePermission("health:config")
  setConfig(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(weightsSchema)) body: z.infer<typeof weightsSchema>,
    @Req() req: Request,
  ) {
    return this.health.setConfig(user, body.weights, auditCtxFromRequest(req, user));
  }

  @Post("recompute-all")
  @HttpCode(200)
  @RequirePermission("health:recompute")
  recomputeAll(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.health.recomputeAll(auditCtxFromRequest(req, user));
  }

  @Get(":propertyId")
  @RequirePermission("health:read")
  @ScopedResource({ type: "property", param: "propertyId" })
  latest(@CurrentUser() user: AuthUser, @Param("propertyId") propertyId: string) {
    return this.health.latest(user, propertyId);
  }

  @Get(":propertyId/history")
  @RequirePermission("health:read")
  @ScopedResource({ type: "property", param: "propertyId" })
  history(@CurrentUser() user: AuthUser, @Param("propertyId") propertyId: string) {
    return this.health.history(user, propertyId);
  }

  @Post(":propertyId/recompute")
  @HttpCode(200)
  @RequirePermission("health:recompute")
  @ScopedResource({ type: "property", param: "propertyId" })
  recompute(
    @CurrentUser() user: AuthUser,
    @Param("propertyId") propertyId: string,
    @Req() req: Request,
  ) {
    return this.health.recompute(user, propertyId, auditCtxFromRequest(req, user));
  }
}

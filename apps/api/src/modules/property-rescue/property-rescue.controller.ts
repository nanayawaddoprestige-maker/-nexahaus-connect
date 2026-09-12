import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
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
import { PropertyRescueService } from "./property-rescue.service";

@ApiTags("property-rescue")
@ApiBearerAuth()
@Controller("property-rescue")
export class PropertyRescueController {
  constructor(private readonly rescue: PropertyRescueService) {}

  @Get(":propertyId")
  @RequirePermission("rescue:read")
  @ScopedResource({ type: "property", param: "propertyId" })
  latest(
    @CurrentUser() user: AuthUser,
    @Param("propertyId") propertyId: string,
  ) {
    return this.rescue.latest(user, propertyId);
  }

  @Get(":propertyId/history")
  @RequirePermission("rescue:read")
  @ScopedResource({ type: "property", param: "propertyId" })
  history(
    @CurrentUser() user: AuthUser,
    @Param("propertyId") propertyId: string,
  ) {
    return this.rescue.list(user, propertyId);
  }

  @Post("assessments")
  @RequirePermission("rescue:write")
  assess(
    @CurrentUser() user: AuthUser,
    @Body(
      new ZodValidationPipe(
        z.object({ propertyId: z.string().uuid() }).strict(),
      ),
    )
    body: { propertyId: string },
    @Req() req: Request,
  ) {
    return this.rescue.assess(
      user,
      body.propertyId,
      auditCtxFromRequest(req, user),
    );
  }

  @Get("assessments/:id")
  @RequirePermission("rescue:read")
  getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.rescue.getById(user, id);
  }

  @Patch("recommendations/:id")
  @RequirePermission("rescue:write")
  updateRecommendation(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(
      new ZodValidationPipe(
        z
          .object({
            status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "DISMISSED"]),
          })
          .strict(),
      ),
    )
    body: { status: "OPEN" | "IN_PROGRESS" | "DONE" | "DISMISSED" },
    @Req() req: Request,
  ) {
    return this.rescue.updateRecommendation(
      user,
      id,
      body.status,
      auditCtxFromRequest(req, user),
    );
  }
}

import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import {
  createUnitSchema,
  updateUnitSchema,
  type CreateUnitInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { UnitsService } from "./units.service";

const buildingSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    floors: z
      .array(
        z.object({
          level: z.number().int().min(-5).max(200),
          label: z.string().trim().min(1).max(40),
        }),
      )
      .max(200)
      .optional(),
  })
  .strict();

@ApiTags("units")
@ApiBearerAuth()
@Controller()
export class UnitsController {
  constructor(private readonly units: UnitsService) {}

  @Get("properties/:propertyId/units")
  @RequirePermission("unit:read")
  @ScopedResource({ type: "property", param: "propertyId" })
  list(@CurrentUser() user: AuthUser, @Param("propertyId") propertyId: string) {
    return this.units.listForProperty(user, propertyId);
  }

  @Post("properties/:propertyId/units")
  @RequirePermission("unit:write")
  @ScopedResource({ type: "property", param: "propertyId" })
  create(
    @CurrentUser() user: AuthUser,
    @Param("propertyId") propertyId: string,
    @Body(new ZodValidationPipe(createUnitSchema)) body: CreateUnitInput,
    @Req() req: Request,
  ) {
    return this.units.create(user, propertyId, body, auditCtxFromRequest(req, user));
  }

  @Post("properties/:propertyId/buildings")
  @RequirePermission("unit:write")
  @ScopedResource({ type: "property", param: "propertyId" })
  createBuilding(
    @CurrentUser() user: AuthUser,
    @Param("propertyId") propertyId: string,
    @Body(new ZodValidationPipe(buildingSchema))
    body: z.infer<typeof buildingSchema>,
    @Req() req: Request,
  ) {
    return this.units.createBuilding(
      user,
      propertyId,
      body,
      auditCtxFromRequest(req, user),
    );
  }

  @Get("units/:id")
  @RequirePermission("unit:read")
  @ScopedResource({ type: "unit", param: "id" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.units.getById(user, id);
  }

  @Patch("units/:id")
  @RequirePermission("unit:write")
  @ScopedResource({ type: "unit", param: "id" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUnitSchema)) body: Partial<CreateUnitInput>,
    @Req() req: Request,
  ) {
    return this.units.update(user, id, body, auditCtxFromRequest(req, user));
  }
}

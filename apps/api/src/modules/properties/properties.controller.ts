import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import {
  createPropertySchema,
  listPropertyQuery,
  updatePropertySchema,
  type CreatePropertyInput,
  type ListPropertyQuery,
  type UpdatePropertyInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import type { FinancePeriod } from "../finance/period.util";
import { PropertiesService } from "./properties.service";

@ApiTags("properties")
@ApiBearerAuth()
@Controller("properties")
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  private auditCtx(req: Request, user: AuthUser) {
    return {
      actorUserId: user.userId,
      actorRoleKey: user.roles[0] ?? null,
      ip: req.ip ?? null,
      userAgent: req.header("user-agent") ?? null,
      sessionId: user.sessionId,
      requestId: (req as Request & { id?: string }).id ?? null,
    };
  }

  @Get()
  @RequirePermission("property:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listPropertyQuery)) query: ListPropertyQuery,
  ) {
    return this.properties.list(user, query);
  }

  @Get(":id")
  @RequirePermission("property:read")
  @ScopedResource({ type: "property", param: "id" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.properties.getById(user, id);
  }

  @Get(":id/financials")
  @RequirePermission("property:read")
  @ScopedResource({ type: "property", param: "id" })
  financials(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Query("period") period: FinancePeriod = "this_month",
  ) {
    return this.properties.getFinancials(user, id, period);
  }

  @Post()
  @RequirePermission("property:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPropertySchema)) body: CreatePropertyInput,
    @Req() req: Request,
  ) {
    return this.properties.create(user, body, this.auditCtx(req, user));
  }

  @Patch(":id")
  @RequirePermission("property:write")
  @ScopedResource({ type: "property", param: "id" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePropertySchema)) body: UpdatePropertyInput,
    @Req() req: Request,
  ) {
    return this.properties.update(user, id, body, this.auditCtx(req, user));
  }
}

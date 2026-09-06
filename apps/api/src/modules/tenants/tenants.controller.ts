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
  createTenantSchema,
  listTenantQuery,
  updateTenantSchema,
  type CreateTenantInput,
  type ListTenantQuery,
  type UpdateTenantInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { TenantsService } from "./tenants.service";

@ApiTags("tenants")
@ApiBearerAuth()
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @RequirePermission("tenant:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listTenantQuery)) query: ListTenantQuery,
  ) {
    return this.tenants.list(user, query);
  }

  @Get(":id")
  @RequirePermission("tenant:read")
  @ScopedResource({ type: "tenant", param: "id" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.tenants.getById(user, id);
  }

  @Post()
  @RequirePermission("tenant:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTenantSchema)) body: CreateTenantInput,
    @Req() req: Request,
  ) {
    return this.tenants.create(user, body, auditCtxFromRequest(req, user));
  }

  @Patch(":id")
  @RequirePermission("tenant:write")
  @ScopedResource({ type: "tenant", param: "id" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTenantSchema)) body: UpdateTenantInput,
    @Req() req: Request,
  ) {
    return this.tenants.update(user, id, body, auditCtxFromRequest(req, user));
  }
}

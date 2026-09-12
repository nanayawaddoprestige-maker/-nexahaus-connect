import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import {
  createLeaseSchema,
  listLeaseQuery,
  renewLeaseSchema,
  terminateLeaseSchema,
  type CreateLeaseInput,
  type ListLeaseQuery,
  type RenewLeaseInput,
  type TerminateLeaseInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { LeasesService } from "./leases.service";

@ApiTags("leases")
@ApiBearerAuth()
@Controller("leases")
export class LeasesController {
  constructor(private readonly leases: LeasesService) {}

  @Get()
  @RequirePermission("lease:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listLeaseQuery)) query: ListLeaseQuery,
  ) {
    return this.leases.list(user, query);
  }

  @Get(":id")
  @RequirePermission("lease:read")
  @ScopedResource({ type: "lease", param: "id" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.leases.getById(user, id);
  }

  @Post()
  @RequirePermission("lease:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createLeaseSchema)) body: CreateLeaseInput,
    @Req() req: Request,
  ) {
    return this.leases.create(user, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/activate")
  @RequirePermission("lease:write")
  @ScopedResource({ type: "lease", param: "id" })
  activate(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.leases.activate(user, id, auditCtxFromRequest(req, user));
  }

  @Post(":id/renew")
  @RequirePermission("lease:write")
  @ScopedResource({ type: "lease", param: "id" })
  renew(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(renewLeaseSchema)) body: RenewLeaseInput,
    @Req() req: Request,
  ) {
    return this.leases.renew(user, id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/terminate")
  @RequirePermission("lease:terminate")
  @ScopedResource({ type: "lease", param: "id" })
  terminate(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(terminateLeaseSchema))
    body: TerminateLeaseInput,
    @Req() req: Request,
  ) {
    return this.leases.terminate(
      user,
      id,
      body,
      auditCtxFromRequest(req, user),
    );
  }
}

import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "@nexahaus/types";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { AuditService } from "../../audit/audit.service";
import { AdminService } from "./admin.service";

/**
 * NexaHaus staff admin dashboard. `client:read` is held by every staff role and
 * by no owner/tenant, so it gates this controller to internal users.
 */
@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditService,
  ) {}

  @Get("overview")
  @RequirePermission("client:read")
  overview(@CurrentUser() user: AuthUser) {
    return this.admin.overview(user);
  }

  @Get("clients")
  @RequirePermission("client:read")
  clients(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sort") sort?: string,
    @Query("status") status?: string,
    @Query("q") q?: string,
  ) {
    return this.admin.listClients(user, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sort,
      status,
      q,
    });
  }

  @Get("audit-logs")
  @RequirePermission("audit:read")
  auditLogs(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("resourceType") resourceType?: string,
    @Query("actorUserId") actorUserId?: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.audit.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      resourceType,
      actorUserId,
      action,
      from,
      to,
    });
  }
}

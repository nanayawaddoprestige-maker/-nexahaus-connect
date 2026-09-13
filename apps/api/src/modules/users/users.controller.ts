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
  acceptInviteSchema,
  changeUserRoleSchema,
  changeUserStatusSchema,
  inviteStaffUserSchema,
  listStaffUserQuery,
  type AcceptInviteInput,
  type ChangeUserRoleInput,
  type ChangeUserStatusInput,
  type InviteStaffUserInput,
  type ListStaffUserQuery,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  Public,
  RequirePermission,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiBearerAuth()
  @Get()
  @RequirePermission("user:read")
  list(
    @Query(new ZodValidationPipe(listStaffUserQuery)) query: ListStaffUserQuery,
  ) {
    return this.users.list(query);
  }

  @ApiBearerAuth()
  @Post("invite")
  @RequirePermission("user:write")
  invite(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(inviteStaffUserSchema))
    body: InviteStaffUserInput,
    @Req() req: Request,
  ) {
    return this.users.invite(user, body, auditCtxFromRequest(req, user));
  }

  @Public()
  @Post("accept-invite")
  acceptInvite(
    @Body(new ZodValidationPipe(acceptInviteSchema)) body: AcceptInviteInput,
    @Req() req: Request,
  ) {
    return this.users.acceptInvite(body, {
      ip: req.ip ?? null,
      userAgent: req.header("user-agent") ?? null,
    });
  }

  @ApiBearerAuth()
  @Post(":id/resend-invite")
  @RequirePermission("user:write")
  resendInvite(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.users.resendInvite(user, id, auditCtxFromRequest(req, user));
  }

  @ApiBearerAuth()
  @Patch(":id/role")
  @RequirePermission("role:write")
  changeRole(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(changeUserRoleSchema))
    body: ChangeUserRoleInput,
    @Req() req: Request,
  ) {
    return this.users.changeRole(
      user,
      id,
      body,
      auditCtxFromRequest(req, user),
    );
  }

  @ApiBearerAuth()
  @Patch(":id/status")
  @RequirePermission("user:write")
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(changeUserStatusSchema))
    body: ChangeUserStatusInput,
    @Req() req: Request,
  ) {
    return this.users.changeStatus(
      user,
      id,
      body,
      auditCtxFromRequest(req, user),
    );
  }
}

import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "@nexahaus/types";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { TenantPortalService } from "./tenant-portal.service";

@ApiTags("tenant")
@ApiBearerAuth()
@Controller("tenant")
export class TenantPortalController {
  constructor(private readonly portal: TenantPortalService) {}

  @Get("me")
  @RequirePermission("tenant:self:read")
  me(@CurrentUser() user: AuthUser) {
    return this.portal.me(user);
  }

  @Get("lease")
  @RequirePermission("tenant:self:read")
  lease(@CurrentUser() user: AuthUser) {
    return this.portal.lease(user);
  }

  @Get("rent")
  @RequirePermission("tenant:self:payment:read")
  rent(@CurrentUser() user: AuthUser) {
    return this.portal.rent(user);
  }

  @Get("payments")
  @RequirePermission("tenant:self:payment:read")
  payments(@CurrentUser() user: AuthUser) {
    return this.portal.payments(user);
  }

  @Get("documents")
  @RequirePermission("tenant:self:read")
  documents(@CurrentUser() user: AuthUser) {
    return this.portal.documents(user);
  }
}

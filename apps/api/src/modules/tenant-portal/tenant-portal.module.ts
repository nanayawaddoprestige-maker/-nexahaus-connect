import { Module } from "@nestjs/common";
import { TenantPortalController } from "./tenant-portal.controller";
import { TenantPortalService } from "./tenant-portal.service";

@Module({
  controllers: [TenantPortalController],
  providers: [TenantPortalService],
})
export class TenantPortalModule {}

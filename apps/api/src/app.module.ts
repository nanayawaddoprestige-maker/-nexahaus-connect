import { randomUUID } from "node:crypto";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { loadConfig } from "@nexahaus/config";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuditModule } from "./audit/audit.module";
import { CommonModule } from "./common/common.module";
import { TelemetryModule } from "./common/observability/telemetry.module";
import { HealthModule } from "./health/health.module";
import { AuthzModule } from "./modules/authz/authz.module";
import { AuthGuard } from "./modules/authz/auth.guard";
import { PermissionGuard } from "./modules/authz/permission.guard";
import { ResourceScopeGuard } from "./modules/authz/resource-scope.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { AdminModule } from "./modules/admin/admin.module";
import { UsersModule } from "./modules/users/users.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { UnitsModule } from "./modules/units/units.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { LeasesModule } from "./modules/leases/leases.module";
import { StorageModule } from "./modules/storage/storage.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { EventsModule } from "./modules/events/events.module";
import { QueueModule } from "./modules/queue/queue.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { VendorsModule } from "./modules/vendors/vendors.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { PreventiveModule } from "./modules/preventive/preventive.module";
import { InspectionsModule } from "./modules/inspections/inspections.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { StatementsModule } from "./modules/statements/statements.module";
import { DistributionsModule } from "./modules/distributions/distributions.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { SchedulingModule } from "./modules/scheduling/scheduling.module";
import { PropertyHealthModule } from "./modules/property-health/property-health.module";
import { PropertyRescueModule } from "./modules/property-rescue/property-rescue.module";
import { CrmModule } from "./modules/crm/crm.module";
import { PublicModule } from "./modules/public/public.module";
import { TenantPortalModule } from "./modules/tenant-portal/tenant-portal.module";
import { VendorPortalModule } from "./modules/vendor-portal/vendor-portal.module";
import { ImportsModule } from "./modules/imports/imports.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";

const config = loadConfig();

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: config.logLevel,
        genReqId: (req) =>
          (req.headers["x-request-id"] as string | undefined) ?? randomUUID(),
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.mfaCode",
            "req.body.code",
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
        transport: config.isProduction
          ? undefined
          : { target: "pino-pretty", options: { singleLine: true } },
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: config.rateLimit.windowSec * 1000,
        limit: config.rateLimit.max,
      },
      {
        // Stricter bucket for credential endpoints (docs/SECURITY.md §6).
        name: "auth",
        ttl: config.rateLimit.windowSec * 1000,
        limit: config.rateLimit.authMax,
      },
    ]),
    ScheduleModule.forRoot(),
    ConfigModule,
    PrismaModule,
    RedisModule,
    AuditModule,
    CommonModule,
    TelemetryModule,
    StorageModule,
    EventsModule,
    QueueModule,
    ReportsModule,
    NotificationsModule,
    AuthzModule,
    HealthModule,
    AuthModule,
    ClientsModule,
    PropertiesModule,
    UnitsModule,
    TenantsModule,
    LeasesModule,
    DocumentsModule,
    VendorsModule,
    ApprovalsModule,
    MaintenanceModule,
    PreventiveModule,
    InspectionsModule,
    PaymentsModule,
    ExpensesModule,
    StatementsModule,
    DistributionsModule,
    MessagesModule,
    SchedulingModule,
    PropertyHealthModule,
    PropertyRescueModule,
    CrmModule,
    PublicModule,
    TenantPortalModule,
    VendorPortalModule,
    ImportsModule,
    IntegrationsModule,
    DashboardModule,
    AdminModule,
    UsersModule,
  ],
  providers: [
    // Order matters: rate-limit, then authenticate, then permission, then scope.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: AuthGuard },
    { provide: APP_GUARD, useExisting: PermissionGuard },
    { provide: APP_GUARD, useExisting: ResourceScopeGuard },
  ],
})
export class AppModule {}

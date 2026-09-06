import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";
import { AuthUserService } from "./auth-user.service";
import { ScopeResolverService } from "./scope-resolver.service";
import { AuthGuard } from "./auth.guard";
import { PermissionGuard } from "./permission.guard";
import { ResourceScopeGuard } from "./resource-scope.guard";

/**
 * Global authorization building blocks. The guards are exported as plain
 * providers; AppModule registers them as APP_GUARDs in the correct order
 * (Throttler → Auth → Permission → ResourceScope) so ordering is explicit.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.auth.accessSecret,
        signOptions: { expiresIn: config.auth.accessTtl },
      }),
    }),
  ],
  providers: [
    AuthUserService,
    ScopeResolverService,
    AuthGuard,
    PermissionGuard,
    ResourceScopeGuard,
  ],
  exports: [
    AuthUserService,
    ScopeResolverService,
    AuthGuard,
    PermissionGuard,
    ResourceScopeGuard,
    JwtModule,
  ],
})
export class AuthzModule {}

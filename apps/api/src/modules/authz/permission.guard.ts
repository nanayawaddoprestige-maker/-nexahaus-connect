import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { AuthUser, Permission } from "@nexahaus/types";
import { AppError } from "../../common/app-error";
import { REQUIRE_PERMISSION_KEY } from "../../common/decorators";

/**
 * Enforces `@RequirePermission(...)`. ALL listed permissions must be present in
 * the caller's flattened permission set. This grants the *kind* of access;
 * whether the caller may touch a specific record is the ResourceScopeGuard's job.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const user = request.user;
    if (!user) throw AppError.unauthenticated();

    const granted = new Set(user.permissions);
    const missing = required.filter((p) => !granted.has(p));
    if (missing.length > 0) {
      throw AppError.forbidden();
    }
    return true;
  }
}

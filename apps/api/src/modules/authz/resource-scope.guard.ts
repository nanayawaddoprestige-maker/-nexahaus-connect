import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { AuthUser } from "@nexahaus/types";
import { AppError } from "../../common/app-error";
import {
  SCOPED_RESOURCE_KEY,
  type ScopedResourceMeta,
} from "../../common/decorators";
import { ScopeResolverService } from "./scope-resolver.service";

/**
 * Enforces `@ScopedResource(...)`. Resolves the owning client (and, for staff,
 * the property) of the addressed resource and confirms it falls within the
 * caller's scope arrays. Scope-exempt roles (SUPER_ADMIN, MANAGING_DIRECTOR)
 * pass, but are still audited downstream.
 *
 * A denial is always a generic 403 that never discloses whether the resource
 * exists (docs/SECURITY.md §2.3).
 */
@Injectable()
export class ResourceScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resolver: ScopeResolverService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<ScopedResourceMeta>(
      SCOPED_RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!meta) return true;

    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthUser; params: Record<string, string> }
    >();
    const user = request.user;
    if (!user) throw AppError.unauthenticated();
    if (user.scopeExempt) return true;

    const id = request.params[meta.param ?? "id"];
    if (!id) {
      if (meta.optional) return true;
      throw AppError.forbidden();
    }

    const owner = await this.resolver.resolve(meta.type, id);
    if (!owner) {
      // Unknown resource → identical response to "not yours".
      throw AppError.forbidden();
    }

    const inClientScope =
      owner.clientId !== null && user.clientIds.includes(owner.clientId);
    const inPropertyScope =
      owner.propertyId !== null &&
      user.assignedPropertyIds.includes(owner.propertyId);
    const isOwnTenancy =
      user.tenantId !== null && owner.tenantId === user.tenantId;

    if (!inClientScope && !inPropertyScope && !isOwnTenancy) {
      throw AppError.forbidden();
    }
    return true;
  }
}

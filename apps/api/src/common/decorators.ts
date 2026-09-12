import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from "@nestjs/common";
import type { AuthUser } from "@nexahaus/types";
import type { Permission } from "@nexahaus/types";

/** Marks a route as not requiring authentication. */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);

/** Declares the permission(s) a route requires. ALL listed are required. */
export const REQUIRE_PERMISSION_KEY = "requirePermission";
export const RequirePermission = (
  ...permissions: Permission[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permissions);

/**
 * Declares how the ResourceScopeGuard should locate the owning client/property
 * for the addressed resource, e.g. `@ScopedResource({ type: 'property', param: 'id' })`.
 */
export interface ScopedResourceMeta {
  type:
    | "property"
    | "client"
    | "unit"
    | "lease"
    | "tenant"
    | "maintenance"
    | "inspection";
  /** Route param that holds the resource id. Default: 'id'. */
  param?: string;
  /** If true, a missing/invalid id is allowed (e.g. create endpoints resolve scope from the body). */
  optional?: boolean;
}
export const SCOPED_RESOURCE_KEY = "scopedResource";
export const ScopedResource = (
  meta: ScopedResourceMeta,
): MethodDecorator & ClassDecorator => SetMetadata(SCOPED_RESOURCE_KEY, meta);

/** Injects the authenticated user (populated by AuthGuard). */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | AuthUser[keyof AuthUser] => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? request.user[data] : request.user;
  },
);

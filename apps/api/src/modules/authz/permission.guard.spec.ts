import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { PermissionGuard } from "./permission.guard";
import { AppError } from "../../common/app-error";
import { ApiErrorCode } from "@nexahaus/types";

function contextWith(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe("PermissionGuard", () => {
  const reflector = new Reflector();
  const guard = new PermissionGuard(reflector);

  it("allows a route with no @RequirePermission", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    expect(guard.canActivate(contextWith({ permissions: [] }))).toBe(true);
  });

  it("allows when the user holds all required permissions", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue(["property:read", "property:write"]);
    const ctx = contextWith({
      permissions: ["property:read", "property:write", "unit:read"],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("denies with a generic 403 when a permission is missing", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue(["payment:approve"]);
    const ctx = contextWith({ permissions: ["payment:read"] });
    try {
      guard.canActivate(ctx);
      fail("expected AppError");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe(ApiErrorCode.FORBIDDEN);
    }
  });

  it("rejects an unauthenticated request", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue(["property:read"]);
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(AppError);
  });
});

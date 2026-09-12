import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "@nexahaus/types";
import { ApiErrorCode } from "@nexahaus/types";
import { ResourceScopeGuard } from "./resource-scope.guard";
import type {
  ScopeResolverService,
  ResourceOwner,
} from "./scope-resolver.service";
import { AppError } from "../../common/app-error";

function ctx(
  user: AuthUser | undefined,
  params: Record<string, string>,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function baseUser(p: Partial<AuthUser>): AuthUser {
  return {
    userId: "u1",
    email: "",
    fullName: "",
    roles: [],
    permissions: [],
    clientIds: [],
    assignedPropertyIds: [],
    tenantId: null,
    vendorId: null,
    scopeExempt: false,
    sessionId: "s",
    mfaEnabled: false,
    ...p,
  };
}

describe("ResourceScopeGuard", () => {
  const reflector = new Reflector();
  let resolver: jest.Mocked<Pick<ScopeResolverService, "resolve">>;
  let guard: ResourceScopeGuard;

  beforeEach(() => {
    resolver = { resolve: jest.fn() };
    guard = new ResourceScopeGuard(
      reflector,
      resolver as unknown as ScopeResolverService,
    );
  });

  it("passes through when no @ScopedResource metadata is present", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    await expect(guard.canActivate(ctx(baseUser({}), {}))).resolves.toBe(true);
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it("allows an owner to reach a property owned by their client", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue({ type: "property", param: "id" });
    resolver.resolve.mockResolvedValue({
      clientId: "c1",
      propertyId: "p1",
      tenantId: null,
    } satisfies ResourceOwner);
    const ok = await guard.canActivate(
      ctx(baseUser({ clientIds: ["c1"] }), { id: "p1" }),
    );
    expect(ok).toBe(true);
  });

  it("denies Owner B reaching Owner A's property with a generic 403 (no existence leak)", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue({ type: "property", param: "id" });
    resolver.resolve.mockResolvedValue({
      clientId: "ownerA-client",
      propertyId: "pA",
      tenantId: null,
    });
    try {
      await guard.canActivate(
        ctx(baseUser({ clientIds: ["ownerB-client"] }), { id: "pA" }),
      );
      fail("expected AppError");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe(ApiErrorCode.FORBIDDEN);
    }
  });

  it("denies with the SAME error when the resource does not exist", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue({ type: "property", param: "id" });
    resolver.resolve.mockResolvedValue(null);
    await expect(
      guard.canActivate(ctx(baseUser({ clientIds: ["c1"] }), { id: "ghost" })),
    ).rejects.toMatchObject({ code: ApiErrorCode.FORBIDDEN });
  });

  it("lets a scope-exempt user through without resolving", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue({ type: "property", param: "id" });
    const ok = await guard.canActivate(
      ctx(baseUser({ scopeExempt: true }), { id: "anything" }),
    );
    expect(ok).toBe(true);
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it("allows a tenant to reach their own tenancy resource", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue({ type: "maintenance", param: "id" });
    resolver.resolve.mockResolvedValue({
      clientId: "cX",
      propertyId: "pX",
      tenantId: "t1",
    });
    const ok = await guard.canActivate(
      ctx(baseUser({ tenantId: "t1" }), { id: "m1" }),
    );
    expect(ok).toBe(true);
  });

  it("rejects when no id is present and the route is not marked optional", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue({ type: "property", param: "id" });
    await expect(
      guard.canActivate(ctx(baseUser({ clientIds: ["c1"] }), {})),
    ).rejects.toBeInstanceOf(AppError);
  });
});

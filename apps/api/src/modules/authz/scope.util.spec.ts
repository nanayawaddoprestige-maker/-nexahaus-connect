import type { AuthUser } from "@nexahaus/types";
import {
  clientInScope,
  clientScopeWhere,
  propertyInScope,
  propertyScopeWhere,
} from "./scope.util";

function user(partial: Partial<AuthUser>): AuthUser {
  return {
    userId: "u1",
    email: "u1@nexahaus.example",
    fullName: "Test User",
    roles: [],
    permissions: [],
    clientIds: [],
    assignedPropertyIds: [],
    tenantId: null,
    vendorId: null,
    scopeExempt: false,
    sessionId: "s1",
    mfaEnabled: false,
    ...partial,
  };
}

describe("scope.util", () => {
  describe("propertyScopeWhere", () => {
    it("an owner is constrained to their client ids (direct + co-ownership)", () => {
      const where = propertyScopeWhere(user({ clientIds: ["c1", "c2"] }));
      expect(where.deletedAt).toBeNull();
      expect(where.OR).toEqual([
        { clientId: { in: ["c1", "c2"] } },
        { owners: { some: { clientId: { in: ["c1", "c2"] } } } },
      ]);
    });

    it("a staff member with no client links is constrained to assigned properties", () => {
      const where = propertyScopeWhere(
        user({ assignedPropertyIds: ["p9"], roles: ["PROPERTY_MANAGER"] }),
      );
      expect(where.OR).toEqual([{ id: { in: ["p9"] } }]);
    });

    it("a scope-exempt user gets an unconstrained (non-deleted) clause", () => {
      const where = propertyScopeWhere(user({ scopeExempt: true }));
      expect(where).toEqual({ deletedAt: null });
    });

    it("an owner with no clients and no assignments matches nothing", () => {
      const where = propertyScopeWhere(user({}));
      expect(where.OR).toEqual([]);
    });
  });

  describe("clientScopeWhere", () => {
    it("restricts to the caller's client ids", () => {
      expect(clientScopeWhere(user({ clientIds: ["c1"] }))).toEqual({
        deletedAt: null,
        id: { in: ["c1"] },
      });
    });
    it("matches an impossible id when the caller has no clients", () => {
      expect(clientScopeWhere(user({}))).toEqual({
        deletedAt: null,
        id: { in: ["__none__"] },
      });
    });
  });

  describe("clientInScope / propertyInScope", () => {
    it("clientInScope is true only for owned clients", () => {
      expect(clientInScope(user({ clientIds: ["c1"] }), "c1")).toBe(true);
      expect(clientInScope(user({ clientIds: ["c1"] }), "c2")).toBe(false);
      expect(clientInScope(user({ clientIds: ["c1"] }), null)).toBe(false);
    });

    it("clientInScope is always true for scope-exempt", () => {
      expect(clientInScope(user({ scopeExempt: true }), null)).toBe(true);
    });

    it("propertyInScope allows via client ownership or staff assignment", () => {
      const owner = user({ clientIds: ["c1"] });
      expect(propertyInScope(owner, { id: "p1", clientId: "c1" })).toBe(true);
      expect(propertyInScope(owner, { id: "p1", clientId: "cX" })).toBe(false);

      const staff = user({ assignedPropertyIds: ["p1"] });
      expect(propertyInScope(staff, { id: "p1", clientId: "cX" })).toBe(true);
      expect(propertyInScope(staff, { id: "p2", clientId: "cX" })).toBe(false);
    });
  });
});

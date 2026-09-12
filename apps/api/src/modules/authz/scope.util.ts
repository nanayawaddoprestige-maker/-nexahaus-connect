import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";

/**
 * Defence-in-depth query scoping. Even though the ResourceScopeGuard has already
 * validated single-resource access, every LIST / COUNT / AGGREGATE in an
 * owner/tenant-facing path must additionally constrain the query with one of
 * these helpers so a filter can never widen the result set beyond the caller's
 * scope (docs/SECURITY.md §2.2, ARCHITECTURE.md §5.1).
 *
 * Scope-exempt roles (SUPER_ADMIN, MANAGING_DIRECTOR) get an unconstrained
 * clause; their access is still audited.
 */

export function propertyScopeWhere(user: AuthUser): Prisma.PropertyWhereInput {
  if (user.scopeExempt) return { deletedAt: null };
  return {
    deletedAt: null,
    OR: [
      user.clientIds.length ? { clientId: { in: user.clientIds } } : undefined,
      user.clientIds.length
        ? { owners: { some: { clientId: { in: user.clientIds } } } }
        : undefined,
      user.assignedPropertyIds.length
        ? { id: { in: user.assignedPropertyIds } }
        : undefined,
    ].filter(Boolean) as Prisma.PropertyWhereInput[],
  };
}

/** Returns the set of property ids the caller may see, or null for "all". */
export function accessiblePropertyFilter(
  user: AuthUser,
): { all: true } | { propertyIds: string[] } {
  if (user.scopeExempt) return { all: true };
  return {
    propertyIds: [...new Set(user.assignedPropertyIds)],
  };
}

export function clientScopeWhere(user: AuthUser): Prisma.ClientWhereInput {
  if (user.scopeExempt) return { deletedAt: null };
  return {
    deletedAt: null,
    id: user.clientIds.length ? { in: user.clientIds } : { in: ["__none__"] },
  };
}

/**
 * Guard helper: throw-free check that a resolved clientId is in scope. Used by
 * services when they have already loaded a row and need to confirm ownership
 * before returning it.
 */
export function clientInScope(
  user: AuthUser,
  clientId: string | null,
): boolean {
  if (user.scopeExempt) return true;
  return clientId !== null && user.clientIds.includes(clientId);
}

export function propertyInScope(
  user: AuthUser,
  property: { id: string; clientId: string | null },
): boolean {
  if (user.scopeExempt) return true;
  if (property.clientId && user.clientIds.includes(property.clientId))
    return true;
  return user.assignedPropertyIds.includes(property.id);
}

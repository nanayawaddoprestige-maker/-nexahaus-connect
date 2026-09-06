import type { AuthUser } from "@nexahaus/types";

const STAFF_ROLES = new Set([
  "SUPER_ADMIN",
  "MANAGING_DIRECTOR",
  "PROPERTY_MANAGER",
  "FINANCE_OFFICER",
  "MAINTENANCE_OFFICER",
  "INSPECTOR",
  "LEASING_OFFICER",
  "SUPPORT_STAFF",
]);

export function isStaff(user: Pick<AuthUser, "roles"> | null | undefined): boolean {
  return !!user?.roles.some((r) => STAFF_ROLES.has(r));
}

export function isTenant(user: Pick<AuthUser, "roles"> | null | undefined): boolean {
  return !!user?.roles.includes("TENANT" as AuthUser["roles"][number]);
}

/** Where to land a user after sign-in / on hitting the app root. */
export function homePathForUser(
  user: Pick<AuthUser, "roles"> | null | undefined,
): string {
  if (isStaff(user)) return "/admin/dashboard";
  if (isTenant(user)) return "/tenant";
  return "/dashboard";
}

import { RoleKey, STAFF_ROLES } from "@nexahaus/types";
import { AppError } from "../../common/app-error";

/**
 * Privilege-escalation guard for staff role assignment (SECURITY.md §9): only
 * an existing SUPER_ADMIN may grant, hold on to, or otherwise touch the
 * SUPER_ADMIN role. Every other staff role can be freely assigned by anyone
 * holding role:write.
 */
export function assertCanSetRole(
  actorRoles: readonly RoleKey[],
  roleKey: RoleKey,
): void {
  if (!STAFF_ROLES.includes(roleKey)) {
    throw AppError.validation("That role is not a staff role.");
  }
  if (
    roleKey === RoleKey.SUPER_ADMIN &&
    !actorRoles.includes(RoleKey.SUPER_ADMIN)
  ) {
    throw AppError.forbidden(
      "Only a Super Administrator can grant the Super Administrator role.",
    );
  }
}

/** Same rule, applied when the *target* already holds SUPER_ADMIN — changing
 *  their role or status is itself a privileged action, independent of what
 *  role they're being moved to. */
export function assertCanModifySuperAdmin(
  actorRoles: readonly RoleKey[],
  targetIsSuperAdmin: boolean,
): void {
  if (targetIsSuperAdmin && !actorRoles.includes(RoleKey.SUPER_ADMIN)) {
    throw AppError.forbidden(
      "Only a Super Administrator can modify a Super Administrator account.",
    );
  }
}

import { z } from "zod";
import { RoleKey } from "@nexahaus/types";
import { email, password, paginationQuery } from "./common.js";

/** Which staff role a new colleague is invited into. SUPER_ADMIN is a valid
 *  value here at the schema level; whether the caller may actually grant it
 *  is a service-level check (only an existing SUPER_ADMIN may). */
export const inviteStaffUserSchema = z
  .object({
    email,
    fullName: z.string().trim().min(2).max(120),
    roleKey: z.nativeEnum(RoleKey),
  })
  .strict();

export const acceptInviteSchema = z
  .object({
    token: z.string().min(10),
    password,
  })
  .strict();

export const changeUserRoleSchema = z
  .object({ roleKey: z.nativeEnum(RoleKey) })
  .strict();

export const changeUserStatusSchema = z
  .object({ status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]) })
  .strict();

export const listStaffUserQuery = paginationQuery.extend({
  status: z
    .enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DISABLED"])
    .optional(),
  q: z.string().trim().max(120).optional(),
});

export type InviteStaffUserInput = z.infer<typeof inviteStaffUserSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
export type ListStaffUserQuery = z.infer<typeof listStaffUserQuery>;

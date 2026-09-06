/**
 * Authentication & authorization shared types.
 *
 * `AuthUser` is what the API attaches to a request after the AuthGuard runs, and
 * what `GET /auth/me` returns (minus token internals). Scope arrays are the
 * multi-tenant isolation boundary — see docs/SECURITY.md §2.
 */

import type { RoleKey } from "./enums.js";

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  roles: RoleKey[];
  /** Flattened union of permissions granted by all held roles. */
  permissions: string[];
  /** Client (owner) ids this user may act for — from ClientUser. */
  clientIds: string[];
  /** Property ids this staff user is assigned to — from PropertyAssignment. */
  assignedPropertyIds: string[];
  /** Tenant id when the user is a TENANT, else null. */
  tenantId: string | null;
  /** Vendor id when the user is a VENDOR, else null. */
  vendorId: string | null;
  /** True for SUPER_ADMIN / MANAGING_DIRECTOR — bypasses resource-scope checks. */
  scopeExempt: boolean;
  sessionId: string;
  mfaEnabled: boolean;
}

export interface AccessTokenPayload {
  sub: string;
  roles: RoleKey[];
  sessionId: string;
  jti: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  /** Only returned to non-cookie clients (mobile). Web receives an HttpOnly cookie. */
  refreshToken?: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface LoginResult {
  user: AuthUser;
  tokens: AuthTokens;
  /** True when the account has MFA enabled and an OTP step is still required. */
  mfaRequired: boolean;
}

export const OtpPurpose = {
  VERIFY_EMAIL: "VERIFY_EMAIL",
  VERIFY_PHONE: "VERIFY_PHONE",
  LOGIN_MFA: "LOGIN_MFA",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

export interface SessionSummary {
  id: string;
  deviceLabel: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

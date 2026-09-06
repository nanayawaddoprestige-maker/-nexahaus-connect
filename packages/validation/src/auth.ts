import { z } from "zod";
import { OtpPurpose } from "@nexahaus/types";
import { email, ghanaPhone, password, uuid } from "./common.js";

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: email.optional(),
    phone: ghanaPhone.optional(),
    password,
    /** Invitation token issued by NexaHaus when onboarding an owner/staff/tenant. */
    invitationToken: z.string().min(10).optional(),
  })
  .strict()
  .refine((v) => v.email ?? v.phone, {
    message: "an email or phone number is required",
    path: ["email"],
  });

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3), // email or phone
    password: z.string().min(1),
    /** TOTP code, required only when the account has MFA enabled. */
    mfaCode: z.string().regex(/^\d{6}$/).optional(),
    deviceLabel: z.string().max(80).optional(),
  })
  .strict();

export const verifyOtpSchema = z
  .object({
    challengeId: uuid,
    code: z.string().regex(/^\d{4,8}$/),
    purpose: z.nativeEnum(OtpPurpose),
  })
  .strict();

export const requestOtpSchema = z
  .object({
    destination: z.string().trim().min(3),
    purpose: z.nativeEnum(OtpPurpose),
  })
  .strict();

export const refreshSchema = z
  .object({
    /** Omitted by web clients (refresh token is an HttpOnly cookie). */
    refreshToken: z.string().min(10).optional(),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({ identifier: z.string().trim().min(3) })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password,
  })
  .strict();

export const enableMfaSchema = z
  .object({ code: z.string().regex(/^\d{6}$/) })
  .strict();

export const revokeSessionSchema = z.object({ sessionId: uuid }).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

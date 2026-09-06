import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { authenticator } from "otplib";
import type { AppConfig } from "@nexahaus/config";
import {
  type AuthUser,
  type LoginResult,
  OtpPurpose,
  type RoleKey,
  type SessionSummary,
} from "@nexahaus/types";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@nexahaus/validation";
import { APP_CONFIG } from "../../config/config.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { AuditService } from "../../audit/audit.service";
import { AuthUserService } from "../authz/auth-user.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { OtpService } from "./otp.service";

interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly otp: OtpService,
    private readonly audit: AuditService,
    private readonly authUsers: AuthUserService,
  ) {}

  // --------------------------------------------------------------------------
  // Registration & verification
  // --------------------------------------------------------------------------

  async register(
    input: RegisterInput,
    meta: RequestMeta,
  ): Promise<{ userId: string; challengeId: string; via: "email" | "phone" }> {
    const email = input.email?.toLowerCase() ?? null;
    const phone = input.phone ?? null;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true },
    });
    // Do not reveal which identifier is taken — generic conflict.
    if (existing) {
      throw AppError.conflict("An account with those details already exists.");
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        fullName: input.fullName,
        passwordHash,
        status: "PENDING_VERIFICATION",
      },
      select: { id: true },
    });

    // TODO(phase-2): consume invitationToken to attach ClientUser / role / tenant link.

    const via: "email" | "phone" = email ? "email" : "phone";
    const { challengeId } = await this.otp.issue(
      email ?? phone!,
      via === "email" ? OtpPurpose.VERIFY_EMAIL : OtpPurpose.VERIFY_PHONE,
      user.id,
    );

    await this.audit.record({
      action: "auth.register",
      resourceType: "user",
      resourceId: user.id,
      after: { email, phone, status: "PENDING_VERIFICATION" },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return { userId: user.id, challengeId, via };
  }

  async verifyContact(
    challengeId: string,
    code: string,
    purpose: OtpPurpose,
    meta: RequestMeta,
  ): Promise<{ verified: true }> {
    const { userId } = await this.otp.verify(challengeId, code, purpose);
    if (!userId) throw AppError.validation("This verification code is not valid.");

    const field =
      purpose === OtpPurpose.VERIFY_EMAIL ? "emailVerifiedAt" : "phoneVerifiedAt";

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        [field]: new Date(),
        status: "ACTIVE",
      },
    });
    await this.authUsers.invalidate(userId);
    await this.audit.record({
      action: "auth.verify_contact",
      resourceType: "user",
      resourceId: userId,
      after: { [field]: true, status: "ACTIVE" },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { verified: true };
  }

  // --------------------------------------------------------------------------
  // Login / refresh / logout
  // --------------------------------------------------------------------------

  async login(input: LoginInput, meta: RequestMeta): Promise<LoginResult> {
    const user = await this.findByIdentifier(input.identifier);

    // Uniform failure to prevent user enumeration & timing leaks.
    const genericFail = AppError.unauthenticated("Invalid credentials.");

    if (!user) {
      // Still burn a hash comparison to equalise timing.
      await this.passwords.verify(
        "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$0000000000000000000000000000000000000000000",
        input.password,
      );
      throw genericFail;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw AppError.forbidden("Account is temporarily locked. Try again later.");
    }

    const ok = await this.passwords.verify(user.passwordHash, input.password);
    if (!ok) {
      await this.registerFailedLogin(user.id, user.failedLoginCount);
      throw genericFail;
    }

    if (user.status !== "ACTIVE") {
      throw AppError.forbidden("Please verify your account before signing in.");
    }

    if (user.mfaEnabled) {
      if (!input.mfaCode) {
        return {
          user: this.publicUser(user.id, user.email, user.fullName),
          tokens: {
            accessToken: "",
            accessTokenExpiresAt: new Date().toISOString(),
            refreshTokenExpiresAt: new Date().toISOString(),
          },
          mfaRequired: true,
        };
      }
      const valid = user.mfaSecretEnc
        ? authenticator.check(input.mfaCode, this.decryptSecret(user.mfaSecretEnc))
        : false;
      if (!valid) throw genericFail;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const roles = user.roles.map((r) => r.role.key as RoleKey);
    const tokens = await this.tokens.issueSession(user.id, roles, {
      ip: meta.ip,
      userAgent: meta.userAgent,
      deviceLabel: input.deviceLabel ?? null,
    });

    await this.audit.record({
      action: "auth.login",
      resourceType: "user",
      resourceId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    const authUser = await this.authUsers.build(user.id, "pending");
    return {
      user: { ...(authUser as Omit<AuthUser, "sessionId">), sessionId: "" },
      tokens,
      mfaRequired: false,
    };
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    return this.tokens.rotate(refreshToken, {
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    await this.tokens.revokeSession(sessionId, userId);
    await this.audit.record({
      action: "auth.logout",
      resourceType: "session",
      resourceId: sessionId,
      actorUserId: userId,
    });
  }

  async logoutAll(userId: string, exceptSessionId: string): Promise<void> {
    await this.tokens.revokeAllSessions(userId, exceptSessionId);
    await this.audit.record({
      action: "auth.logout_all",
      resourceType: "user",
      resourceId: userId,
      actorUserId: userId,
    });
  }

  async listSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionSummary[]> {
    const rows = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        deviceLabel: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      deviceLabel: r.deviceLabel,
      ip: r.ip,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
      lastUsedAt: r.lastUsedAt.toISOString(),
      current: r.id === currentSessionId,
    }));
  }

  // --------------------------------------------------------------------------
  // MFA (TOTP)
  // --------------------------------------------------------------------------

  async setupMfa(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, phone: true },
    });
    const secret = authenticator.generateSecret();
    const label = user.email ?? user.phone ?? userId;
    const otpauthUrl = authenticator.keyuri(
      label,
      this.config.auth.mfaIssuer,
      secret,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecretEnc: this.encryptSecret(secret) },
    });
    return { secret, otpauthUrl };
  }

  async enableMfa(userId: string, code: string): Promise<{ enabled: true }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { mfaSecretEnc: true },
    });
    if (
      !user.mfaSecretEnc ||
      !authenticator.check(code, this.decryptSecret(user.mfaSecretEnc))
    ) {
      throw AppError.validation("That code is not valid. Try again.");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
    await this.authUsers.invalidate(userId);
    await this.audit.record({
      action: "auth.mfa_enabled",
      resourceType: "user",
      resourceId: userId,
      actorUserId: userId,
    });
    return { enabled: true };
  }

  // --------------------------------------------------------------------------
  // Password reset
  // --------------------------------------------------------------------------

  async forgotPassword(input: ForgotPasswordInput): Promise<{ requested: true }> {
    const user = await this.findByIdentifier(input.identifier);
    // Always return success — never disclose whether the account exists.
    if (user) {
      const token = randomBytes(32).toString("base64url");
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      // TODO(phase-5): email the reset link containing `token`.
    }
    return { requested: true };
  }

  async resetPassword(
    input: ResetPasswordInput,
    meta: RequestMeta,
  ): Promise<{ reset: true }> {
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.validation("This reset link is invalid or has expired.");
    }
    const passwordHash = await this.passwords.hash(input.password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit.record({
      action: "auth.password_reset",
      resourceType: "user",
      resourceId: record.userId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { reset: true };
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async findByIdentifier(identifier: string) {
    const value = identifier.trim();
    const isEmail = value.includes("@");
    return this.prisma.user.findFirst({
      where: isEmail
        ? { email: value.toLowerCase() }
        : { phone: normalisePhone(value) },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        passwordHash: true,
        status: true,
        mfaEnabled: true,
        mfaSecretEnc: true,
        failedLoginCount: true,
        lockedUntil: true,
        roles: { select: { role: { select: { key: true } } } },
      },
    });
  }

  private async registerFailedLogin(
    userId: string,
    currentCount: number,
  ): Promise<void> {
    const next = currentCount + 1;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: next,
        lockedUntil:
          next >= MAX_FAILED_LOGINS
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null,
      },
    });
  }

  private publicUser(
    userId: string,
    email: string | null,
    fullName: string,
  ): AuthUser {
    return {
      userId,
      email: email ?? "",
      fullName,
      roles: [],
      permissions: [],
      clientIds: [],
      assignedPropertyIds: [],
      tenantId: null,
      scopeExempt: false,
      sessionId: "",
      mfaEnabled: true,
    };
  }

  // Placeholder symmetric wrapping for the TOTP secret. Phase 10 swaps this for
  // a KMS-backed envelope encryption; the interface stays the same.
  private encryptSecret(secret: string): string {
    const key = createHash("sha256")
      .update(this.config.auth.accessSecret)
      .digest();
    const buf = Buffer.from(secret, "utf8");
    const out = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i += 1) {
      out[i] = buf[i]! ^ key[i % key.length]!;
    }
    return out.toString("base64");
  }

  private decryptSecret(enc: string): string {
    const key = createHash("sha256")
      .update(this.config.auth.accessSecret)
      .digest();
    const buf = Buffer.from(enc, "base64");
    const out = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i += 1) {
      out[i] = buf[i]! ^ key[i % key.length]!;
    }
    return out.toString("utf8");
  }
}

function normalisePhone(value: string): string {
  const trimmed = value.replace(/\s+/g, "");
  if (trimmed.startsWith("0") && trimmed.length === 10) {
    return `+233${trimmed.slice(1)}`;
  }
  return trimmed;
}

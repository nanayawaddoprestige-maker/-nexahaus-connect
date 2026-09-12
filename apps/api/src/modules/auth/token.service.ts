import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AppConfig } from "@nexahaus/config";
import type { AccessTokenPayload, AuthTokens, RoleKey } from "@nexahaus/types";
import { APP_CONFIG } from "../../config/config.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";

interface DeviceInfo {
  ip?: string | null;
  userAgent?: string | null;
  deviceLabel?: string | null;
}

/**
 * Issues short-lived access tokens and manages refresh-token sessions with
 * rotation (docs/SECURITY.md §1). Refresh tokens are opaque 256-bit random
 * values; only their SHA-256 hash is stored. Reuse of a rotated token revokes
 * the whole session chain.
 */
@Injectable()
export class TokenService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private newRefreshToken(): string {
    return randomBytes(32).toString("base64url");
  }

  /** Create a brand-new session (login / register). Returns the token pair. */
  async issueSession(
    userId: string,
    roles: RoleKey[],
    device: DeviceInfo,
  ): Promise<AuthTokens> {
    const refreshToken = this.newRefreshToken();
    const expiresAt = new Date(Date.now() + this.config.auth.refreshTtl * 1000);
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        ip: device.ip ?? null,
        userAgent: device.userAgent ?? null,
        deviceLabel: device.deviceLabel ?? null,
        expiresAt,
      },
      select: { id: true },
    });
    return this.buildTokens(userId, roles, session.id, refreshToken, expiresAt);
  }

  /**
   * Rotate a refresh token. Verifies the presented token matches an active
   * session; issues a new refresh token and marks the old session revoked,
   * linking the new one via `rotatedFromId`. If the presented token belongs to
   * an already-revoked session, the entire chain for that user is revoked
   * (token theft response) and the call fails.
   */
  async rotate(
    presentedToken: string,
    device: DeviceInfo,
  ): Promise<AuthTokens> {
    const hash = this.hashToken(presentedToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        expiresAt: true,
        user: {
          select: {
            status: true,
            roles: { select: { role: { select: { key: true } } } },
          },
        },
      },
    });

    if (!session) throw AppError.unauthenticated("Invalid refresh token.");

    if (session.revokedAt !== null || session.expiresAt < new Date()) {
      // Reuse of a rotated/expired token → revoke every session for this user.
      await this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw AppError.unauthenticated(
        "Session has been revoked. Please sign in again.",
      );
    }

    if (session.user.status !== "ACTIVE") {
      throw AppError.unauthenticated("Account is not active.");
    }

    const roles = session.user.roles.map((r) => r.role.key as RoleKey);
    const refreshToken = this.newRefreshToken();
    const expiresAt = new Date(Date.now() + this.config.auth.refreshTtl * 1000);

    const next = await this.prisma.$transaction(async (tx) => {
      const created = await tx.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: this.hashToken(refreshToken),
          ip: device.ip ?? null,
          userAgent: device.userAgent ?? null,
          deviceLabel: device.deviceLabel ?? null,
          expiresAt,
          rotatedFromId: session.id,
        },
        select: { id: true },
      });
      await tx.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      return created;
    });

    return this.buildTokens(
      session.userId,
      roles,
      next.id,
      refreshToken,
      expiresAt,
    );
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    });
  }

  private async buildTokens(
    userId: string,
    roles: RoleKey[],
    sessionId: string,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): Promise<AuthTokens> {
    const jti = randomUUID();
    const payload: Omit<AccessTokenPayload, "iat" | "exp"> = {
      sub: userId,
      roles,
      sessionId,
      jti,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const accessTokenExpiresAt = new Date(
      Date.now() + this.config.auth.accessTtl * 1000,
    );
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
    };
  }
}

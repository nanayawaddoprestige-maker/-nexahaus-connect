import { createHash, randomInt } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { AppConfig } from "@nexahaus/config";
import type { OtpPurpose } from "@nexahaus/types";
import { APP_CONFIG } from "../../config/config.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";

/**
 * One-time codes for email/phone verification, MFA-over-OTP and password reset
 * (docs/SECURITY.md §1). Codes are 6 digits, hashed at rest, single-use, short
 * TTL, attempt-capped. Delivery goes through the notification adapters; in
 * development the console adapter logs the code.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly prisma: PrismaService,
  ) {}

  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }

  async issue(
    destination: string,
    purpose: OtpPurpose,
    userId?: string,
  ): Promise<{ challengeId: string }> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(Date.now() + this.config.auth.otpTtl * 1000);

    // Invalidate any outstanding challenge for the same destination + purpose.
    await this.prisma.otpChallenge.updateMany({
      where: { destination, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        userId: userId ?? null,
        destination,
        purpose,
        codeHash: this.hash(code),
        expiresAt,
      },
      select: { id: true },
    });

    if (this.config.isDevelopment || this.config.isTest) {
      this.logger.warn(
        `OTP for ${destination} (${purpose}): ${code} [dev only]`,
      );
    }
    // TODO(phase-5): dispatch via EmailAdapter / SmsAdapter based on destination.

    return { challengeId: challenge.id };
  }

  async verify(
    challengeId: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<{ userId: string | null; destination: string }> {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });
    if (
      !challenge ||
      challenge.purpose !== purpose ||
      challenge.consumedAt !== null
    ) {
      throw AppError.validation("This verification code is not valid.");
    }
    if (challenge.expiresAt < new Date()) {
      throw AppError.validation("This verification code has expired.");
    }
    if (challenge.attempts >= this.config.auth.otpMaxAttempts) {
      await this.prisma.otpChallenge.update({
        where: { id: challengeId },
        data: { consumedAt: new Date() },
      });
      throw AppError.validation(
        "Too many incorrect attempts. Request a new code.",
      );
    }

    if (challenge.codeHash !== this.hash(code)) {
      await this.prisma.otpChallenge.update({
        where: { id: challengeId },
        data: { attempts: { increment: 1 } },
      });
      throw AppError.validation("Incorrect verification code.");
    }

    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { consumedAt: new Date() },
    });
    return { userId: challenge.userId, destination: challenge.destination };
  }
}

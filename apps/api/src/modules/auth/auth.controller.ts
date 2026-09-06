import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import {
  enableMfaSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyOtpInput,
} from "@nexahaus/validation";
import { loadConfig } from "@nexahaus/config";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, Public } from "../../common/decorators";
import { AppError } from "../../common/app-error";
import { AuthService } from "./auth.service";

const REFRESH_COOKIE = "nexahaus_rt";
const config = loadConfig();

@ApiTags("auth")
@Throttle({ auth: {} })
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private meta(req: Request) {
    return { ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
  }

  private setRefreshCookie(res: Response, token: string, expiresAt: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "strict",
      path: "/api/v1/auth",
      expires: new Date(expiresAt),
    });
  }

  private readRefreshCookie(req: Request): string | null {
    const raw = req.header("cookie");
    if (!raw) return null;
    for (const part of raw.split(";")) {
      const [k, ...v] = part.trim().split("=");
      if (k === REFRESH_COOKIE) return decodeURIComponent(v.join("="));
    }
    return null;
  }

  @Public()
  @Post("register")
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Req() req: Request,
  ) {
    return this.auth.register(body, this.meta(req));
  }

  @Public()
  @Post("verify")
  @HttpCode(200)
  verify(
    @Body(new ZodValidationPipe(verifyOtpSchema)) body: VerifyOtpInput,
    @Req() req: Request,
  ) {
    return this.auth.verifyContact(
      body.challengeId,
      body.code,
      body.purpose,
      this.meta(req),
    );
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(body, this.meta(req));
    if (!result.mfaRequired && result.tokens.refreshToken) {
      this.setRefreshCookie(
        res,
        result.tokens.refreshToken,
        result.tokens.refreshTokenExpiresAt,
      );
    }
    // Web clients rely on the cookie; keep the token in the body for mobile.
    return result;
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = body.refreshToken ?? this.readRefreshCookie(req);
    if (!token) throw AppError.unauthenticated("No refresh token supplied.");
    const tokens = await this.auth.refresh(token, this.meta(req));
    if (tokens.refreshToken) {
      this.setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);
    }
    return tokens;
  }

  @ApiBearerAuth()
  @Post("logout")
  @HttpCode(204)
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user.sessionId, user.userId);
    res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  }

  @ApiBearerAuth()
  @Post("logout-all")
  @HttpCode(204)
  async logoutAll(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logoutAll(user.userId, user.sessionId);
    res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  }

  @ApiBearerAuth()
  @Get("me")
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @ApiBearerAuth()
  @Get("sessions")
  sessions(@CurrentUser() user: AuthUser) {
    return this.auth
      .listSessions(user.userId, user.sessionId)
      .then((items) => ({ __list: true as const, items }));
  }

  @ApiBearerAuth()
  @Delete("sessions/:id")
  @HttpCode(204)
  async revokeSession(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<void> {
    await this.auth.logout(id, user.userId);
  }

  @ApiBearerAuth()
  @Post("mfa/setup")
  setupMfa(@CurrentUser("userId") userId: string) {
    return this.auth.setupMfa(userId);
  }

  @ApiBearerAuth()
  @Post("mfa/enable")
  @HttpCode(200)
  enableMfa(
    @CurrentUser("userId") userId: string,
    @Body(new ZodValidationPipe(enableMfaSchema)) body: { code: string },
  ) {
    return this.auth.enableMfa(userId, body.code);
  }

  @Public()
  @Post("password/forgot")
  @HttpCode(202)
  forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput,
  ) {
    return this.auth.forgotPassword(body);
  }

  @Public()
  @Post("password/reset")
  @HttpCode(200)
  resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput,
    @Req() req: Request,
  ) {
    return this.auth.resetPassword(body, this.meta(req));
  }
}

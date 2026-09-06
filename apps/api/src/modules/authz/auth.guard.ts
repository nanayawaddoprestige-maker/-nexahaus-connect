import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import type { Request } from "express";
import type { AccessTokenPayload, AuthUser } from "@nexahaus/types";
import { AppError } from "../../common/app-error";
import { IS_PUBLIC_KEY } from "../../common/decorators";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthUserService } from "./auth-user.service";

/**
 * Verifies the bearer access token, confirms the backing session is still
 * active, builds the AuthUser (roles + permissions + scope), and attaches it to
 * `request.user`. Routes marked `@Public()` skip all of this.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly authUsers: AuthUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = extractBearer(request);
    if (!token) throw AppError.unauthenticated();

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch (err) {
      if (err instanceof TokenExpiredError) throw AppError.tokenExpired();
      throw AppError.unauthenticated("Invalid access token.");
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, revokedAt: true, expiresAt: true, userId: true },
    });
    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt < new Date() ||
      session.userId !== payload.sub
    ) {
      throw AppError.unauthenticated("Your session is no longer valid.");
    }

    const authUser = await this.authUsers.build(payload.sub, payload.sessionId);
    if (!authUser) throw AppError.unauthenticated("Account is not active.");

    request.user = { ...authUser, sessionId: payload.sessionId };
    return true;
  }
}

function extractBearer(request: Request): string | null {
  const header = request.header("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && value ? value : null;
}

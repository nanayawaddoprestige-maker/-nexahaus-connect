import { Inject, Injectable } from "@nestjs/common";
import type { Redis } from "ioredis";
import {
  type AuthUser,
  type RoleKey,
  SCOPE_EXEMPT_ROLES,
} from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { REDIS_CLIENT } from "../../redis/redis.module";

const CACHE_PREFIX = "authz:user:";
const CACHE_TTL_SECONDS = 60;

/**
 * Resolves the full authorization context for a user: roles, the flattened
 * permission set, and the resource-scope arrays (client ids from ClientUser,
 * assigned property ids from PropertyAssignment, tenant id when a TENANT).
 *
 * This is the ONLY place scope is derived — never from request input
 * (docs/SECURITY.md §2). Result is cached in Redis for a short TTL and
 * invalidated explicitly when a user's roles or assignments change.
 */
@Injectable()
export class AuthUserService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async build(
    userId: string,
    sessionId: string,
  ): Promise<Omit<AuthUser, "sessionId"> | null> {
    const cached = await this.redis.get(CACHE_PREFIX + userId).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as Omit<AuthUser, "sessionId">;
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        mfaEnabled: true,
        roles: { select: { role: { select: { key: true } } } },
        clientLinks: { select: { clientId: true } },
        propertyAssignments: {
          where: { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
          select: { propertyId: true },
        },
        tenantProfile: { select: { id: true } },
        vendorProfile: { select: { id: true } },
      },
    });

    if (!user || user.status !== "ACTIVE") return null;

    const roles = user.roles.map((r) => r.role.key as RoleKey);
    const permissions = await this.resolvePermissions(roles);

    const authUser: Omit<AuthUser, "sessionId"> = {
      userId: user.id,
      email: user.email ?? "",
      fullName: user.fullName,
      roles,
      permissions,
      clientIds: user.clientLinks.map((c) => c.clientId),
      assignedPropertyIds: user.propertyAssignments.map((p) => p.propertyId),
      tenantId: user.tenantProfile?.id ?? null,
      vendorId: user.vendorProfile?.id ?? null,
      scopeExempt: roles.some((r) => SCOPE_EXEMPT_ROLES.includes(r)),
      mfaEnabled: user.mfaEnabled,
    };

    await this.redis
      .set(
        CACHE_PREFIX + userId,
        JSON.stringify(authUser),
        "EX",
        CACHE_TTL_SECONDS,
      )
      .catch(() => undefined);

    return authUser;
  }

  /** Call after any change to a user's roles, client links or property assignments. */
  async invalidate(userId: string): Promise<void> {
    await this.redis.del(CACHE_PREFIX + userId).catch(() => undefined);
  }

  private async resolvePermissions(roles: RoleKey[]): Promise<string[]> {
    if (roles.length === 0) return [];
    const rows = await this.prisma.rolePermission.findMany({
      where: { role: { key: { in: roles } } },
      select: { permission: { select: { key: true } } },
    });
    return [...new Set(rows.map((r) => r.permission.key))];
  }
}

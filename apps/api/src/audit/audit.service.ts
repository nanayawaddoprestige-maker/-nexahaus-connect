import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { paginate, pageParams } from "../common/pagination";

export interface AuditContext {
  actorUserId?: string | null;
  actorRoleKey?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
}

export interface AuditEntry extends AuditContext {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
}

/**
 * Append-only audit trail (docs/SECURITY.md §8). Every state-changing action
 * writes one row. The DB role has INSERT + SELECT only on `audit_logs`, so
 * entries are immutable to the application.
 *
 * `record` accepts an optional transaction client so an audit row can be written
 * atomically with the business change.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Browsable audit trail for the admin console (`audit:read`, docs/SECURITY.md §8). */
  async list(query: {
    page?: number;
    pageSize?: number;
    resourceType?: string;
    actorUserId?: string;
    action?: string;
    from?: string;
    to?: string;
  }) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.AuditLogWhereInput = {
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.action
        ? { action: { contains: query.action, mode: "insensitive" } }
        : {}),
      ...(query.from || query.to
        ? {
            at: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { at: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const actorIds = [
      ...new Set(
        rows.map((r) => r.actorUserId).filter((id): id is string => !!id),
      ),
    ];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, fullName: true },
        })
      : [];
    const actorById = new Map(actors.map((a) => [a.id, a]));

    return paginate(
      rows.map((r) => ({
        id: r.id,
        at: r.at.toISOString(),
        actor: r.actorUserId ? (actorById.get(r.actorUserId) ?? null) : null,
        actorRoleKey: r.actorRoleKey,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        ip: r.ip,
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async record(
    entry: AuditEntry,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    try {
      await client.auditLog.create({
        data: {
          actorUserId: entry.actorUserId ?? null,
          actorRoleKey: entry.actorRoleKey ?? null,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId ?? null,
          before: toJson(entry.before),
          after: toJson(entry.after),
          ip: entry.ip ?? null,
          userAgent: entry.userAgent ?? null,
          sessionId: entry.sessionId ?? null,
          requestId: entry.requestId ?? null,
        },
      });
    } catch (err) {
      // An audit write must never be swallowed silently; surface loudly.
      this.logger.error({ err, entry }, "Failed to write audit log entry");
      throw err;
    }
  }
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

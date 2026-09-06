import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

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

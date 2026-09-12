import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { ApprovalStatus, ApprovalType, DomainEventType } from "@nexahaus/types";
import type { AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { EventsService } from "../events/events.service";
import { pageParams, paginate } from "../../common/pagination";

export interface CreateApprovalArgs {
  type: keyof typeof ApprovalType;
  subjectRefType: string;
  subjectRefId: string;
  propertyId?: string | null;
  clientId: string;
  requestedByUserId: string;
  thresholdMinor?: bigint | null;
  amountMinor?: bigint | null;
  currency?: string | null;
  dueInDays?: number;
}

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  /** Called by other modules inside their transaction (e.g. maintenance). */
  async createInTx(tx: Prisma.TransactionClient, args: CreateApprovalArgs) {
    const ref = await this.refs.next("approval", tx);
    const approval = await tx.approval.create({
      data: {
        ref,
        type: ApprovalType[args.type],
        subjectRefType: args.subjectRefType,
        subjectRefId: args.subjectRefId,
        propertyId: args.propertyId ?? null,
        clientId: args.clientId,
        requestedByUserId: args.requestedByUserId,
        thresholdMinor: args.thresholdMinor ?? null,
        thresholdCurrency: args.thresholdMinor
          ? (args.currency ?? "GHS")
          : null,
        amountMinor: args.amountMinor ?? null,
        currency: args.amountMinor ? (args.currency ?? "GHS") : null,
        status: "PENDING",
        dueAt: args.dueInDays
          ? new Date(Date.now() + args.dueInDays * 86_400_000)
          : null,
        events: {
          create: { action: "CREATED", byUserId: args.requestedByUserId },
        },
      },
    });
    await this.events.emit(
      DomainEventType.APPROVAL_REQUIRED,
      {
        approvalId: approval.id,
        type: approval.type,
        clientId: args.clientId,
        propertyId: args.propertyId,
        subject: { type: args.subjectRefType, id: args.subjectRefId },
      },
      tx,
    );
    return approval;
  }

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      status?: string;
      propertyId?: string;
    },
  ) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.ApprovalWhereInput = {
      ...(user.scopeExempt
        ? {}
        : user.clientIds.length
          ? { clientId: { in: user.clientIds } }
          : { propertyId: { in: user.assignedPropertyIds } }),
      ...(query.status ? { status: query.status as ApprovalStatus } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    };
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.approval.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          property: { select: { id: true, name: true, ref: true } },
        },
      }),
      this.prisma.approval.count({ where }),
    ]);
    const requesters = await this.resolveRequesters(
      rows.map((a) => a.requestedByUserId),
    );
    return paginate(
      rows.map((a) => ({
        id: a.id,
        ref: a.ref,
        type: a.type,
        status: a.status,
        subject: { type: a.subjectRefType, id: a.subjectRefId },
        property: a.property,
        amount: a.amountMinor
          ? { minor: a.amountMinor.toString(), currency: a.currency ?? "GHS" }
          : null,
        threshold: a.thresholdMinor
          ? {
              minor: a.thresholdMinor.toString(),
              currency: a.thresholdCurrency ?? "GHS",
            }
          : null,
        requestedBy: requesters.get(a.requestedByUserId) ?? null,
        dueAt: a.dueAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  /** `requestedByUserId` is a plain actor-trail id, not a Prisma relation
   *  (see schema header) — resolve display names with a manual lookup. */
  private async resolveRequesters(
    userIds: string[],
  ): Promise<Map<string, { id: string; fullName: string }>> {
    const ids = [...new Set(userIds)];
    if (!ids.length) return new Map();
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true },
    });
    return new Map(users.map((u) => [u.id, u]));
  }

  async getById(user: AuthUser, id: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, name: true, ref: true } },
        events: { orderBy: { at: "asc" } },
      },
    });
    if (
      !approval ||
      !this.inScope(user, approval.clientId, approval.propertyId)
    ) {
      throw AppError.notFound("approval");
    }
    const requesters = await this.resolveRequesters([
      approval.requestedByUserId,
    ]);
    return {
      id: approval.id,
      ref: approval.ref,
      type: approval.type,
      status: approval.status,
      subject: { type: approval.subjectRefType, id: approval.subjectRefId },
      property: approval.property,
      amount: approval.amountMinor
        ? {
            minor: approval.amountMinor.toString(),
            currency: approval.currency ?? "GHS",
          }
        : null,
      threshold: approval.thresholdMinor
        ? {
            minor: approval.thresholdMinor.toString(),
            currency: approval.thresholdCurrency ?? "GHS",
          }
        : null,
      decisionNote: approval.decisionNote,
      decidedAt: approval.decidedAt?.toISOString() ?? null,
      dueAt: approval.dueAt?.toISOString() ?? null,
      requestedBy: requesters.get(approval.requestedByUserId) ?? null,
      createdAt: approval.createdAt.toISOString(),
      timeline: approval.events.map((e) => ({
        action: e.action,
        note: e.note,
        at: e.at.toISOString(),
        byUserId: e.byUserId,
      })),
    };
  }

  async decide(
    user: AuthUser,
    id: string,
    decision: "APPROVED" | "DECLINED" | "INFO_REQUESTED",
    note: string | undefined,
    ctx: AuditContext,
  ) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (
      !approval ||
      !this.inScope(user, approval.clientId, approval.propertyId)
    ) {
      throw AppError.notFound("approval");
    }
    if (approval.status !== "PENDING" && approval.status !== "INFO_REQUESTED") {
      throw AppError.illegalTransition(
        `This approval has already been ${approval.status.toLowerCase()}.`,
      );
    }
    // Only an owner-side approver (or scope-exempt staff acting on their behalf)
    // may decide. Staff assigned to the property can request more info.
    const canDecide =
      user.scopeExempt ||
      (user.permissions.includes("owner:approval:decide") &&
        user.clientIds.includes(approval.clientId)) ||
      (user.permissions.includes("approval:decide") &&
        user.clientIds.includes(approval.clientId));
    if (decision !== "INFO_REQUESTED" && !canDecide) {
      throw AppError.forbidden(
        "Only the property owner can approve or decline this.",
      );
    }

    const nextStatus: ApprovalStatus =
      decision === "APPROVED"
        ? "APPROVED"
        : decision === "DECLINED"
          ? "DECLINED"
          : "INFO_REQUESTED";

    await this.prisma.$transaction(async (tx) => {
      await tx.approval.update({
        where: { id },
        data: {
          status: nextStatus,
          decidedByUserId: decision === "INFO_REQUESTED" ? null : user.userId,
          decidedAt: decision === "INFO_REQUESTED" ? null : new Date(),
          decisionNote: note ?? null,
        },
      });
      await tx.approvalEvent.create({
        data: {
          approvalId: id,
          action: decision,
          byUserId: user.userId,
          note: note ?? null,
        },
      });
      if (decision !== "INFO_REQUESTED") {
        await this.events.emit(
          DomainEventType.APPROVAL_COMPLETED,
          {
            approvalId: id,
            type: approval.type,
            decision,
            subject: {
              type: approval.subjectRefType,
              id: approval.subjectRefId,
            },
          },
          tx,
        );
        // Propagate to the subject where we own it.
        if (approval.type === "MAINTENANCE_COST") {
          await tx.maintenanceRequest.updateMany({
            where: { id: approval.subjectRefId, status: "AWAITING_APPROVAL" },
            data:
              decision === "APPROVED"
                ? {
                    status: "IN_PROGRESS",
                    approvedCostMinor: approval.amountMinor,
                  }
                : {
                    status: "CANCELLED",
                    cancellationReason: "Owner declined the estimate",
                  },
          });
        }
        if (approval.type === "EXPENSE") {
          await tx.expense.updateMany({
            where: { id: approval.subjectRefId },
            data: {
              approvalStatus: decision === "APPROVED" ? "APPROVED" : "DECLINED",
              status: decision === "APPROVED" ? "APPROVED" : "REJECTED",
            },
          });
        }
      }
      await this.audit.record(
        {
          ...ctx,
          action: `approval.${decision.toLowerCase()}`,
          resourceType: "approval",
          resourceId: id,
          before: { status: approval.status },
          after: { status: nextStatus, note },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }

  private inScope(
    user: AuthUser,
    clientId: string,
    propertyId: string | null,
  ): boolean {
    if (user.scopeExempt) return true;
    if (user.clientIds.includes(clientId)) return true;
    return propertyId !== null && user.assignedPropertyIds.includes(propertyId);
  }
}

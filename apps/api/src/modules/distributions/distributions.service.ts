import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import type { CreateDistributionInput } from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate } from "../../common/pagination";
import { clientInScope } from "../authz/scope.util";
import { EventsService } from "../events/events.service";

/**
 * Owner distributions (spec §17, §49). A distribution is created against a
 * client/period, optionally linked to a statement; paying it posts an
 * OWNER_DISTRIBUTION transaction so it shows on the ledger and the next
 * statement. Owner funds are never commingled with company funds in the model.
 */
@Injectable()
export class DistributionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      clientId?: string;
      status?: string;
    },
  ) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.OwnerDistributionWhereInput = {
      ...(user.scopeExempt
        ? query.clientId
          ? { clientId: query.clientId }
          : {}
        : { clientId: { in: user.clientIds } }),
      ...(query.status
        ? {
            status:
              query.status as Prisma.EnumDistributionStatusFilter["equals"],
          }
        : {}),
    };
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.ownerDistribution.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, displayName: true } },
          property: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ownerDistribution.count({ where }),
    ]);
    return paginate(
      rows.map((d) => ({
        id: d.id,
        ref: d.ref,
        client: d.client,
        property: d.property?.name ?? "Portfolio",
        periodStart: d.periodStart.toISOString(),
        periodEnd: d.periodEnd.toISOString(),
        amount: { minor: d.amountMinor.toString(), currency: d.currency },
        method: d.method,
        status: d.status,
        paidAt: d.paidAt?.toISOString() ?? null,
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async create(
    user: AuthUser,
    input: CreateDistributionInput,
    ctx: AuditContext,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: input.clientId, deletedAt: null },
      select: { id: true },
    });
    if (!client) throw AppError.notFound("client");
    const amountMinor = BigInt(input.amount.minor);
    if (amountMinor <= 0n)
      throw AppError.validation("Amount must be positive.");

    const distribution = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("distribution", tx);
      const created = await tx.ownerDistribution.create({
        data: {
          ref,
          clientId: input.clientId,
          propertyId: input.propertyId ?? null,
          statementId: input.statementId ?? null,
          periodStart: new Date(input.periodStart),
          periodEnd: new Date(input.periodEnd),
          amountMinor,
          currency: input.amount.currency,
          method: input.method,
          status: "PENDING",
          createdById: user.userId,
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "distribution.create",
          resourceType: "distribution",
          resourceId: created.id,
          after: {
            ref: created.ref,
            amountMinor: input.amount.minor,
            clientId: input.clientId,
          },
        },
        tx,
      );
      return created;
    });
    return this.getById(user, distribution.id);
  }

  async approve(user: AuthUser, id: string, ctx: AuditContext) {
    const d = await this.load(id);
    if (d.status !== "PENDING") {
      throw AppError.illegalTransition(
        `A ${d.status} distribution cannot be approved.`,
      );
    }
    await this.prisma.ownerDistribution.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    await this.audit.record({
      ...ctx,
      action: "distribution.approve",
      resourceType: "distribution",
      resourceId: id,
      after: { status: "APPROVED" },
    });
    return this.getById(user, id);
  }

  async pay(
    user: AuthUser,
    id: string,
    reference: string | undefined,
    ctx: AuditContext,
  ) {
    const d = await this.load(id);
    if (!["APPROVED", "PENDING"].includes(d.status)) {
      throw AppError.illegalTransition(
        `A ${d.status} distribution cannot be paid.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const txnRef = await this.refs.next("transaction", tx);
      const transaction = await tx.transaction.create({
        data: {
          ref: txnRef,
          type: "OWNER_DISTRIBUTION",
          amountMinor: -d.amountMinor,
          currency: d.currency,
          occurredAt: new Date(),
          propertyId: d.propertyId,
          clientId: d.clientId,
          category: "OWNER_DISTRIBUTION",
          reference: reference ?? d.ref,
          method: d.method as never,
          status: "POSTED",
          createdById: user.userId,
        },
      });
      await tx.ownerDistribution.update({
        where: { id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          transactionId: transaction.id,
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "distribution.pay",
          resourceType: "distribution",
          resourceId: id,
          after: {
            status: "PAID",
            transactionId: transaction.id,
            amountMinor: d.amountMinor.toString(),
          },
        },
        tx,
      );
    });
    return this.getById(user, id);
  }

  async getById(user: AuthUser, id: string) {
    const d = await this.prisma.ownerDistribution.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, displayName: true } },
        property: { select: { id: true, name: true, ref: true } },
        statement: { select: { id: true, ref: true } },
      },
    });
    if (!d || (!user.scopeExempt && !clientInScope(user, d.clientId))) {
      throw AppError.notFound("distribution");
    }
    return {
      id: d.id,
      ref: d.ref,
      client: d.client,
      property: d.property,
      statement: d.statement,
      periodStart: d.periodStart.toISOString(),
      periodEnd: d.periodEnd.toISOString(),
      amount: { minor: d.amountMinor.toString(), currency: d.currency },
      method: d.method,
      status: d.status,
      transactionId: d.transactionId,
      paidAt: d.paidAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
    };
  }

  private async load(id: string) {
    const d = await this.prisma.ownerDistribution.findUnique({ where: { id } });
    if (!d) throw AppError.notFound("distribution");
    return d;
  }
}

import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { DomainEventType, type AuthUser } from "@nexahaus/types";
import type { RecordPaymentInput } from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate } from "../../common/pagination";
import { EventsService } from "../events/events.service";
import {
  PaymentProvider,
  type ProviderPaymentEvent,
} from "./provider/payment-provider";
import {
  allocateExplicit,
  allocateOldestFirst,
  type AllocatableCharge,
  type AllocationResult,
} from "./allocation.util";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly provider: PaymentProvider,
  ) {}

  // --------------------------------------------------------------------------
  // Manual entry (finance officer)
  // --------------------------------------------------------------------------

  async recordManual(
    user: AuthUser,
    input: RecordPaymentInput,
    ctx: AuditContext,
  ) {
    // Idempotency: a repeated key returns the original payment untouched.
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true },
    });
    if (existing) return this.getById(user, existing.id);

    const lease = await this.prisma.lease.findUnique({
      where: { id: input.leaseId },
      select: {
        id: true,
        clientId: true,
        propertyId: true,
        unitId: true,
        rentCurrency: true,
        parties: {
          where: { isPrimary: true },
          select: { tenantId: true },
          take: 1,
        },
      },
    });
    if (!lease) throw AppError.notFound("lease");
    if (!user.scopeExempt && !user.clientIds.includes(lease.clientId)) {
      const staffOk =
        user.permissions.includes("payment:record") &&
        user.assignedPropertyIds.includes(lease.propertyId);
      if (!staffOk) throw AppError.forbidden();
    }

    const amountMinor = BigInt(input.amount.minor);
    if (amountMinor <= 0n)
      throw AppError.validation("Amount must be positive.");
    if (input.amount.currency !== lease.rentCurrency) {
      throw AppError.validation(
        `Payment currency (${input.amount.currency}) does not match the lease (${lease.rentCurrency}).`,
      );
    }

    const payment = await this.settle({
      lease,
      amountMinor,
      currency: input.amount.currency,
      receivedAt: new Date(input.receivedAt),
      method: input.method,
      provider: null,
      providerRef: input.reference ?? null,
      idempotencyKey: input.idempotencyKey,
      explicitAllocations: input.allocations?.map((a) => ({
        rentChargeId: a.rentChargeId,
        amountMinor: BigInt(a.amount),
      })),
      recordedById: user.userId,
      auditCtx: ctx,
    });

    return this.getById(user, payment.id);
  }

  // --------------------------------------------------------------------------
  // Initiation (spec §15, §110) — begin a payment; the webhook confirms it.
  // --------------------------------------------------------------------------

  async initiate(
    user: AuthUser,
    leaseId: string,
    amount: { minor: string; currency: string },
  ) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      select: {
        id: true,
        ref: true,
        clientId: true,
        propertyId: true,
        rentCurrency: true,
        parties: { select: { tenantId: true } },
      },
    });
    if (!lease) throw AppError.notFound("lease");

    const tenantOnLease =
      user.tenantId != null &&
      lease.parties.some((p) => p.tenantId === user.tenantId);
    const staffOrOwner =
      user.scopeExempt ||
      user.clientIds.includes(lease.clientId) ||
      (user.permissions.includes("payment:record") &&
        user.assignedPropertyIds.includes(lease.propertyId));
    if (!tenantOnLease && !staffOrOwner) throw AppError.forbidden();

    const amountMinor = BigInt(amount.minor);
    if (amountMinor <= 0n)
      throw AppError.validation("Amount must be positive.");
    if (amount.currency !== lease.rentCurrency) {
      throw AppError.validation(
        `Payment currency (${amount.currency}) does not match the lease (${lease.rentCurrency}).`,
      );
    }

    const result = await this.provider.initiate({
      amountMinor,
      currency: amount.currency,
      reference: lease.ref,
    });
    return {
      provider: this.provider.name,
      leaseRef: lease.ref,
      amount,
      providerRef: result.providerRef,
      redirectUrl: result.redirectUrl ?? null,
      instructions: result.instructions,
      expiresAt: result.expiresAt,
    };
  }

  // --------------------------------------------------------------------------
  // Provider webhook
  // --------------------------------------------------------------------------

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!this.provider.supportsWebhook) {
      throw AppError.notFound("webhook");
    }
    if (!this.provider.verifyWebhook(rawBody, signature)) {
      throw AppError.webhookSignatureInvalid();
    }
    const event = this.provider.parseEvent(rawBody);
    if (!event) throw AppError.validation("Unparseable webhook payload.");

    // Idempotency: unique (provider, providerEventId). A replay is a no-op 200.
    const priorEvent = await this.prisma.paymentProviderWebhookEvent.findUnique(
      {
        where: {
          provider_providerEventId: {
            provider: this.provider.name,
            providerEventId: event.providerEventId,
          },
        },
        select: { id: true, resultingPaymentId: true },
      },
    );
    if (priorEvent) {
      return { status: "replayed", paymentId: priorEvent.resultingPaymentId };
    }

    if (event.status !== "CONFIRMED") {
      await this.prisma.paymentProviderWebhookEvent.create({
        data: {
          provider: this.provider.name,
          providerEventId: event.providerEventId,
          signatureValid: true,
          payload: JSON.parse(
            rawBody.toString("utf8"),
          ) as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
      return { status: "ignored", reason: `status ${event.status}` };
    }

    const lease = await this.resolveLease(event);
    if (!lease) {
      // Record the event so we don't reprocess; flag for manual reconciliation.
      await this.prisma.paymentProviderWebhookEvent.create({
        data: {
          provider: this.provider.name,
          providerEventId: event.providerEventId,
          signatureValid: true,
          payload: JSON.parse(
            rawBody.toString("utf8"),
          ) as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
      this.logger.warn(
        { providerEventId: event.providerEventId, ref: event.providerRef },
        "Webhook payment could not be matched to a lease — needs manual reconciliation",
      );
      return { status: "unmatched" };
    }

    const payment = await this.settle({
      lease,
      amountMinor: event.amountMinor,
      currency: event.currency,
      receivedAt: event.occurredAt,
      method: event.method,
      provider: this.provider.name,
      providerRef: event.providerRef,
      idempotencyKey: `${this.provider.name}:${event.providerEventId}`,
      recordedById: null,
      webhookEvent: {
        providerEventId: event.providerEventId,
        rawBody,
      },
      auditCtx: { actorUserId: null, actorRoleKey: "SYSTEM" },
    });

    return { status: "processed", paymentId: payment.id };
  }

  // --------------------------------------------------------------------------
  // Core settlement — one DB transaction (spec §50, ARCHITECTURE §5.2)
  // --------------------------------------------------------------------------

  private async settle(args: {
    lease: {
      id: string;
      clientId: string;
      propertyId: string;
      unitId: string;
      parties: { tenantId: string }[];
    };
    amountMinor: bigint;
    currency: string;
    receivedAt: Date;
    method: string;
    provider: string | null;
    providerRef: string | null;
    idempotencyKey: string;
    explicitAllocations?: { rentChargeId: string; amountMinor: bigint }[];
    recordedById: string | null;
    webhookEvent?: { providerEventId: string; rawBody: Buffer };
    auditCtx: AuditContext;
  }) {
    const { lease } = args;
    const tenantId = lease.parties[0]?.tenantId ?? null;

    return this.prisma.$transaction(async (tx) => {
      const charges = await tx.rentCharge.findMany({
        where: {
          leaseId: lease.id,
          status: { in: ["EXPECTED", "PARTIALLY_PAID", "OVERDUE"] },
        },
        orderBy: { periodStart: "asc" },
        select: { id: true, amountMinor: true, paidMinor: true },
      });

      let allocation: AllocationResult;
      if (args.explicitAllocations?.length) {
        const byId = new Map<string, AllocatableCharge>(
          charges.map((c) => [c.id, c]),
        );
        try {
          allocation = allocateExplicit(
            args.amountMinor,
            args.explicitAllocations,
            byId,
          );
        } catch (err) {
          throw AppError.validation((err as Error).message);
        }
      } else {
        allocation = allocateOldestFirst(args.amountMinor, charges);
      }

      const paymentRef = await this.refs.next("payment", tx);
      const txnRef = await this.refs.next("transaction", tx);

      const transaction = await tx.transaction.create({
        data: {
          ref: txnRef,
          type: "RENT_PAYMENT",
          amountMinor: args.amountMinor,
          currency: args.currency,
          occurredAt: args.receivedAt,
          propertyId: lease.propertyId,
          unitId: lease.unitId,
          leaseId: lease.id,
          tenantId,
          clientId: lease.clientId,
          category: "RENT",
          reference: args.providerRef,
          method: args.method as never,
          provider: args.provider,
          status: "POSTED",
          reconciliationStatus: args.provider ? "RECONCILED" : "UNRECONCILED",
          createdById: args.recordedById,
        },
      });

      const payment = await tx.payment.create({
        data: {
          ref: paymentRef,
          tenantId,
          leaseId: lease.id,
          propertyId: lease.propertyId,
          unitId: lease.unitId,
          clientId: lease.clientId,
          amountMinor: args.amountMinor,
          currency: args.currency,
          receivedAt: args.receivedAt,
          method: args.method as never,
          provider: args.provider,
          providerRef: args.providerRef,
          status: "CONFIRMED",
          reconciliationStatus: args.provider ? "RECONCILED" : "UNRECONCILED",
          idempotencyKey: args.idempotencyKey,
          transactionId: transaction.id,
          recordedById: args.recordedById,
          allocations: {
            create: allocation.allocations.map((a) => ({
              rentChargeId: a.rentChargeId,
              amountMinor: a.amountMinor,
            })),
          },
        },
      });

      for (const alloc of allocation.allocations) {
        await tx.rentCharge.update({
          where: { id: alloc.rentChargeId },
          data: { paidMinor: alloc.newPaidMinor, status: alloc.newStatus },
        });
      }

      if (args.webhookEvent) {
        await tx.paymentProviderWebhookEvent.create({
          data: {
            provider: this.provider.name,
            providerEventId: args.webhookEvent.providerEventId,
            signatureValid: true,
            payload: JSON.parse(
              args.webhookEvent.rawBody.toString("utf8"),
            ) as Prisma.InputJsonValue,
            processedAt: new Date(),
            resultingPaymentId: payment.id,
          },
        });
      }

      await this.events.emit(
        DomainEventType.PAYMENT_RECEIVED,
        {
          paymentId: payment.id,
          leaseId: lease.id,
          propertyId: lease.propertyId,
          clientId: lease.clientId,
          amountMinor: args.amountMinor.toString(),
          currency: args.currency,
          unallocatedMinor: allocation.unallocatedMinor.toString(),
        },
        tx,
      );
      await this.events.emit(
        DomainEventType.RENT_RECEIVED,
        {
          paymentId: payment.id,
          clientId: lease.clientId,
          propertyId: lease.propertyId,
        },
        tx,
      );

      await this.audit.record(
        {
          ...args.auditCtx,
          action: args.provider ? "payment.webhook" : "payment.record",
          resourceType: "payment",
          resourceId: payment.id,
          after: {
            ref: payment.ref,
            amountMinor: args.amountMinor.toString(),
            method: args.method,
            allocations: allocation.allocations.length,
            unallocatedMinor: allocation.unallocatedMinor.toString(),
          },
        },
        tx,
      );

      return payment;
    });
  }

  // --------------------------------------------------------------------------
  // Read + refund
  // --------------------------------------------------------------------------

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      propertyId?: string;
      leaseId?: string;
      status?: string;
      reconciliationStatus?: string;
    },
  ) {
    const { skip, take, page, pageSize } = pageParams(query);
    const scope: Prisma.PaymentWhereInput = user.scopeExempt
      ? {}
      : {
          OR: [
            user.clientIds.length
              ? { clientId: { in: user.clientIds } }
              : { id: "" },
            user.assignedPropertyIds.length
              ? { propertyId: { in: user.assignedPropertyIds } }
              : { id: "" },
            user.tenantId ? { tenantId: user.tenantId } : { id: "" },
          ],
        };
    const where: Prisma.PaymentWhereInput = {
      AND: [
        scope,
        query.propertyId ? { propertyId: query.propertyId } : {},
        query.leaseId ? { leaseId: query.leaseId } : {},
        query.status ? { status: query.status as never } : {},
        query.reconciliationStatus
          ? { reconciliationStatus: query.reconciliationStatus as never }
          : {},
      ],
    };
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { receivedAt: "desc" },
        include: {
          property: { select: { name: true, ref: true } },
          tenant: { select: { fullName: true } },
          allocations: { select: { amountMinor: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginate(
      rows.map((p) => {
        const allocated = p.allocations.reduce((s, a) => s + a.amountMinor, 0n);
        return {
          id: p.id,
          ref: p.ref,
          amount: { minor: p.amountMinor.toString(), currency: p.currency },
          allocatedMinor: allocated.toString(),
          unallocatedMinor: (p.amountMinor - allocated).toString(),
          method: p.method,
          provider: p.provider,
          status: p.status,
          reconciliationStatus: p.reconciliationStatus,
          receivedAt: p.receivedAt.toISOString(),
          property: p.property,
          tenant: p.tenant?.fullName ?? null,
        };
      }),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(user: AuthUser, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, clientId: true, name: true, ref: true },
        },
        tenant: { select: { id: true, fullName: true } },
        lease: { select: { id: true, ref: true } },
        allocations: {
          include: {
            rentCharge: {
              select: {
                id: true,
                periodStart: true,
                amountMinor: true,
                currency: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (
      !payment ||
      (!user.scopeExempt &&
        !user.clientIds.includes(payment.clientId) &&
        !user.assignedPropertyIds.includes(payment.propertyId) &&
        payment.tenantId !== user.tenantId)
    ) {
      throw AppError.notFound("payment");
    }
    const allocated = payment.allocations.reduce(
      (s, a) => s + a.amountMinor,
      0n,
    );
    return {
      id: payment.id,
      ref: payment.ref,
      amount: {
        minor: payment.amountMinor.toString(),
        currency: payment.currency,
      },
      allocatedMinor: allocated.toString(),
      unallocatedMinor: (payment.amountMinor - allocated).toString(),
      method: payment.method,
      provider: payment.provider,
      providerRef: payment.providerRef,
      status: payment.status,
      reconciliationStatus: payment.reconciliationStatus,
      receivedAt: payment.receivedAt.toISOString(),
      property: {
        id: payment.property.id,
        name: payment.property.name,
        ref: payment.property.ref,
      },
      tenant: payment.tenant,
      lease: payment.lease,
      allocations: payment.allocations.map((a) => ({
        rentChargeId: a.rentChargeId,
        amountMinor: a.amountMinor.toString(),
        period: a.rentCharge.periodStart.toISOString(),
        chargeStatus: a.rentCharge.status,
      })),
    };
  }

  /** Mark payments (and their transactions) reconciled. Locks them from casual edits. */
  async reconcile(user: AuthUser, ids: string[], ctx: AuditContext) {
    const payments = await this.prisma.payment.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        propertyId: true,
        clientId: true,
        transactionId: true,
        reconciliationStatus: true,
      },
    });
    for (const p of payments) {
      if (
        !user.scopeExempt &&
        !user.clientIds.includes(p.clientId) &&
        !user.assignedPropertyIds.includes(p.propertyId)
      ) {
        throw AppError.forbidden();
      }
    }
    const toUpdate = payments.filter(
      (p) => p.reconciliationStatus !== "RECONCILED",
    );
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { id: { in: toUpdate.map((p) => p.id) } },
        data: { reconciliationStatus: "RECONCILED" },
      });
      await tx.transaction.updateMany({
        where: {
          id: {
            in: toUpdate
              .map((p) => p.transactionId)
              .filter(Boolean) as string[],
          },
        },
        data: { reconciliationStatus: "RECONCILED" },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "payment.reconcile",
          resourceType: "payment",
          resourceId: toUpdate.map((p) => p.id).join(","),
          after: { count: toUpdate.length },
        },
        tx,
      );
    });
    return {
      reconciled: toUpdate.length,
      alreadyReconciled: payments.length - toUpdate.length,
    };
  }

  async refund(user: AuthUser, id: string, reason: string, ctx: AuditContext) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { transaction: true },
    });
    if (!payment) throw AppError.notFound("payment");
    if (!user.scopeExempt && !user.clientIds.includes(payment.clientId)) {
      const staffOk =
        user.permissions.includes("payment:refund") &&
        user.assignedPropertyIds.includes(payment.propertyId);
      if (!staffOk) throw AppError.forbidden();
    }
    if (payment.status === "REFUNDED") {
      throw AppError.conflict("This payment has already been refunded.");
    }
    // A reconciled payment is locked: correcting it requires the adjustment
    // right, and the correction is still a REVERSAL (never an in-place edit).
    if (
      payment.reconciliationStatus === "RECONCILED" &&
      !user.scopeExempt &&
      !user.permissions.includes("transaction:adjust")
    ) {
      throw AppError.reconciledImmutable();
    }

    await this.prisma.$transaction(async (tx) => {
      const reversalRef = await this.refs.next("transaction", tx);
      const reversal = await tx.transaction.create({
        data: {
          ref: reversalRef,
          type: "REVERSAL",
          amountMinor: -payment.amountMinor,
          currency: payment.currency,
          occurredAt: new Date(),
          propertyId: payment.propertyId,
          leaseId: payment.leaseId,
          tenantId: payment.tenantId,
          clientId: payment.clientId,
          category: "RENT_REFUND",
          reference: reason,
          method: payment.method,
          status: "POSTED",
          reversesTransactionId: payment.transactionId,
          createdById: user.userId,
        },
      });
      // Roll back the allocations.
      const allocations = await tx.paymentAllocation.findMany({
        where: { paymentId: id },
      });
      for (const a of allocations) {
        const charge = await tx.rentCharge.findUniqueOrThrow({
          where: { id: a.rentChargeId },
        });
        const newPaid = charge.paidMinor - a.amountMinor;
        await tx.rentCharge.update({
          where: { id: a.rentChargeId },
          data: {
            paidMinor: newPaid < 0n ? 0n : newPaid,
            status: newPaid <= 0n ? "OVERDUE" : "PARTIALLY_PAID",
          },
        });
      }
      await tx.payment.update({
        where: { id },
        data: { status: "REFUNDED", reconciliationStatus: "DISPUTED" },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "payment.refund",
          resourceType: "payment",
          resourceId: id,
          before: { status: payment.status },
          after: {
            status: "REFUNDED",
            reversalTransactionId: reversal.id,
            reason,
          },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }

  // --------------------------------------------------------------------------

  private async resolveLease(event: ProviderPaymentEvent) {
    const refToken =
      event.leaseRef ??
      event.narration?.match(/LS-\d{6}/i)?.[0] ??
      event.providerRef.match(/LS-\d{6}/i)?.[0];
    if (!refToken) return null;
    return this.prisma.lease.findFirst({
      where: {
        ref: refToken.toUpperCase(),
        status: { in: ["ACTIVE", "EXPIRING"] },
      },
      select: {
        id: true,
        clientId: true,
        propertyId: true,
        unitId: true,
        rentCurrency: true,
        parties: {
          where: { isPrimary: true },
          select: { tenantId: true },
          take: 1,
        },
      },
    });
  }
}

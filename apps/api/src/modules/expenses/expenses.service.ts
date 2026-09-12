import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import type {
  CreateExpenseInput,
  ListExpenseQuery,
  PayExpenseInput,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate } from "../../common/pagination";
import { propertyInScope } from "../authz/scope.util";
import { ApprovalsService } from "../approvals/approvals.service";

const DEFAULT_THRESHOLD_MINOR = 150_000n;

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalsService,
  ) {}

  async list(user: AuthUser, query: ListExpenseQuery) {
    const { skip, take, page, pageSize } = pageParams(query);
    const scope: Prisma.ExpenseWhereInput = user.scopeExempt
      ? {}
      : {
          OR: [
            user.clientIds.length
              ? { property: { clientId: { in: user.clientIds } } }
              : { id: "" },
            user.assignedPropertyIds.length
              ? { propertyId: { in: user.assignedPropertyIds } }
              : { id: "" },
          ],
        };
    const where: Prisma.ExpenseWhereInput = {
      AND: [
        scope,
        query.status ? { status: query.status } : {},
        query.approvalStatus ? { approvalStatus: query.approvalStatus } : {},
        query.category ? { category: query.category } : {},
        query.propertyId ? { propertyId: query.propertyId } : {},
      ],
    };
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: { incurredAt: "desc" },
        include: {
          property: { select: { name: true, ref: true } },
          vendor: { select: { name: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);
    return paginate(
      rows.map((e) => ({
        id: e.id,
        ref: e.ref,
        category: e.category,
        description: e.description,
        amount: { minor: e.amountMinor.toString(), currency: e.currency },
        tax: { minor: e.taxMinor.toString(), currency: e.currency },
        total: {
          minor: (e.amountMinor + e.taxMinor).toString(),
          currency: e.currency,
        },
        status: e.status,
        approvalStatus: e.approvalStatus,
        paymentStatus: e.paymentStatus,
        incurredAt: e.incurredAt.toISOString(),
        property: e.property,
        vendor: e.vendor?.name ?? null,
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(user: AuthUser, id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, clientId: true, name: true, ref: true },
        },
        vendor: { select: { id: true, name: true } },
        approvals: { orderBy: { decidedAt: "desc" } },
      },
    });
    if (!expense || !propertyInScope(user, expense.property)) {
      throw AppError.notFound("expense");
    }
    return {
      id: expense.id,
      ref: expense.ref,
      category: expense.category,
      description: expense.description,
      amount: {
        minor: expense.amountMinor.toString(),
        currency: expense.currency,
      },
      tax: { minor: expense.taxMinor.toString(), currency: expense.currency },
      total: {
        minor: (expense.amountMinor + expense.taxMinor).toString(),
        currency: expense.currency,
      },
      status: expense.status,
      approvalStatus: expense.approvalStatus,
      paymentStatus: expense.paymentStatus,
      invoiceDocumentId: expense.invoiceDocumentId,
      maintenanceRequestId: expense.maintenanceRequestId,
      incurredAt: expense.incurredAt.toISOString(),
      property: {
        id: expense.property.id,
        name: expense.property.name,
        ref: expense.property.ref,
      },
      vendor: expense.vendor,
      approvalHistory: expense.approvals.map((a) => ({
        decision: a.decision,
        note: a.note,
        decidedAt: a.decidedAt.toISOString(),
      })),
    };
  }

  async create(user: AuthUser, input: CreateExpenseInput, ctx: AuditContext) {
    const property = await this.prisma.property.findFirst({
      where: { id: input.propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    if (input.tax && input.tax.currency !== input.amount.currency) {
      throw AppError.validation(
        "Tax currency must match the expense currency.",
      );
    }

    const expense = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("expense", tx);
      const created = await tx.expense.create({
        data: {
          ref,
          propertyId: input.propertyId,
          unitId: input.unitId ?? null,
          vendorId: input.vendorId ?? null,
          category: input.category,
          description: input.description,
          amountMinor: BigInt(input.amount.minor),
          taxMinor: input.tax ? BigInt(input.tax.minor) : 0n,
          currency: input.amount.currency,
          invoiceDocumentId: input.invoiceDocumentId ?? null,
          incurredAt: new Date(input.incurredAt),
          maintenanceRequestId: input.maintenanceRequestId ?? null,
          status: "DRAFT",
          approvalStatus: "NOT_REQUIRED",
          paymentStatus: "UNPAID",
          createdById: user.userId,
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "expense.create",
          resourceType: "expense",
          resourceId: created.id,
          after: {
            ref: created.ref,
            category: created.category,
            amountMinor: input.amount.minor,
          },
        },
        tx,
      );
      return created;
    });
    return this.getById(user, expense.id);
  }

  async submit(user: AuthUser, id: string, ctx: AuditContext) {
    const expense = await this.loadInScope(user, id);
    if (expense.status !== "DRAFT") {
      throw AppError.illegalTransition(
        `A ${expense.status} expense cannot be submitted.`,
      );
    }
    const total = expense.amountMinor + expense.taxMinor;
    const threshold = await this.thresholdFor(expense.propertyId);
    const needsApproval = total > threshold;

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: {
          status: needsApproval ? "SUBMITTED" : "APPROVED",
          approvalStatus: needsApproval ? "PENDING" : "NOT_REQUIRED",
        },
      });
      if (needsApproval) {
        await this.approvals.createInTx(tx, {
          type: "EXPENSE",
          subjectRefType: "expense",
          subjectRefId: id,
          propertyId: expense.propertyId,
          clientId: expense.property.clientId,
          requestedByUserId: user.userId,
          thresholdMinor: threshold,
          amountMinor: total,
          currency: expense.currency,
          dueInDays: 7,
        });
      }
      await this.audit.record(
        {
          ...ctx,
          action: "expense.submit",
          resourceType: "expense",
          resourceId: id,
          after: {
            status: needsApproval ? "SUBMITTED" : "APPROVED",
            needsApproval,
          },
        },
        tx,
      );
    });
    return this.getById(user, id);
  }

  /** Direct finance-officer decision (under-threshold or delegated authority). */
  async decide(
    user: AuthUser,
    id: string,
    decision: "APPROVED" | "REJECTED",
    note: string | undefined,
    ctx: AuditContext,
  ) {
    const expense = await this.loadInScope(user, id);
    if (!["SUBMITTED", "DRAFT"].includes(expense.status)) {
      throw AppError.illegalTransition(
        `A ${expense.status} expense cannot be decided.`,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: {
          status: decision,
          approvalStatus: decision === "APPROVED" ? "APPROVED" : "DECLINED",
        },
      });
      await tx.expenseApproval.create({
        data: {
          expenseId: id,
          approverUserId: user.userId,
          decision: decision === "APPROVED" ? "APPROVED" : "DECLINED",
          note: note ?? null,
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: `expense.${decision.toLowerCase()}`,
          resourceType: "expense",
          resourceId: id,
          after: { status: decision, note },
        },
        tx,
      );
    });
    return this.getById(user, id);
  }

  async pay(
    user: AuthUser,
    id: string,
    input: PayExpenseInput,
    ctx: AuditContext,
  ) {
    const expense = await this.loadInScope(user, id);
    if (expense.status !== "APPROVED") {
      throw AppError.illegalTransition("Only an approved expense can be paid.");
    }
    if (expense.paymentStatus === "PAID") {
      throw AppError.conflict("This expense has already been paid.");
    }

    await this.prisma.$transaction(async (tx) => {
      const txnRef = await this.refs.next("transaction", tx);
      const total = expense.amountMinor + expense.taxMinor;
      await tx.transaction.create({
        data: {
          ref: txnRef,
          type: "EXPENSE",
          amountMinor: -total,
          currency: expense.currency,
          occurredAt: input.paidAt ? new Date(input.paidAt) : new Date(),
          propertyId: expense.propertyId,
          clientId: expense.property.clientId,
          vendorId: expense.vendorId,
          category: expense.category,
          reference: input.reference ?? expense.ref,
          method: input.method as never,
          status: "POSTED",
          reconciliationStatus: "UNRECONCILED",
          createdById: user.userId,
        },
      });
      await tx.expense.update({
        where: { id },
        data: { status: "PAID", paymentStatus: "PAID" },
      });
      if (expense.vendorId) {
        await tx.vendorPayment.create({
          data: {
            vendorId: expense.vendorId,
            expenseId: id,
            amountMinor: total,
            currency: expense.currency,
            status: "PAID",
            paidAt: new Date(),
          },
        });
      }
      await this.audit.record(
        {
          ...ctx,
          action: "expense.pay",
          resourceType: "expense",
          resourceId: id,
          after: {
            status: "PAID",
            method: input.method,
            amountMinor: total.toString(),
          },
        },
        tx,
      );
    });
    return this.getById(user, id);
  }

  private async loadInScope(user: AuthUser, id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { property: { select: { id: true, clientId: true } } },
    });
    if (!expense || !propertyInScope(user, expense.property)) {
      throw AppError.notFound("expense");
    }
    return expense;
  }

  private async thresholdFor(propertyId: string): Promise<bigint> {
    const agreement = await this.prisma.managementAgreement.findFirst({
      where: { propertyId, status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      select: { maintenanceApprovalThresholdMinor: true },
    });
    if (agreement && agreement.maintenanceApprovalThresholdMinor > 0n) {
      return agreement.maintenanceApprovalThresholdMinor;
    }
    const setting = await this.prisma.organizationSetting.findUnique({
      where: { key: "approval.thresholds" },
    });
    const raw = (
      setting?.value as { maintenanceCostMinor?: string } | undefined
    )?.maintenanceCostMinor;
    return raw ? BigInt(raw) : DEFAULT_THRESHOLD_MINOR;
  }
}

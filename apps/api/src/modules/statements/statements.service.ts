import { createHash, randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { DomainEventType, type AuthUser } from "@nexahaus/types";
import type {
  GenerateStatementInput,
  ListStatementQuery,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate } from "../../common/pagination";
import { clientInScope } from "../authz/scope.util";
import { EventsService } from "../events/events.service";
import { StorageService } from "../storage/storage.service";
import { PdfService } from "../reports/pdf.service";
import { computeManagementFee } from "../finance/management-fee.util";

const MAINTENANCE_CATEGORIES = new Set([
  "PLUMBING",
  "ELECTRICAL",
  "PAINTING",
  "AIR_CONDITIONING",
  "PEST_CONTROL",
  "REPAIRS",
  "CLEANING",
  "LANDSCAPING",
]);

/**
 * Owner statements (spec §18). Totals are ALWAYS recomputed from Transaction
 * rows — there is no endpoint that edits a statement total. Generation is
 * idempotent per (client, property, period). The management fee for the period
 * is posted as its own MANAGEMENT_FEE transaction so the statement stays
 * reproducible from the ledger.
 */
@Injectable()
export class StatementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly storage: StorageService,
    private readonly pdf: PdfService,
  ) {}

  async generate(
    user: AuthUser,
    input: GenerateStatementInput,
    ctx: AuditContext,
  ) {
    if (!user.scopeExempt && !clientInScope(user, input.clientId)) {
      throw AppError.forbidden();
    }
    const client = await this.prisma.client.findFirst({
      where: { id: input.clientId, deletedAt: null },
      select: { id: true, displayName: true },
    });
    if (!client) throw AppError.notFound("client");

    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);

    const existing = await this.prisma.statement.findFirst({
      where: {
        clientId: input.clientId,
        propertyId: input.propertyId ?? null,
        periodStart,
      },
      select: { id: true },
    });
    if (existing) return this.getById(user, existing.id);

    const properties = await this.prisma.property.findMany({
      where: input.propertyId
        ? { id: input.propertyId, clientId: input.clientId }
        : {
            deletedAt: null,
            OR: [
              { clientId: input.clientId },
              { owners: { some: { clientId: input.clientId } } },
            ],
          },
      select: {
        id: true,
        name: true,
        agreements: {
          where: { status: "ACTIVE" },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });
    if (properties.length === 0) throw AppError.validation("No properties for this statement.");
    const propertyIds = properties.map((p) => p.id);
    const months = wholeMonths(periodStart, periodEnd);

    // 1. Post the management fee for the period (idempotent per property+period).
    for (const property of properties) {
      const agreement = property.agreements[0];
      if (!agreement) continue;
      const feeRef = `FEE:${property.id}:${input.periodStart}`;
      const already = await this.prisma.transaction.findFirst({
        where: { type: "MANAGEMENT_FEE", reference: feeRef },
        select: { id: true },
      });
      if (already) continue;

      const [collected, expected] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            propertyId: property.id,
            type: "RENT_PAYMENT",
            occurredAt: { gte: periodStart, lt: periodEnd },
          },
          _sum: { amountMinor: true },
        }),
        this.prisma.rentCharge.aggregate({
          where: {
            propertyId: property.id,
            dueDate: { gte: periodStart, lt: periodEnd },
            status: { not: "WAIVED" },
          },
          _sum: { amountMinor: true },
        }),
      ]);
      const fee = computeManagementFee(
        {
          feeType: agreement.feeType,
          feePercent: agreement.feePercent ? Number(agreement.feePercent) : null,
          feeFixedMinor: agreement.feeFixedMinor,
          feeCurrency: agreement.feeCurrency,
        },
        {
          collectedMinor: collected._sum.amountMinor ?? 0n,
          expectedMinor: expected._sum.amountMinor ?? 0n,
          months,
        },
      );
      if (fee > 0n) {
        const txnRef = await this.refs.next("transaction");
        await this.prisma.transaction.create({
          data: {
            ref: txnRef,
            type: "MANAGEMENT_FEE",
            amountMinor: -fee,
            currency: agreement.feeCurrency,
            occurredAt: new Date(periodEnd.getTime() - 1),
            propertyId: property.id,
            clientId: input.clientId,
            category: "MANAGEMENT_FEE",
            reference: feeRef,
            method: "NONE",
            status: "POSTED",
            createdById: ctx.actorUserId ?? null,
          },
        });
      }
    }

    // 2. Opening balance = net effect of every transaction before the period.
    const opening = await this.prisma.transaction.aggregate({
      where: {
        clientId: input.clientId,
        propertyId: { in: propertyIds },
        status: "POSTED",
        occurredAt: { lt: periodStart },
      },
      _sum: { amountMinor: true },
    });
    const openingBalanceMinor = opening._sum.amountMinor ?? 0n;

    // 3. In-period transactions become statement lines and category totals.
    const txns = await this.prisma.transaction.findMany({
      where: {
        clientId: input.clientId,
        propertyId: { in: propertyIds },
        status: "POSTED",
        occurredAt: { gte: periodStart, lt: periodEnd },
      },
      orderBy: { occurredAt: "asc" },
      select: {
        id: true,
        type: true,
        category: true,
        amountMinor: true,
        currency: true,
        occurredAt: true,
        reference: true,
      },
    });

    let gross = 0n;
    let mgmtFees = 0n;
    let maintenance = 0n;
    let other = 0n;
    let distributions = 0n;
    let periodNet = 0n;

    for (const t of txns) {
      periodNet += t.amountMinor;
      const abs = t.amountMinor < 0n ? -t.amountMinor : t.amountMinor;
      if (t.type === "RENT_PAYMENT") gross += abs;
      else if (t.type === "MANAGEMENT_FEE") mgmtFees += abs;
      else if (t.type === "OWNER_DISTRIBUTION") distributions += abs;
      else if (t.type === "EXPENSE") {
        if (t.category && MAINTENANCE_CATEGORIES.has(t.category)) maintenance += abs;
        else other += abs;
      } else if (t.amountMinor < 0n) other += abs;
    }

    const netAmountMinor = gross - mgmtFees - maintenance - other;
    const closingBalanceMinor = openingBalanceMinor + periodNet;
    const currency = txns[0]?.currency ?? "GHS";

    const statement = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("statement", tx);
      const created = await tx.statement.create({
        data: {
          ref,
          clientId: input.clientId,
          propertyId: input.propertyId ?? null,
          periodStart,
          periodEnd,
          openingBalanceMinor,
          closingBalanceMinor,
          currency,
          grossRentalIncomeMinor: gross,
          managementFeesMinor: mgmtFees,
          maintenanceExpensesMinor: maintenance,
          otherExpensesMinor: other,
          netAmountMinor,
          distributionsMinor: distributions,
          status: "DRAFT",
          generatedById: ctx.actorUserId ?? null,
          lines: {
            create: txns.map((t) => ({
              transactionId: t.id,
              occurredAt: t.occurredAt,
              description: describe(t.type, t.category, t.reference),
              category: t.category,
              direction: t.amountMinor >= 0n ? "CREDIT" : "DEBIT",
              amountMinor: t.amountMinor < 0n ? -t.amountMinor : t.amountMinor,
            })),
          },
        },
      });
      await this.events.emit(
        DomainEventType.STATEMENT_GENERATED,
        {
          statementId: created.id,
          clientId: input.clientId,
          propertyId: input.propertyId ?? null,
          netAmountMinor: netAmountMinor.toString(),
        },
        tx,
      );
      await this.audit.record(
        {
          ...ctx,
          action: "statement.generate",
          resourceType: "statement",
          resourceId: created.id,
          after: {
            ref: created.ref,
            period: `${input.periodStart}..${input.periodEnd}`,
            netAmountMinor: netAmountMinor.toString(),
          },
        },
        tx,
      );
      return created;
    });

    await this.renderPdf(statement.id, client.displayName, properties.map((p) => p.name));

    return this.getById(user, statement.id);
  }

  private async renderPdf(
    statementId: string,
    ownerName: string,
    propertyNames: string[],
  ): Promise<void> {
    const statement = await this.prisma.statement.findUniqueOrThrow({
      where: { id: statementId },
      include: { lines: { orderBy: { occurredAt: "asc" } } },
    });
    const buffer = await this.pdf.statementReport({
      ref: statement.ref,
      ownerName,
      periodLabel: `${fmtDate(statement.periodStart)} – ${fmtDate(statement.periodEnd)}`,
      propertyLabel: statement.propertyId
        ? propertyNames[0] ?? "Property"
        : `Portfolio (${propertyNames.length} properties)`,
      currency: statement.currency,
      openingBalanceMinor: statement.openingBalanceMinor.toString(),
      grossRentalIncomeMinor: statement.grossRentalIncomeMinor.toString(),
      managementFeesMinor: statement.managementFeesMinor.toString(),
      maintenanceExpensesMinor: statement.maintenanceExpensesMinor.toString(),
      otherExpensesMinor: statement.otherExpensesMinor.toString(),
      netAmountMinor: statement.netAmountMinor.toString(),
      distributionsMinor: statement.distributionsMinor.toString(),
      closingBalanceMinor: statement.closingBalanceMinor.toString(),
      lines: statement.lines.map((l) => ({
        occurredAt: l.occurredAt.toISOString(),
        description: l.description,
        direction: l.direction,
        amountMinor: l.amountMinor.toString(),
      })),
    });

    const documentId = randomUUID();
    const versionId = randomUUID();
    const key = this.storage.buildKey({
      clientId: statement.clientId,
      scopeType: "STATEMENT",
      scopeId: statementId,
      documentId,
      versionId,
    });
    await this.storage.put(key, buffer, "application/pdf");
    const checksum = createHash("sha256").update(buffer).digest("hex");

    await this.prisma.$transaction([
      this.prisma.document.create({
        data: {
          id: documentId,
          scopeType: "STATEMENT",
          scopeId: statementId,
          category: "OTHER",
          title: `Owner statement ${statement.ref}`,
          mimeType: "application/pdf",
          sizeBytes: BigInt(buffer.length),
          checksumSha256: checksum,
          storageKey: key,
          currentVersionId: versionId,
          uploadedById: statement.generatedById,
          malwareScanStatus: "CLEAN",
          status: "ACTIVE",
        },
      }),
      this.prisma.documentVersion.create({
        data: {
          id: versionId,
          documentId,
          versionNo: 1,
          storageKey: key,
          sizeBytes: BigInt(buffer.length),
          checksumSha256: checksum,
          uploadedById: statement.generatedById,
        },
      }),
      this.prisma.statement.update({
        where: { id: statementId },
        data: { pdfDocumentId: documentId },
      }),
    ]);
  }

  async list(user: AuthUser, query: ListStatementQuery) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.StatementWhereInput = {
      ...(user.scopeExempt
        ? query.clientId
          ? { clientId: query.clientId }
          : {}
        : { clientId: { in: user.clientIds } }),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.statement.findMany({
        where,
        skip,
        take,
        orderBy: { periodStart: "desc" },
        include: { property: { select: { name: true } } },
      }),
      this.prisma.statement.count({ where }),
    ]);
    return paginate(
      rows.map((s) => ({
        id: s.id,
        ref: s.ref,
        periodStart: s.periodStart.toISOString(),
        periodEnd: s.periodEnd.toISOString(),
        property: s.property?.name ?? "Portfolio",
        currency: s.currency,
        netAmountMinor: s.netAmountMinor.toString(),
        closingBalanceMinor: s.closingBalanceMinor.toString(),
        status: s.status,
        hasPdf: s.pdfDocumentId !== null,
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(user: AuthUser, id: string) {
    const s = await this.prisma.statement.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, displayName: true } },
        property: { select: { id: true, name: true, ref: true } },
        lines: { orderBy: { occurredAt: "asc" } },
      },
    });
    if (!s || (!user.scopeExempt && !user.clientIds.includes(s.clientId))) {
      throw AppError.notFound("statement");
    }
    return {
      id: s.id,
      ref: s.ref,
      status: s.status,
      client: s.client,
      property: s.property,
      periodStart: s.periodStart.toISOString(),
      periodEnd: s.periodEnd.toISOString(),
      currency: s.currency,
      openingBalanceMinor: s.openingBalanceMinor.toString(),
      grossRentalIncomeMinor: s.grossRentalIncomeMinor.toString(),
      managementFeesMinor: s.managementFeesMinor.toString(),
      maintenanceExpensesMinor: s.maintenanceExpensesMinor.toString(),
      otherExpensesMinor: s.otherExpensesMinor.toString(),
      netAmountMinor: s.netAmountMinor.toString(),
      distributionsMinor: s.distributionsMinor.toString(),
      closingBalanceMinor: s.closingBalanceMinor.toString(),
      pdfDocumentId: s.pdfDocumentId,
      generatedAt: s.generatedAt.toISOString(),
      lines: s.lines.map((l) => ({
        occurredAt: l.occurredAt.toISOString(),
        description: l.description,
        category: l.category,
        direction: l.direction,
        amountMinor: l.amountMinor.toString(),
      })),
    };
  }

  async issue(user: AuthUser, id: string, ctx: AuditContext) {
    const s = await this.prisma.statement.findUnique({ where: { id } });
    if (!s) throw AppError.notFound("statement");
    if (s.status !== "DRAFT") {
      throw AppError.illegalTransition(`A ${s.status} statement cannot be issued.`);
    }
    await this.prisma.statement.update({ where: { id }, data: { status: "ISSUED" } });
    await this.audit.record({
      ...ctx,
      action: "statement.issue",
      resourceType: "statement",
      resourceId: id,
      after: { status: "ISSUED" },
    });
    return this.getById(user, id);
  }
}

function describe(type: string, category: string | null, reference: string | null): string {
  switch (type) {
    case "RENT_PAYMENT":
      return "Rent received";
    case "MANAGEMENT_FEE":
      return "Management fee";
    case "EXPENSE":
      return `Expense${category ? ` — ${titleCase(category)}` : ""}`;
    case "OWNER_DISTRIBUTION":
      return "Owner distribution";
    case "REFUND":
      return "Refund";
    case "REVERSAL":
      return `Reversal${reference ? ` — ${reference}` : ""}`;
    case "ADJUSTMENT":
      return `Adjustment${reference ? ` — ${reference}` : ""}`;
    default:
      return titleCase(type);
  }
}
function titleCase(v: string): string {
  return v
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
function wholeMonths(start: Date, end: Date): number {
  return Math.max(
    1,
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth()),
  );
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

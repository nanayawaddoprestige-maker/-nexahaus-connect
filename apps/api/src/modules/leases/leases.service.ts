import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import type {
  CreateLeaseInput,
  ListLeaseQuery,
  RenewLeaseInput,
  TerminateLeaseInput,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate, parseSort } from "../../common/pagination";
import { propertyInScope } from "../authz/scope.util";
import { rentPeriods } from "../finance/rent-schedule.util";

const SORTABLE = ["createdAt", "startDate", "endDate", "ref", "status"] as const;
const DEFAULT_REMINDER_OFFSETS = [90, 60, 30, 7];

@Injectable()
export class LeasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
  ) {}

  // --------------------------------------------------------------------------
  // Read
  // --------------------------------------------------------------------------

  async list(user: AuthUser, query: ListLeaseQuery) {
    const { skip, take, page, pageSize } = pageParams(query);
    const scope: Prisma.LeaseWhereInput = user.scopeExempt
      ? {}
      : {
          OR: [
            user.clientIds.length ? { clientId: { in: user.clientIds } } : { id: "" },
            user.assignedPropertyIds.length
              ? { propertyId: { in: user.assignedPropertyIds } }
              : { id: "" },
          ],
        };

    const expiring =
      query.expiringWithinDays != null
        ? {
            status: { in: ["ACTIVE", "EXPIRING"] as ("ACTIVE" | "EXPIRING")[] },
            endDate: {
              lte: new Date(Date.now() + query.expiringWithinDays * 86_400_000),
              gte: new Date(),
            },
          }
        : {};

    const where: Prisma.LeaseWhereInput = {
      AND: [
        scope,
        query.status ? { status: query.status } : {},
        query.propertyId ? { propertyId: query.propertyId } : {},
        query.unitId ? { unitId: query.unitId } : {},
        query.tenantId ? { parties: { some: { tenantId: query.tenantId } } } : {},
        expiring,
      ],
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.lease.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(query.sort, SORTABLE, { startDate: "desc" }),
        select: {
          id: true,
          ref: true,
          status: true,
          startDate: true,
          endDate: true,
          rentMinor: true,
          rentCurrency: true,
          frequency: true,
          renewalStatus: true,
          property: { select: { id: true, name: true, ref: true } },
          unit: { select: { id: true, label: true } },
          parties: {
            where: { isPrimary: true },
            select: { tenant: { select: { id: true, fullName: true } } },
          },
        },
      }),
      this.prisma.lease.count({ where }),
    ]);

    return paginate(
      rows.map((l) => ({
        id: l.id,
        ref: l.ref,
        status: l.status,
        startDate: l.startDate.toISOString(),
        endDate: l.endDate.toISOString(),
        rent: { minor: l.rentMinor.toString(), currency: l.rentCurrency },
        frequency: l.frequency,
        renewalStatus: l.renewalStatus,
        property: l.property,
        unit: l.unit,
        primaryTenant: l.parties[0]?.tenant ?? null,
        daysToExpiry: Math.ceil((l.endDate.getTime() - Date.now()) / 86_400_000),
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(user: AuthUser, id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, clientId: true, name: true, ref: true } },
        unit: { select: { id: true, label: true, status: true } },
        client: { select: { id: true, displayName: true } },
        parties: {
          select: {
            isPrimary: true,
            tenant: { select: { id: true, ref: true, fullName: true, phone: true } },
          },
        },
        reminders: { orderBy: { remindAt: "asc" } },
        rentCharges: { orderBy: { periodStart: "asc" } },
      },
    });
    if (!lease || !propertyInScope(user, lease.property)) {
      throw AppError.notFound("lease");
    }

    const billed = lease.rentCharges.reduce((s, c) => s + c.amountMinor, 0n);
    const paid = lease.rentCharges.reduce((s, c) => s + c.paidMinor, 0n);

    return {
      id: lease.id,
      ref: lease.ref,
      status: lease.status,
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate.toISOString(),
      rent: { minor: lease.rentMinor.toString(), currency: lease.rentCurrency },
      frequency: lease.frequency,
      deposit: lease.depositMinor
        ? { minor: lease.depositMinor.toString(), currency: lease.depositCurrency ?? "GHS" }
        : null,
      noticePeriodDays: lease.noticePeriodDays,
      renewalStatus: lease.renewalStatus,
      terminatedAt: lease.terminatedAt?.toISOString() ?? null,
      terminationReason: lease.terminationReason,
      documentId: lease.documentId,
      property: { id: lease.property.id, name: lease.property.name, ref: lease.property.ref },
      unit: lease.unit,
      client: lease.client,
      tenants: lease.parties.map((p) => ({ ...p.tenant, isPrimary: p.isPrimary })),
      reminders: lease.reminders.map((r) => ({
        type: r.type,
        remindAt: r.remindAt.toISOString(),
        sent: r.sentAt !== null,
      })),
      rentCharges: lease.rentCharges.map((c) => ({
        id: c.id,
        periodStart: c.periodStart.toISOString(),
        periodEnd: c.periodEnd.toISOString(),
        dueDate: c.dueDate.toISOString(),
        amount: { minor: c.amountMinor.toString(), currency: c.currency },
        paidMinor: c.paidMinor.toString(),
        outstandingMinor: (c.amountMinor - c.paidMinor).toString(),
        status: c.status,
      })),
      summary: {
        billedMinor: billed.toString(),
        paidMinor: paid.toString(),
        outstandingMinor: (billed - paid).toString(),
      },
    };
  }

  // --------------------------------------------------------------------------
  // Write
  // --------------------------------------------------------------------------

  async create(user: AuthUser, input: CreateLeaseInput, ctx: AuditContext) {
    const [property, unit, tenants] = await Promise.all([
      this.prisma.property.findFirst({
        where: { id: input.propertyId, deletedAt: null },
        select: { id: true, clientId: true },
      }),
      this.prisma.unit.findFirst({
        where: { id: input.unitId, deletedAt: null },
        select: { id: true, propertyId: true, status: true },
      }),
      this.prisma.tenant.findMany({
        where: { id: { in: input.tenantIds }, deletedAt: null },
        select: { id: true },
      }),
    ]);

    if (!property || !propertyInScope(user, property)) throw AppError.notFound("property");
    if (!unit || unit.propertyId !== property.id) {
      throw AppError.validation("That unit does not belong to the property.");
    }
    if (tenants.length !== new Set(input.tenantIds).size) {
      throw AppError.validation("One or more tenants could not be found.");
    }

    const overlapping = await this.prisma.lease.findFirst({
      where: {
        unitId: input.unitId,
        status: { in: ["ACTIVE", "EXPIRING"] },
        startDate: { lt: new Date(input.endDate) },
        endDate: { gt: new Date(input.startDate) },
      },
      select: { id: true, ref: true },
    });
    if (overlapping) {
      throw AppError.conflict(
        `This unit already has an active lease (${overlapping.ref}) overlapping those dates.`,
      );
    }

    const lease = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("lease", tx);
      const created = await tx.lease.create({
        data: {
          ref,
          propertyId: property.id,
          unitId: input.unitId,
          clientId: property.clientId,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          rentMinor: BigInt(input.rent.minor),
          rentCurrency: input.rent.currency,
          frequency: input.frequency,
          customFrequencyDays: input.customFrequencyDays ?? null,
          depositMinor: input.deposit ? BigInt(input.deposit.minor) : null,
          depositCurrency: input.deposit?.currency ?? null,
          noticePeriodDays: input.noticePeriodDays,
          documentId: input.documentId ?? null,
          status: "DRAFT",
          parties: {
            create: input.tenantIds.map((tenantId) => ({
              tenantId,
              isPrimary: tenantId === input.primaryTenantId,
            })),
          },
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "lease.create",
          resourceType: "lease",
          resourceId: created.id,
          after: { ref: created.ref, propertyId: property.id, unitId: input.unitId },
        },
        tx,
      );
      return created;
    });

    return this.getById(user, lease.id);
  }

  /** DRAFT → ACTIVE: occupy the unit, generate rent charges, schedule reminders. */
  async activate(user: AuthUser, id: string, ctx: AuditContext) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: { property: { select: { id: true, clientId: true } } },
    });
    if (!lease || !propertyInScope(user, lease.property)) throw AppError.notFound("lease");
    if (lease.status !== "DRAFT") {
      throw AppError.illegalTransition(`A ${lease.status} lease cannot be activated.`);
    }

    const offsets = await this.reminderOffsets();
    const periods = rentPeriods(
      lease.startDate,
      lease.endDate,
      lease.frequency,
      lease.customFrequencyDays,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.lease.update({ where: { id }, data: { status: "ACTIVE" } });
      await tx.unit.update({ where: { id: lease.unitId }, data: { status: "OCCUPIED" } });
      await tx.property.update({
        where: { id: lease.propertyId },
        data: { status: "OCCUPIED" },
      });

      for (const p of periods) {
        await tx.rentCharge.upsert({
          where: { leaseId_periodStart: { leaseId: id, periodStart: p.periodStart } },
          create: {
            leaseId: id,
            propertyId: lease.propertyId,
            unitId: lease.unitId,
            clientId: lease.clientId,
            periodStart: p.periodStart,
            periodEnd: p.periodEnd,
            dueDate: p.dueDate,
            amountMinor: lease.rentMinor,
            currency: lease.rentCurrency,
            status: "EXPECTED",
          },
          update: {},
        });
      }

      for (const days of offsets) {
        const remindAt = new Date(lease.endDate.getTime() - days * 86_400_000);
        if (remindAt > new Date()) {
          await tx.leaseReminder.create({
            data: {
              leaseId: id,
              type: "EXPIRY",
              remindAt,
              note: `Lease expires in ${days} days`,
            },
          });
        }
      }

      await this.audit.record(
        {
          ...ctx,
          action: "lease.activate",
          resourceType: "lease",
          resourceId: id,
          after: { status: "ACTIVE", rentChargesGenerated: periods.length },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }

  async renew(
    user: AuthUser,
    id: string,
    input: RenewLeaseInput,
    ctx: AuditContext,
  ) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: { property: { select: { id: true, clientId: true } } },
    });
    if (!lease || !propertyInScope(user, lease.property)) throw AppError.notFound("lease");
    if (!["ACTIVE", "EXPIRING", "EXPIRED"].includes(lease.status)) {
      throw AppError.illegalTransition(`A ${lease.status} lease cannot be renewed.`);
    }
    const newEnd = new Date(input.newEndDate);
    if (newEnd <= lease.endDate) {
      throw AppError.validation("The new end date must be after the current one.");
    }
    const newRent = input.newRent ? BigInt(input.newRent.minor) : lease.rentMinor;

    const extraPeriods = rentPeriods(
      lease.endDate,
      newEnd,
      lease.frequency,
      lease.customFrequencyDays,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.lease.update({
        where: { id },
        data: {
          endDate: newEnd,
          rentMinor: newRent,
          status: "ACTIVE",
          renewalStatus: "ACCEPTED",
        },
      });
      for (const p of extraPeriods) {
        await tx.rentCharge.upsert({
          where: { leaseId_periodStart: { leaseId: id, periodStart: p.periodStart } },
          create: {
            leaseId: id,
            propertyId: lease.propertyId,
            unitId: lease.unitId,
            clientId: lease.clientId,
            periodStart: p.periodStart,
            periodEnd: p.periodEnd,
            dueDate: p.dueDate,
            amountMinor: newRent,
            currency: lease.rentCurrency,
            status: "EXPECTED",
          },
          update: {},
        });
      }
      await tx.leaseReminder.deleteMany({
        where: { leaseId: id, type: "EXPIRY", sentAt: null },
      });
      for (const days of await this.reminderOffsets()) {
        const remindAt = new Date(newEnd.getTime() - days * 86_400_000);
        if (remindAt > new Date()) {
          await tx.leaseReminder.create({
            data: { leaseId: id, type: "EXPIRY", remindAt, note: `Lease expires in ${days} days` },
          });
        }
      }
      await this.audit.record(
        {
          ...ctx,
          action: "lease.renew",
          resourceType: "lease",
          resourceId: id,
          before: { endDate: lease.endDate.toISOString(), rentMinor: lease.rentMinor.toString() },
          after: { endDate: newEnd.toISOString(), rentMinor: newRent.toString() },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }

  async terminate(
    user: AuthUser,
    id: string,
    input: TerminateLeaseInput,
    ctx: AuditContext,
  ) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: { property: { select: { id: true, clientId: true } } },
    });
    if (!lease || !propertyInScope(user, lease.property)) throw AppError.notFound("lease");
    if (!["ACTIVE", "EXPIRING", "DRAFT"].includes(lease.status)) {
      throw AppError.illegalTransition(`A ${lease.status} lease cannot be terminated.`);
    }
    const effective = new Date(input.effectiveDate);

    await this.prisma.$transaction(async (tx) => {
      await tx.lease.update({
        where: { id },
        data: {
          status: "TERMINATED",
          terminatedAt: effective,
          terminationReason: input.reason,
          endDate: effective < lease.endDate ? effective : lease.endDate,
        },
      });
      await tx.unit.update({ where: { id: lease.unitId }, data: { status: "VACANT" } });
      // Void future unpaid charges; keep any with payments for the record.
      await tx.rentCharge.updateMany({
        where: { leaseId: id, dueDate: { gt: effective }, paidMinor: 0n },
        data: { status: "WAIVED", waivedReason: "Lease terminated" },
      });
      await tx.leaseReminder.deleteMany({ where: { leaseId: id, sentAt: null } });
      await this.audit.record(
        {
          ...ctx,
          action: "lease.terminate",
          resourceType: "lease",
          resourceId: id,
          before: { status: lease.status },
          after: { status: "TERMINATED", effective: effective.toISOString(), reason: input.reason },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }

  private async reminderOffsets(): Promise<number[]> {
    const setting = await this.prisma.organizationSetting.findUnique({
      where: { key: "lease.reminderOffsetsDays" },
    });
    const value = setting?.value as unknown;
    if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
      return value as number[];
    }
    return DEFAULT_REMINDER_OFFSETS;
  }
}

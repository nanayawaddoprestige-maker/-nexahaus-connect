import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import type {
  CreatePropertyInput,
  ListPropertyQuery,
  UpdatePropertyInput,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { paginate, pageParams, parseSort } from "../../common/pagination";
import { propertyScopeWhere, propertyInScope } from "../authz/scope.util";
import { AuthUserService } from "../authz/auth-user.service";
import { periodRange, type FinancePeriod } from "../finance/period.util";

const SORTABLE = [
  "createdAt",
  "name",
  "ref",
  "status",
  "city",
  "region",
] as const;

interface AgreementInput {
  feeType:
    | "PERCENT_OF_COLLECTED"
    | "PERCENT_OF_EXPECTED"
    | "FIXED_MONTHLY"
    | "CUSTOM";
  feePercent?: number;
  feeFixedMinor?: string;
  feeCurrency: string;
  startDate: string;
  endDate?: string;
  inspectionFrequency:
    | "MONTHLY"
    | "QUARTERLY"
    | "BIANNUAL"
    | "ANNUAL"
    | "CUSTOM";
  maintenanceApprovalThresholdMinor: string;
  thresholdCurrency: string;
  documentId?: string;
}

interface AssignManagerInput {
  userId: string;
  role:
    | "PROPERTY_MANAGER"
    | "MAINTENANCE_OFFICER"
    | "INSPECTOR"
    | "LEASING_OFFICER"
    | "SUPPORT_STAFF";
  startDate: string;
  endDate?: string;
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly authUsers: AuthUserService,
  ) {}

  // --------------------------------------------------------------------------
  // Read
  // --------------------------------------------------------------------------

  async list(user: AuthUser, query: ListPropertyQuery) {
    const { skip, take, page, pageSize } = pageParams(query);

    const where: Prisma.PropertyWhereInput = {
      AND: [
        propertyScopeWhere(user),
        query.status ? { status: query.status } : {},
        query.type ? { type: query.type } : {},
        query.region
          ? { region: { equals: query.region, mode: "insensitive" } }
          : {},
        query.city ? { city: { equals: query.city, mode: "insensitive" } } : {},
        query.clientId ? { clientId: query.clientId } : {},
        query.managerId
          ? { assignments: { some: { userId: query.managerId } } }
          : {},
        query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { ref: { contains: query.q, mode: "insensitive" } },
                { addressLine: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(query.sort, SORTABLE, { createdAt: "desc" }),
        select: {
          id: true,
          ref: true,
          name: true,
          type: true,
          status: true,
          city: true,
          region: true,
          coverImageDocumentId: true,
          unitCount: true,
          onboardingComplete: true,
          _count: { select: { units: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const ids = rows.map((r) => r.id);
    const [occupancy, finance] = await Promise.all([
      this.occupancyByProperty(ids),
      this.financeByProperty(ids, periodRange("this_month")),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      ref: r.ref,
      name: r.name,
      type: r.type,
      status: r.status,
      city: r.city,
      region: r.region,
      coverImageDocumentId: r.coverImageDocumentId,
      unitCount: r._count.units,
      onboardingComplete: r.onboardingComplete,
      occupancy: occupancy.get(r.id) ?? { total: 0, occupied: 0, rate: 0 },
      finance: finance.get(r.id) ?? emptyFinance(),
    }));

    return paginate(items, totalItems, page, pageSize, {
      sort: query.sort,
      filters: {
        status: query.status,
        type: query.type,
        region: query.region,
        city: query.city,
      },
    });
  }

  async getById(user: AuthUser, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: {
        managingClient: { select: { id: true, ref: true, displayName: true } },
        area: true,
        owners: {
          select: {
            clientId: true,
            sharePercent: true,
            isPrimary: true,
            client: { select: { displayName: true } },
          },
        },
        agreements: {
          where: { status: "ACTIVE" },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        assignments: {
          where: { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
          select: {
            role: true,
            startDate: true,
            user: { select: { id: true, fullName: true } },
          },
        },
        _count: {
          select: { units: true, maintenanceRequests: true, inspections: true },
        },
      },
    });

    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }

    const [
      occupancy,
      financeThisMonth,
      latestInspection,
      latestHealth,
      lastRent,
    ] = await Promise.all([
      this.occupancyByProperty([id]),
      this.financeByProperty([id], periodRange("this_month")),
      this.prisma.inspection.findFirst({
        where: {
          propertyId: id,
          status: { in: ["COMPLETED", "REVIEWED", "REPORT_ISSUED"] },
        },
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          ref: true,
          type: true,
          completedAt: true,
          overallCondition: true,
        },
      }),
      this.prisma.propertyHealthScore.findFirst({
        where: { propertyId: id },
        orderBy: { scoredAt: "desc" },
        select: { score: true, scoredAt: true, methodologyVersion: true },
      }),
      this.prisma.payment.findFirst({
        where: { propertyId: id, status: "CONFIRMED" },
        orderBy: { receivedAt: "desc" },
        select: { receivedAt: true, amountMinor: true, currency: true },
      }),
    ]);

    return {
      ...serializeProperty(property),
      client: property.managingClient,
      owners: property.owners.map((o) => ({
        clientId: o.clientId,
        name: o.client.displayName,
        sharePercent: Number(o.sharePercent),
        isPrimary: o.isPrimary,
      })),
      agreement: property.agreements[0]
        ? serializeAgreement(property.agreements[0])
        : null,
      team: property.assignments.map((a) => ({
        role: a.role,
        since: a.startDate.toISOString(),
        user: a.user,
      })),
      counts: {
        units: property._count.units,
        openMaintenance: property._count.maintenanceRequests,
        inspections: property._count.inspections,
      },
      occupancy: occupancy.get(id) ?? { total: 0, occupied: 0, rate: 0 },
      finance: financeThisMonth.get(id) ?? emptyFinance(),
      diaspora: {
        lastInspectedAt: latestInspection?.completedAt?.toISOString() ?? null,
        lastRentReceivedAt: lastRent?.receivedAt?.toISOString() ?? null,
      },
      latestInspection: latestInspection
        ? {
            id: latestInspection.id,
            ref: latestInspection.ref,
            type: latestInspection.type,
            completedAt: latestInspection.completedAt?.toISOString() ?? null,
            overallCondition: latestInspection.overallCondition,
          }
        : null,
      healthScore: latestHealth
        ? {
            score: latestHealth.score,
            scoredAt: latestHealth.scoredAt.toISOString(),
            methodologyVersion: latestHealth.methodologyVersion,
          }
        : null,
    };
  }

  async getFinancials(user: AuthUser, id: string, period: FinancePeriod) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    const range = periodRange(period);
    const [byProp, expenses, feeAgreement] = await Promise.all([
      this.financeByProperty([id], range),
      this.prisma.expense.aggregate({
        where: {
          propertyId: id,
          status: { in: ["APPROVED", "PAID"] },
          incurredAt: { gte: range.start, lt: range.end },
        },
        _sum: { amountMinor: true, taxMinor: true },
      }),
      this.prisma.managementAgreement.findFirst({
        where: { propertyId: id, status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      }),
    ]);

    const finance = byProp.get(id) ?? emptyFinance();
    const maintenanceExpenseMinor =
      (expenses._sum.amountMinor ?? 0n) + (expenses._sum.taxMinor ?? 0n);

    return {
      period,
      range: { start: range.start.toISOString(), end: range.end.toISOString() },
      currency: "GHS",
      expectedRentMinor: finance.expectedRentMinor,
      collectedRentMinor: finance.collectedRentMinor,
      outstandingRentMinor: finance.outstandingRentMinor,
      maintenanceExpenseMinor: maintenanceExpenseMinor.toString(),
      managementFee: feeAgreement ? serializeAgreement(feeAgreement) : null,
    };
  }

  // --------------------------------------------------------------------------
  // Write
  // --------------------------------------------------------------------------

  async create(user: AuthUser, input: CreatePropertyInput, ctx: AuditContext) {
    if (!user.scopeExempt && !user.clientIds.includes(input.clientId)) {
      // Staff creating for an unassigned client, or owner creating for another
      // owner's client — both denied without revealing the client exists.
      const staffCanManage = user.permissions.includes("property:write");
      if (!staffCanManage || user.roles.includes("OWNER")) {
        throw AppError.forbidden();
      }
    }

    const client = await this.prisma.client.findFirst({
      where: { id: input.clientId, deletedAt: null },
      select: { id: true },
    });
    if (!client) throw AppError.forbidden();

    const property = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("property", tx);
      const created = await tx.property.create({
        data: {
          ref,
          clientId: input.clientId,
          name: input.name,
          type: input.type,
          status: "VACANT",
          addressLine: input.addressLine,
          areaId: input.areaId ?? null,
          city: input.city,
          region: input.region,
          country: input.country ?? "GH",
          gpsLat: input.gpsLat ?? null,
          gpsLng: input.gpsLng ?? null,
          ownershipStatus: input.ownershipStatus ?? null,
          acquisitionDate: input.acquisitionDate
            ? new Date(input.acquisitionDate)
            : null,
          estimatedValueMinor: input.estimatedValue
            ? BigInt(input.estimatedValue.minor)
            : null,
          estimatedValueCurrency: input.estimatedValue?.currency ?? null,
          bedrooms: input.bedrooms ?? null,
          bathrooms: input.bathrooms ?? null,
          floorAreaSqm: input.floorAreaSqm ?? null,
          landSizeSqm: input.landSizeSqm ?? null,
          description: input.description ?? null,
        },
      });
      await tx.propertyOwner.create({
        data: {
          propertyId: created.id,
          clientId: input.clientId,
          sharePercent: 100,
          isPrimary: true,
        },
      });
      await tx.propertyOnboardingChecklist.create({
        data: {
          propertyId: created.id,
          items: defaultOnboardingItems(),
          completionPercent: 0,
          status: "IN_PROGRESS",
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "property.create",
          resourceType: "property",
          resourceId: created.id,
          after: {
            ref: created.ref,
            name: created.name,
            clientId: input.clientId,
          },
        },
        tx,
      );
      return created;
    });

    return serializeProperty(property);
  }

  async update(
    user: AuthUser,
    id: string,
    input: UpdatePropertyInput,
    ctx: AuditContext,
  ) {
    const existing = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        clientId: true,
        name: true,
        status: true,
        type: true,
        description: true,
      },
    });
    if (!existing || !propertyInScope(user, existing)) {
      throw AppError.notFound("property");
    }
    if (user.roles.includes("OWNER") && !user.scopeExempt) {
      throw AppError.forbidden(
        "Property details are maintained by your NexaHaus manager.",
      );
    }

    const data: Prisma.PropertyUpdateInput = {
      name: input.name ?? undefined,
      type: input.type ?? undefined,
      status: input.status ?? undefined,
      addressLine: input.addressLine ?? undefined,
      city: input.city ?? undefined,
      region: input.region ?? undefined,
      description: input.description ?? undefined,
      bedrooms: input.bedrooms ?? undefined,
      bathrooms: input.bathrooms ?? undefined,
    };

    const updated = await this.prisma.property.update({ where: { id }, data });
    await this.audit.record({
      ...ctx,
      action: "property.update",
      resourceType: "property",
      resourceId: id,
      before: existing,
      after: { name: updated.name, status: updated.status, type: updated.type },
    });
    return serializeProperty(updated);
  }

  // --------------------------------------------------------------------------
  // Management agreement (configurable fee — spec §98)
  // --------------------------------------------------------------------------

  async setAgreement(
    user: AuthUser,
    propertyId: string,
    input: AgreementInput,
    ctx: AuditContext,
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }

    const agreement = await this.prisma.$transaction(async (tx) => {
      // Supersede the current active agreement rather than editing it.
      await tx.managementAgreement.updateMany({
        where: { propertyId, status: "ACTIVE" },
        data: { status: "EXPIRED", endDate: new Date(input.startDate) },
      });
      const created = await tx.managementAgreement.create({
        data: {
          propertyId,
          feeType: input.feeType,
          feePercent: input.feePercent ?? null,
          feeFixedMinor: input.feeFixedMinor
            ? BigInt(input.feeFixedMinor)
            : null,
          feeCurrency: input.feeCurrency,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          inspectionFrequency: input.inspectionFrequency,
          maintenanceApprovalThresholdMinor: BigInt(
            input.maintenanceApprovalThresholdMinor,
          ),
          thresholdCurrency: input.thresholdCurrency,
          documentId: input.documentId ?? null,
          status: "ACTIVE",
          createdById: ctx.actorUserId ?? null,
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "property.agreement.set",
          resourceType: "property",
          resourceId: propertyId,
          after: {
            agreementId: created.id,
            feeType: created.feeType,
            feePercent: created.feePercent ? Number(created.feePercent) : null,
          },
        },
        tx,
      );
      return created;
    });
    return serializeAgreement(agreement);
  }

  // --------------------------------------------------------------------------
  // Staff assignment (drives the staff authorization scope)
  // --------------------------------------------------------------------------

  async assignManager(
    user: AuthUser,
    propertyId: string,
    input: AssignManagerInput,
    ctx: AuditContext,
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    const staff = await this.prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null, status: "ACTIVE" },
      select: { id: true, fullName: true },
    });
    if (!staff)
      throw AppError.validation("That staff member could not be found.");

    const assignment = await this.prisma.propertyAssignment.upsert({
      where: {
        propertyId_userId_role: {
          propertyId,
          userId: input.userId,
          role: input.role,
        },
      },
      create: {
        propertyId,
        userId: input.userId,
        role: input.role,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
      update: {
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
    });

    // The user's cached scope now includes this property.
    await this.authUsers.invalidate(input.userId);

    await this.audit.record({
      ...ctx,
      action: "property.assignment.set",
      resourceType: "property",
      resourceId: propertyId,
      after: { userId: input.userId, role: input.role },
    });
    return {
      id: assignment.id,
      role: assignment.role,
      user: staff,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString() ?? null,
    };
  }

  async endAssignment(
    user: AuthUser,
    propertyId: string,
    assignmentId: string,
    ctx: AuditContext,
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    const assignment = await this.prisma.propertyAssignment.findFirst({
      where: { id: assignmentId, propertyId },
    });
    if (!assignment) throw AppError.notFound("assignment");

    await this.prisma.propertyAssignment.update({
      where: { id: assignmentId },
      data: { endDate: new Date() },
    });
    await this.authUsers.invalidate(assignment.userId);
    await this.audit.record({
      ...ctx,
      action: "property.assignment.end",
      resourceType: "property",
      resourceId: propertyId,
      before: { userId: assignment.userId, role: assignment.role },
    });
    return { ended: true };
  }

  // --------------------------------------------------------------------------
  // Co-ownership
  // --------------------------------------------------------------------------

  async setOwners(
    user: AuthUser,
    propertyId: string,
    owners: { clientId: string; sharePercent: number; isPrimary?: boolean }[],
    ctx: AuditContext,
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    const totalShare = owners.reduce((s, o) => s + o.sharePercent, 0);
    if (Math.abs(totalShare - 100) > 0.01) {
      throw AppError.validation("Ownership shares must total 100%.");
    }
    const clientIds = owners.map((o) => o.clientId);
    const found = await this.prisma.client.count({
      where: { id: { in: clientIds }, deletedAt: null },
    });
    if (found !== new Set(clientIds).size) {
      throw AppError.validation(
        "One or more owner clients could not be found.",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.propertyOwner.deleteMany({ where: { propertyId } });
      await tx.propertyOwner.createMany({
        data: owners.map((o, i) => ({
          propertyId,
          clientId: o.clientId,
          sharePercent: o.sharePercent,
          isPrimary: o.isPrimary ?? i === 0,
        })),
      });
      await this.audit.record(
        {
          ...ctx,
          action: "property.owners.set",
          resourceType: "property",
          resourceId: propertyId,
          after: {
            owners: owners.map((o) => ({
              clientId: o.clientId,
              share: o.sharePercent,
            })),
          },
        },
        tx,
      );
    });
    return { owners };
  }

  // --------------------------------------------------------------------------
  // Aggregation helpers
  // --------------------------------------------------------------------------

  private async occupancyByProperty(
    propertyIds: string[],
  ): Promise<Map<string, { total: number; occupied: number; rate: number }>> {
    const result = new Map<
      string,
      { total: number; occupied: number; rate: number }
    >();
    if (propertyIds.length === 0) return result;
    const grouped = await this.prisma.unit.groupBy({
      by: ["propertyId", "status"],
      where: { propertyId: { in: propertyIds }, deletedAt: null },
      _count: { _all: true },
    });
    for (const id of propertyIds)
      result.set(id, { total: 0, occupied: 0, rate: 0 });
    for (const row of grouped) {
      const entry = result.get(row.propertyId)!;
      entry.total += row._count._all;
      if (row.status === "OCCUPIED") entry.occupied += row._count._all;
    }
    for (const entry of result.values()) {
      entry.rate =
        entry.total === 0
          ? 0
          : Math.round((entry.occupied / entry.total) * 100);
    }
    return result;
  }

  private async financeByProperty(
    propertyIds: string[],
    range: { start: Date; end: Date },
  ): Promise<Map<string, ReturnType<typeof emptyFinance>>> {
    const result = new Map<string, ReturnType<typeof emptyFinance>>();
    if (propertyIds.length === 0) return result;
    const grouped = await this.prisma.rentCharge.groupBy({
      by: ["propertyId"],
      where: {
        propertyId: { in: propertyIds },
        dueDate: { gte: range.start, lt: range.end },
        status: { not: "WAIVED" },
      },
      _sum: { amountMinor: true, paidMinor: true },
    });
    for (const id of propertyIds) result.set(id, emptyFinance());
    for (const row of grouped) {
      const expected = row._sum.amountMinor ?? 0n;
      const collected = row._sum.paidMinor ?? 0n;
      result.set(row.propertyId, {
        currency: "GHS",
        expectedRentMinor: expected.toString(),
        collectedRentMinor: collected.toString(),
        outstandingRentMinor: (expected - collected).toString(),
        collectionRate:
          expected === 0n
            ? 0
            : Math.round((Number(collected) / Number(expected)) * 100),
      });
    }
    return result;
  }
}

// ---------------------------------------------------------------------------

function emptyFinance() {
  return {
    currency: "GHS",
    expectedRentMinor: "0",
    collectedRentMinor: "0",
    outstandingRentMinor: "0",
    collectionRate: 0,
  };
}

function serializeProperty(p: {
  id: string;
  ref: string;
  name: string;
  type: string;
  status: string;
  addressLine: string;
  city: string;
  region: string;
  country: string;
  bedrooms: number | null;
  bathrooms: number | null;
  unitCount: number;
  estimatedValueMinor: bigint | null;
  estimatedValueCurrency: string | null;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    ref: p.ref,
    name: p.name,
    type: p.type,
    status: p.status,
    address: {
      line: p.addressLine,
      city: p.city,
      region: p.region,
      country: p.country,
    },
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    unitCount: p.unitCount,
    estimatedValue: p.estimatedValueMinor
      ? {
          minor: p.estimatedValueMinor.toString(),
          currency: p.estimatedValueCurrency ?? "GHS",
        }
      : null,
    onboardingComplete: p.onboardingComplete,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function serializeAgreement(a: {
  feeType: string;
  feePercent: Prisma.Decimal | null;
  feeFixedMinor: bigint | null;
  feeCurrency: string;
  inspectionFrequency: string;
  maintenanceApprovalThresholdMinor: bigint;
  thresholdCurrency: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
}) {
  return {
    feeType: a.feeType,
    feePercent: a.feePercent ? Number(a.feePercent) : null,
    feeFixed: a.feeFixedMinor
      ? { minor: a.feeFixedMinor.toString(), currency: a.feeCurrency }
      : null,
    inspectionFrequency: a.inspectionFrequency,
    maintenanceApprovalThreshold: {
      minor: a.maintenanceApprovalThresholdMinor.toString(),
      currency: a.thresholdCurrency,
    },
    startDate: a.startDate.toISOString(),
    endDate: a.endDate?.toISOString() ?? null,
    status: a.status,
  };
}

function defaultOnboardingItems(): Prisma.InputJsonValue {
  const labels = [
    "Owner verified",
    "Ownership documentation received",
    "Management agreement received",
    "Property information complete",
    "Property photos uploaded",
    "Tenant information recorded",
    "Lease information recorded",
    "Inspection completed",
    "Financial setup completed",
    "Maintenance baseline completed",
    "Insurance information recorded",
    "Property manager assigned",
    "Property activated",
  ];
  return Object.fromEntries(
    labels.map((label) => [label, { done: false, by: null, at: null }]),
  );
}

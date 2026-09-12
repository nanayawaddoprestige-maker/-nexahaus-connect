import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { paginate, pageParams, parseSort } from "../../common/pagination";
import { periodRange } from "../finance/period.util";

/**
 * NexaHaus internal admin dashboard (spec §42–43). Scope-exempt staff
 * (SUPER_ADMIN, MANAGING_DIRECTOR) see the whole portfolio; other staff are
 * limited to their property assignments.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private propertyWhere(user: AuthUser): Prisma.PropertyWhereInput {
    if (user.scopeExempt) return { deletedAt: null };
    return { deletedAt: null, id: { in: user.assignedPropertyIds } };
  }

  async overview(user: AuthUser) {
    const propertyWhere = this.propertyWhere(user);
    const properties = await this.prisma.property.findMany({
      where: propertyWhere,
      select: { id: true, status: true },
    });
    const propertyIds = properties.map((p) => p.id);
    const range = periodRange("this_month");
    const soon = new Date(Date.now() + 30 * 86_400_000);

    const scopedClientFilter = user.scopeExempt
      ? {}
      : { properties: { some: { id: { in: propertyIds } } } };

    const [
      unitGroups,
      rent,
      openMaintenance,
      urgent,
      pendingApprovals,
      inspectionsDue,
      documentsExpiring,
      activeClients,
      newLeads,
      overdueCharges,
    ] = await Promise.all([
      propertyIds.length
        ? this.prisma.unit.groupBy({
            by: ["status"],
            where: { propertyId: { in: propertyIds }, deletedAt: null },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      propertyIds.length
        ? this.prisma.rentCharge.aggregate({
            where: {
              propertyId: { in: propertyIds },
              dueDate: { gte: range.start, lt: range.end },
              status: { not: "WAIVED" },
            },
            _sum: { amountMinor: true, paidMinor: true },
          })
        : Promise.resolve({ _sum: { amountMinor: 0n, paidMinor: 0n } }),
      this.prisma.maintenanceRequest.count({
        where: {
          ...(propertyIds.length ? { propertyId: { in: propertyIds } } : {}),
          status: { notIn: ["CLOSED", "CANCELLED", "VERIFIED"] },
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          ...(propertyIds.length ? { propertyId: { in: propertyIds } } : {}),
          priority: "URGENT",
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
      }),
      this.prisma.approval.count({
        where: {
          status: "PENDING",
          ...(user.scopeExempt || !propertyIds.length
            ? {}
            : { propertyId: { in: propertyIds } }),
        },
      }),
      this.prisma.inspection.count({
        where: {
          ...(propertyIds.length ? { propertyId: { in: propertyIds } } : {}),
          status: { in: ["ASSIGNED", "SCHEDULED"] },
          scheduledFor: { lte: range.end },
        },
      }),
      this.prisma.document.count({
        where: {
          status: "ACTIVE",
          expiresAt: { not: null, lte: soon, gte: new Date() },
        },
      }),
      this.prisma.client.count({
        where: { status: "ACTIVE", deletedAt: null, ...scopedClientFilter },
      }),
      this.prisma.lead.count({
        where: {
          status: { in: ["NEW", "CONTACTED"] },
          createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
        },
      }),
      propertyIds.length
        ? this.prisma.rentCharge.count({
            where: { propertyId: { in: propertyIds }, status: "OVERDUE" },
          })
        : Promise.resolve(0),
    ]);

    const totalUnits = unitGroups.reduce((s, g) => s + g._count._all, 0);
    const occupiedUnits =
      unitGroups.find((g) => g.status === "OCCUPIED")?._count._all ?? 0;
    const expected = rent._sum.amountMinor ?? 0n;
    const collected = rent._sum.paidMinor ?? 0n;

    const alerts: {
      level: "URGENT" | "ACTION" | "WARNING";
      message: string;
    }[] = [];
    if (urgent > 0)
      alerts.push({
        level: "URGENT",
        message: `${urgent} urgent maintenance request${urgent === 1 ? "" : "s"}`,
      });
    if (pendingApprovals > 0)
      alerts.push({
        level: "ACTION",
        message: `${pendingApprovals} owner approval${pendingApprovals === 1 ? "" : "s"} awaiting a decision`,
      });
    if (documentsExpiring > 0)
      alerts.push({
        level: "WARNING",
        message: `${documentsExpiring} document${documentsExpiring === 1 ? "" : "s"} expiring within 30 days`,
      });
    if (overdueCharges > 0)
      alerts.push({
        level: "WARNING",
        message: `${overdueCharges} rent charge${overdueCharges === 1 ? "" : "s"} overdue`,
      });

    return {
      currency: "GHS",
      portfolio: {
        propertiesManaged: properties.length,
        occupiedProperties: properties.filter((p) => p.status === "OCCUPIED")
          .length,
        vacantProperties: properties.filter((p) => p.status === "VACANT")
          .length,
        occupancyRate:
          totalUnits === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 100),
      },
      rent: {
        monthlyExpectedMinor: expected.toString(),
        monthlyCollectedMinor: collected.toString(),
        outstandingMinor: (expected - collected).toString(),
        collectionRate:
          expected === 0n
            ? 0
            : Math.round((Number(collected) / Number(expected)) * 100),
      },
      operations: {
        openMaintenance,
        urgentIssues: urgent,
        pendingApprovals,
        inspectionsDue,
        documentsExpiring,
        overdueCharges,
      },
      growth: { activeClients, newLeads },
      alerts,
    };
  }

  async listClients(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      sort?: string;
      status?: string;
      q?: string;
    },
  ) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.ClientWhereInput = {
      deletedAt: null,
      ...(query.status
        ? { status: query.status as Prisma.EnumClientStatusFilter["equals"] }
        : {}),
      ...(user.scopeExempt
        ? {}
        : { properties: { some: { id: { in: user.assignedPropertyIds } } } }),
      ...(query.q
        ? {
            OR: [
              { displayName: { contains: query.q, mode: "insensitive" } },
              { ref: { contains: query.q, mode: "insensitive" } },
              { primaryEmail: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(
          query.sort,
          ["createdAt", "displayName", "ref", "status"],
          {
            createdAt: "desc",
          },
        ),
        select: {
          id: true,
          ref: true,
          displayName: true,
          segment: true,
          status: true,
          servicePackage: true,
          primaryEmail: true,
          countryOfResidence: true,
          _count: { select: { managedProperties: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return paginate(
      rows.map((r) => ({
        id: r.id,
        ref: r.ref,
        name: r.displayName,
        segment: r.segment,
        status: r.status,
        servicePackage: r.servicePackage,
        email: r.primaryEmail,
        countryOfResidence: r.countryOfResidence,
        propertyCount: r._count.managedProperties,
      })),
      totalItems,
      page,
      pageSize,
    );
  }
}

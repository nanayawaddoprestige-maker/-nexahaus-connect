import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { propertyScopeWhere } from "../authz/scope.util";
import { periodRange, monthsIn, type FinancePeriod } from "../finance/period.util";

/**
 * Owner dashboard aggregates (spec §8). Every figure is computed within the
 * caller's property scope; a query can never widen it.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async ownerSummary(user: AuthUser, period: FinancePeriod = "this_month") {
    const properties = await this.prisma.property.findMany({
      where: propertyScopeWhere(user),
      select: { id: true, status: true },
    });
    const propertyIds = properties.map((p) => p.id);
    const range = periodRange(period);

    if (propertyIds.length === 0) {
      return this.emptySummary(period, range);
    }

    const [
      unitGroups,
      rentThisPeriod,
      openMaintenance,
      urgentMaintenance,
      pendingApprovals,
      inspectionsDue,
      latestHealth,
      monthlySeries,
    ] = await Promise.all([
      this.prisma.unit.groupBy({
        by: ["status"],
        where: { propertyId: { in: propertyIds }, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.rentCharge.aggregate({
        where: {
          propertyId: { in: propertyIds },
          dueDate: { gte: range.start, lt: range.end },
          status: { not: "WAIVED" },
        },
        _sum: { amountMinor: true, paidMinor: true },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          propertyId: { in: propertyIds },
          status: { notIn: ["CLOSED", "CANCELLED", "VERIFIED"] },
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          propertyId: { in: propertyIds },
          priority: "URGENT",
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
      }),
      this.prisma.approval.count({
        where: { clientId: { in: user.clientIds }, status: "PENDING" },
      }),
      this.prisma.inspection.count({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ["ASSIGNED", "SCHEDULED"] },
          scheduledFor: { lte: range.end },
        },
      }),
      this.latestHealthByProperty(propertyIds),
      this.monthlySeries(propertyIds, period),
    ]);

    const totalUnits = unitGroups.reduce((s, g) => s + g._count._all, 0);
    const occupiedUnits =
      unitGroups.find((g) => g.status === "OCCUPIED")?._count._all ?? 0;
    const occupiedProperties = properties.filter(
      (p) => p.status === "OCCUPIED",
    ).length;
    const vacantProperties = properties.filter(
      (p) => p.status === "VACANT",
    ).length;

    const expected = rentThisPeriod._sum.amountMinor ?? 0n;
    const collected = rentThisPeriod._sum.paidMinor ?? 0n;
    const outstanding = expected - collected;

    const healthScores = [...latestHealth.values()];
    const portfolioHealth =
      healthScores.length > 0
        ? Math.round(
            healthScores.reduce((s, v) => s + v, 0) / healthScores.length,
          )
        : null;

    return {
      period,
      range: { start: range.start.toISOString(), end: range.end.toISOString() },
      currency: "GHS",
      portfolio: {
        totalProperties: properties.length,
        occupiedProperties,
        vacantProperties,
        occupancyRate:
          totalUnits === 0
            ? 0
            : Math.round((occupiedUnits / totalUnits) * 100),
        totalUnits,
        occupiedUnits,
      },
      rent: {
        expectedMinor: expected.toString(),
        collectedMinor: collected.toString(),
        outstandingMinor: outstanding.toString(),
        collectionRate:
          expected === 0n
            ? 0
            : Math.round((Number(collected) / Number(expected)) * 100),
      },
      attention: {
        openMaintenance,
        urgentMaintenance,
        pendingApprovals,
        inspectionsDue,
      },
      portfolioHealthScore: portfolioHealth,
      charts: { monthly: monthlySeries },
    };
  }

  private async latestHealthByProperty(
    propertyIds: string[],
  ): Promise<Map<string, number>> {
    const rows = await this.prisma.propertyHealthScore.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: [{ propertyId: "asc" }, { scoredAt: "desc" }],
      distinct: ["propertyId"],
      select: { propertyId: true, score: true },
    });
    return new Map(rows.map((r) => [r.propertyId, r.score]));
  }

  private async monthlySeries(propertyIds: string[], period: FinancePeriod) {
    const range = periodRange(period === "this_month" ? "6m" : period);
    const months = monthsIn(range);
    const charges = await this.prisma.rentCharge.groupBy({
      by: ["dueDate"],
      where: {
        propertyId: { in: propertyIds },
        dueDate: { gte: range.start, lt: range.end },
        status: { not: "WAIVED" },
      },
      _sum: { amountMinor: true, paidMinor: true },
    });
    return months.map((month) => {
      const inMonth = charges.filter(
        (c) => c.dueDate >= month.start && c.dueDate < month.end,
      );
      const expected = inMonth.reduce(
        (s, c) => s + (c._sum.amountMinor ?? 0n),
        0n,
      );
      const collected = inMonth.reduce(
        (s, c) => s + (c._sum.paidMinor ?? 0n),
        0n,
      );
      return {
        month: month.label,
        expectedMinor: expected.toString(),
        collectedMinor: collected.toString(),
        collectionRate:
          expected === 0n
            ? 0
            : Math.round((Number(collected) / Number(expected)) * 100),
      };
    });
  }

  private emptySummary(
    period: FinancePeriod,
    range: { start: Date; end: Date },
  ) {
    return {
      period,
      range: { start: range.start.toISOString(), end: range.end.toISOString() },
      currency: "GHS",
      portfolio: {
        totalProperties: 0,
        occupiedProperties: 0,
        vacantProperties: 0,
        occupancyRate: 0,
        totalUnits: 0,
        occupiedUnits: 0,
      },
      rent: {
        expectedMinor: "0",
        collectedMinor: "0",
        outstandingMinor: "0",
        collectionRate: 0,
      },
      attention: {
        openMaintenance: 0,
        urgentMaintenance: 0,
        pendingApprovals: 0,
        inspectionsDue: 0,
      },
      portfolioHealthScore: null,
      charts: { monthly: [] },
    };
  }
}

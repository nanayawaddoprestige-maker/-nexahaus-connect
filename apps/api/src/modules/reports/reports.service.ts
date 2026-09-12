import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { propertyScopeWhere } from "../authz/scope.util";
import {
  periodRange,
  monthsIn,
  type FinancePeriod,
} from "../finance/period.util";

export interface TabularReport {
  title: string;
  period?: { start: string; end: string };
  columns: {
    key: string;
    label: string;
    kind?: "money" | "number" | "percent" | "text";
  }[];
  rows: Record<string, string | number>[];
  /** Labels for figures that are estimates/assumptions (spec §31). */
  notes?: string[];
}

const OWNER_KINDS = [
  "portfolio-summary",
  "rent-collection",
  "outstanding-rent",
  "expenses",
  "occupancy",
  "maintenance",
  "asset-performance",
] as const;
const MANAGEMENT_KINDS = [
  "portfolio",
  "collection",
  "maintenance",
  "growth",
] as const;

const MAINT_CATS = new Set([
  "PLUMBING",
  "ELECTRICAL",
  "PAINTING",
  "AIR_CONDITIONING",
  "PEST_CONTROL",
  "REPAIRS",
  "CLEANING",
  "LANDSCAPING",
]);

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async owner(
    user: AuthUser,
    kind: string,
    period: FinancePeriod,
    propertyId?: string,
  ): Promise<TabularReport> {
    if (!OWNER_KINDS.includes(kind as never)) {
      throw AppError.notFound("report");
    }
    const range = periodRange(period);
    const scopeWhere = propertyScopeWhere(user);
    const properties = await this.prisma.property.findMany({
      where: propertyId
        ? { AND: [scopeWhere, { id: propertyId }] }
        : scopeWhere,
      select: { id: true, ref: true, name: true, status: true },
    });
    if (properties.length === 0) {
      return { title: label(kind), period: iso(range), columns: [], rows: [] };
    }
    const ids = properties.map((p) => p.id);

    switch (kind) {
      case "portfolio-summary":
        return this.portfolioSummary(properties, ids, range);
      case "rent-collection":
        return this.rentCollection(properties, ids, range);
      case "outstanding-rent":
        return this.outstandingRent(properties, ids);
      case "expenses":
        return this.expenses(properties, ids, range);
      case "occupancy":
        return this.occupancy(properties, ids);
      case "maintenance":
        return this.maintenance(properties, ids, range);
      case "asset-performance":
        return this.assetPerformance(properties, ids, range);
      default:
        throw AppError.notFound("report");
    }
  }

  async management(
    user: AuthUser,
    kind: string,
    period: FinancePeriod,
  ): Promise<TabularReport> {
    if (!user.scopeExempt) throw AppError.forbidden();
    if (!MANAGEMENT_KINDS.includes(kind as never))
      throw AppError.notFound("report");
    const range = periodRange(period);

    switch (kind) {
      case "portfolio": {
        const groups = await this.prisma.property.groupBy({
          by: ["status"],
          where: { deletedAt: null },
          _count: { _all: true },
        });
        return {
          title: "Properties by status",
          columns: [
            { key: "status", label: "Status", kind: "text" },
            { key: "count", label: "Properties", kind: "number" },
          ],
          rows: groups.map((g) => ({ status: g.status, count: g._count._all })),
        };
      }
      case "collection": {
        const months = monthsIn(range);
        const charges = await this.prisma.rentCharge.groupBy({
          by: ["dueDate"],
          where: {
            dueDate: { gte: range.start, lt: range.end },
            status: { not: "WAIVED" },
          },
          _sum: { amountMinor: true, paidMinor: true },
        });
        return {
          title: "Rent collection by month",
          period: iso(range),
          columns: [
            { key: "month", label: "Month", kind: "text" },
            { key: "expectedMinor", label: "Expected", kind: "money" },
            { key: "collectedMinor", label: "Collected", kind: "money" },
            { key: "rate", label: "Rate", kind: "percent" },
          ],
          rows: months.map((m) => {
            const inMonth = charges.filter(
              (c) => c.dueDate >= m.start && c.dueDate < m.end,
            );
            const exp = inMonth.reduce(
              (s, c) => s + (c._sum.amountMinor ?? 0n),
              0n,
            );
            const col = inMonth.reduce(
              (s, c) => s + (c._sum.paidMinor ?? 0n),
              0n,
            );
            return {
              month: m.label,
              expectedMinor: exp.toString(),
              collectedMinor: col.toString(),
              rate:
                exp === 0n ? 0 : Math.round((Number(col) / Number(exp)) * 100),
            };
          }),
        };
      }
      case "maintenance": {
        const [byStatus, cost] = await Promise.all([
          this.prisma.maintenanceRequest.groupBy({
            by: ["status"],
            where: { createdAt: { gte: range.start, lt: range.end } },
            _count: { _all: true },
          }),
          this.prisma.transaction.aggregate({
            where: {
              type: "EXPENSE",
              category: { in: [...MAINT_CATS] },
              occurredAt: { gte: range.start, lt: range.end },
            },
            _sum: { amountMinor: true },
          }),
        ]);
        return {
          title: "Maintenance volume & cost",
          period: iso(range),
          columns: [
            { key: "status", label: "Status", kind: "text" },
            { key: "count", label: "Requests", kind: "number" },
          ],
          rows: [
            ...byStatus.map((g) => ({
              status: g.status,
              count: g._count._all,
            })),
            {
              status: "TOTAL SPEND",
              count: Math.abs(Number(cost._sum.amountMinor ?? 0n)) / 100,
            },
          ],
          notes: [
            "Total spend is in major currency units, from posted expense transactions.",
          ],
        };
      }
      case "growth": {
        const months = monthsIn(periodRange("12m"));
        const [clients, properties] = await Promise.all([
          this.prisma.client.findMany({ select: { createdAt: true } }),
          this.prisma.property.findMany({ select: { createdAt: true } }),
        ]);
        return {
          title: "Client & property growth (12 months)",
          columns: [
            { key: "month", label: "Month", kind: "text" },
            { key: "clients", label: "New clients", kind: "number" },
            { key: "properties", label: "New properties", kind: "number" },
          ],
          rows: months.map((m) => ({
            month: m.label,
            clients: clients.filter(
              (c) => c.createdAt >= m.start && c.createdAt < m.end,
            ).length,
            properties: properties.filter(
              (p) => p.createdAt >= m.start && p.createdAt < m.end,
            ).length,
          })),
        };
      }
      default:
        throw AppError.notFound("report");
    }
  }

  toCsv(report: TabularReport): string {
    const header = report.columns.map((c) => c.label).join(",");
    const lines = report.rows.map((row) =>
      report.columns
        .map((c) => {
          const v = row[c.key] ?? "";
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(","),
    );
    return [header, ...lines].join("\n");
  }

  // ---- owner report builders --------------------------------------------

  private async portfolioSummary(
    properties: { id: string; ref: string; name: string; status: string }[],
    ids: string[],
    range: { start: Date; end: Date },
  ): Promise<TabularReport> {
    const [units, rent, maint] = await Promise.all([
      this.prisma.unit.groupBy({
        by: ["propertyId", "status"],
        where: { propertyId: { in: ids }, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.rentCharge.groupBy({
        by: ["propertyId"],
        where: {
          propertyId: { in: ids },
          dueDate: { gte: range.start, lt: range.end },
          status: { not: "WAIVED" },
        },
        _sum: { amountMinor: true, paidMinor: true },
      }),
      this.prisma.maintenanceRequest.groupBy({
        by: ["propertyId"],
        where: {
          propertyId: { in: ids },
          status: { notIn: ["CLOSED", "CANCELLED", "VERIFIED"] },
        },
        _count: { _all: true },
      }),
    ]);
    return {
      title: "Portfolio summary",
      period: iso(range),
      columns: [
        { key: "ref", label: "Ref", kind: "text" },
        { key: "name", label: "Property", kind: "text" },
        { key: "status", label: "Status", kind: "text" },
        { key: "units", label: "Units", kind: "number" },
        { key: "occupied", label: "Occupied", kind: "number" },
        { key: "expectedMinor", label: "Expected rent", kind: "money" },
        { key: "collectedMinor", label: "Collected", kind: "money" },
        { key: "openMaintenance", label: "Open maint.", kind: "number" },
      ],
      rows: properties.map((p) => {
        const pu = units.filter((u) => u.propertyId === p.id);
        const r = rent.find((x) => x.propertyId === p.id);
        return {
          ref: p.ref,
          name: p.name,
          status: p.status,
          units: pu.reduce((s, u) => s + u._count._all, 0),
          occupied: pu.find((u) => u.status === "OCCUPIED")?._count._all ?? 0,
          expectedMinor: (r?._sum.amountMinor ?? 0n).toString(),
          collectedMinor: (r?._sum.paidMinor ?? 0n).toString(),
          openMaintenance:
            maint.find((m) => m.propertyId === p.id)?._count._all ?? 0,
        };
      }),
    };
  }

  private async rentCollection(
    properties: { id: string; ref: string; name: string }[],
    ids: string[],
    range: { start: Date; end: Date },
  ): Promise<TabularReport> {
    const rows = await this.prisma.rentCharge.groupBy({
      by: ["propertyId", "status"],
      where: {
        propertyId: { in: ids },
        dueDate: { gte: range.start, lt: range.end },
      },
      _sum: { amountMinor: true, paidMinor: true },
      _count: { _all: true },
    });
    return {
      title: "Rent collection",
      period: iso(range),
      columns: [
        { key: "name", label: "Property", kind: "text" },
        { key: "billedMinor", label: "Billed", kind: "money" },
        { key: "paidMinor", label: "Paid", kind: "money" },
        { key: "outstandingMinor", label: "Outstanding", kind: "money" },
        { key: "rate", label: "Collection rate", kind: "percent" },
      ],
      rows: properties.map((p) => {
        const pr = rows.filter((r) => r.propertyId === p.id);
        const billed = pr.reduce((s, r) => s + (r._sum.amountMinor ?? 0n), 0n);
        const paid = pr.reduce((s, r) => s + (r._sum.paidMinor ?? 0n), 0n);
        return {
          name: p.name,
          billedMinor: billed.toString(),
          paidMinor: paid.toString(),
          outstandingMinor: (billed - paid).toString(),
          rate:
            billed === 0n
              ? 0
              : Math.round((Number(paid) / Number(billed)) * 100),
        };
      }),
    };
  }

  private async outstandingRent(
    properties: { id: string; name: string }[],
    ids: string[],
  ): Promise<TabularReport> {
    const overdue = await this.prisma.rentCharge.findMany({
      where: {
        propertyId: { in: ids },
        status: { in: ["OVERDUE", "PARTIALLY_PAID"] },
      },
      select: {
        propertyId: true,
        dueDate: true,
        amountMinor: true,
        paidMinor: true,
        currency: true,
      },
      orderBy: { dueDate: "asc" },
    });
    return {
      title: "Outstanding rent",
      columns: [
        { key: "name", label: "Property", kind: "text" },
        { key: "dueDate", label: "Due", kind: "text" },
        { key: "outstandingMinor", label: "Outstanding", kind: "money" },
        { key: "ageDays", label: "Age (days)", kind: "number" },
      ],
      rows: overdue.map((c) => ({
        name: properties.find((p) => p.id === c.propertyId)?.name ?? "—",
        dueDate: c.dueDate.toISOString().slice(0, 10),
        outstandingMinor: (c.amountMinor - c.paidMinor).toString(),
        ageDays: Math.max(
          0,
          Math.round((Date.now() - c.dueDate.getTime()) / 86_400_000),
        ),
      })),
    };
  }

  private async expenses(
    properties: { id: string; name: string }[],
    ids: string[],
    range: { start: Date; end: Date },
  ): Promise<TabularReport> {
    const rows = await this.prisma.expense.groupBy({
      by: ["propertyId", "category"],
      where: {
        propertyId: { in: ids },
        status: { in: ["APPROVED", "PAID"] },
        incurredAt: { gte: range.start, lt: range.end },
      },
      _sum: { amountMinor: true, taxMinor: true },
    });
    return {
      title: "Expenses by category",
      period: iso(range),
      columns: [
        { key: "name", label: "Property", kind: "text" },
        { key: "category", label: "Category", kind: "text" },
        { key: "totalMinor", label: "Total", kind: "money" },
      ],
      rows: rows.map((r) => ({
        name: properties.find((p) => p.id === r.propertyId)?.name ?? "—",
        category: r.category,
        totalMinor: (
          (r._sum.amountMinor ?? 0n) + (r._sum.taxMinor ?? 0n)
        ).toString(),
      })),
    };
  }

  private async occupancy(
    properties: { id: string; ref: string; name: string; status: string }[],
    ids: string[],
  ): Promise<TabularReport> {
    const units = await this.prisma.unit.groupBy({
      by: ["propertyId", "status"],
      where: { propertyId: { in: ids }, deletedAt: null },
      _count: { _all: true },
    });
    return {
      title: "Occupancy",
      columns: [
        { key: "name", label: "Property", kind: "text" },
        { key: "total", label: "Units", kind: "number" },
        { key: "occupied", label: "Occupied", kind: "number" },
        { key: "vacant", label: "Vacant", kind: "number" },
        { key: "rate", label: "Occupancy", kind: "percent" },
      ],
      rows: properties.map((p) => {
        const pu = units.filter((u) => u.propertyId === p.id);
        const total = pu.reduce((s, u) => s + u._count._all, 0);
        const occ = pu.find((u) => u.status === "OCCUPIED")?._count._all ?? 0;
        return {
          name: p.name,
          total,
          occupied: occ,
          vacant: pu.find((u) => u.status === "VACANT")?._count._all ?? 0,
          rate: total === 0 ? 0 : Math.round((occ / total) * 100),
        };
      }),
    };
  }

  private async maintenance(
    properties: { id: string; name: string }[],
    ids: string[],
    range: { start: Date; end: Date },
  ): Promise<TabularReport> {
    const [byProp, cost] = await Promise.all([
      this.prisma.maintenanceRequest.groupBy({
        by: ["propertyId", "status"],
        where: {
          propertyId: { in: ids },
          createdAt: { gte: range.start, lt: range.end },
        },
        _count: { _all: true },
      }),
      this.prisma.expense.groupBy({
        by: ["propertyId"],
        where: {
          propertyId: { in: ids },
          maintenanceRequestId: { not: null },
          status: { in: ["APPROVED", "PAID"] },
          incurredAt: { gte: range.start, lt: range.end },
        },
        _sum: { amountMinor: true, taxMinor: true },
      }),
    ]);
    return {
      title: "Maintenance",
      period: iso(range),
      columns: [
        { key: "name", label: "Property", kind: "text" },
        { key: "raised", label: "Raised", kind: "number" },
        { key: "open", label: "Open", kind: "number" },
        { key: "spendMinor", label: "Spend", kind: "money" },
      ],
      rows: properties.map((p) => {
        const pr = byProp.filter((r) => r.propertyId === p.id);
        return {
          name: p.name,
          raised: pr.reduce((s, r) => s + r._count._all, 0),
          open: pr
            .filter(
              (r) => !["CLOSED", "CANCELLED", "VERIFIED"].includes(r.status),
            )
            .reduce((s, r) => s + r._count._all, 0),
          spendMinor: (() => {
            const c = cost.find((x) => x.propertyId === p.id);
            return (
              (c?._sum.amountMinor ?? 0n) + (c?._sum.taxMinor ?? 0n)
            ).toString();
          })(),
        };
      }),
    };
  }

  private async assetPerformance(
    properties: { id: string; ref: string; name: string }[],
    ids: string[],
    range: { start: Date; end: Date },
  ): Promise<TabularReport> {
    const months = Math.max(
      1,
      (range.end.getUTCFullYear() - range.start.getUTCFullYear()) * 12 +
        (range.end.getUTCMonth() - range.start.getUTCMonth()),
    );
    const [txns, healthRows, propRows, vacantUnits] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ["propertyId", "type"],
        where: {
          propertyId: { in: ids },
          status: "POSTED",
          occurredAt: { gte: range.start, lt: range.end },
        },
        _sum: { amountMinor: true },
      }),
      this.prisma.propertyHealthScore.findMany({
        where: { propertyId: { in: ids } },
        orderBy: [{ propertyId: "asc" }, { scoredAt: "desc" }],
        distinct: ["propertyId"],
        select: { propertyId: true, score: true },
      }),
      this.prisma.property.findMany({
        where: { id: { in: ids } },
        select: { id: true, estimatedValueMinor: true },
      }),
      this.prisma.unit.findMany({
        where: {
          propertyId: { in: ids },
          deletedAt: null,
          status: { in: ["VACANT", "UNAVAILABLE"] },
        },
        select: { propertyId: true, marketRentMinor: true },
      }),
    ]);
    const healthById = new Map(healthRows.map((h) => [h.propertyId, h.score]));
    const valueById = new Map(
      propRows.map((p) => [p.id, p.estimatedValueMinor]),
    );

    return {
      title: "Asset performance",
      period: iso(range),
      columns: [
        { key: "name", label: "Property", kind: "text" },
        { key: "rentalIncomeMinor", label: "Rental income", kind: "money" },
        {
          key: "operatingExpensesMinor",
          label: "Operating expenses",
          kind: "money",
        },
        { key: "noiMinor", label: "Net operating income", kind: "money" },
        {
          key: "vacancyLossMinor",
          label: "Vacancy loss (est.)",
          kind: "money",
        },
        { key: "estValueMinor", label: "Estimated value", kind: "money" },
        { key: "yieldPct", label: "Gross yield (est.)", kind: "percent" },
        { key: "healthScore", label: "Health", kind: "number" },
      ],
      notes: [
        "Rental income and expenses are actual (from posted transactions).",
        "Vacancy loss and gross yield are estimates. Estimated value is the last manually entered valuation, not a professional valuation.",
      ],
      rows: properties.map((p) => {
        const t = txns.filter((x) => x.propertyId === p.id);
        const income =
          t.find((x) => x.type === "RENT_PAYMENT")?._sum.amountMinor ?? 0n;
        const opex = t
          .filter((x) => x.type === "EXPENSE" || x.type === "MANAGEMENT_FEE")
          .reduce((s, x) => s + (x._sum.amountMinor ?? 0n), 0n); // negative
        const noi = income + opex;
        const vac = vacantUnits
          .filter((u) => u.propertyId === p.id)
          .reduce((s, u) => s + (u.marketRentMinor ?? 0n) * BigInt(months), 0n);
        const value = valueById.get(p.id) ?? null;
        const annualisedIncome = (income * 12n) / BigInt(months);
        return {
          name: p.name,
          rentalIncomeMinor: income.toString(),
          operatingExpensesMinor: (-opex).toString(),
          noiMinor: noi.toString(),
          vacancyLossMinor: vac.toString(),
          estValueMinor: value ? value.toString() : "",
          yieldPct:
            value && value > 0n
              ? Math.round((Number(annualisedIncome) / Number(value)) * 100)
              : 0,
          healthScore: healthById.get(p.id) ?? 0,
        };
      }),
    };
  }
}

function iso(range: { start: Date; end: Date }) {
  return { start: range.start.toISOString(), end: range.end.toISOString() };
}
function label(kind: string): string {
  return kind
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

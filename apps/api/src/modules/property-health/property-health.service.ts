import { Injectable } from "@nestjs/common";
import {
  DomainEventType,
  HealthComponentKey,
  type AuthUser,
} from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { EventsService } from "../events/events.service";
import { propertyInScope } from "../authz/scope.util";
import { periodRange } from "../finance/period.util";
import {
  computeHealthScore,
  conditionToValue,
  type ComponentKey,
  type FactorInput,
} from "./health-score.util";

const REQUIRED_DOC_CATEGORIES = ["OWNERSHIP", "INSURANCE", "TENANCY"];

@Injectable()
export class PropertyHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  // --------------------------------------------------------------------------
  // Config (admin)
  // --------------------------------------------------------------------------

  async getConfig() {
    const active = await this.activeConfig();
    const history = await this.prisma.healthScoreConfig.findMany({
      orderBy: { version: "desc" },
      select: { version: true, active: true, weights: true, createdAt: true },
    });
    return { active, history };
  }

  async setConfig(
    user: AuthUser,
    weights: Partial<Record<ComponentKey, number>>,
    ctx: AuditContext,
  ) {
    const latest = await this.prisma.healthScoreConfig.findFirst({
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    await this.prisma.$transaction([
      this.prisma.healthScoreConfig.updateMany({
        where: { active: true },
        data: { active: false },
      }),
      this.prisma.healthScoreConfig.create({
        data: { version, weights, active: true, createdById: user.userId },
      }),
      this.prisma.organizationSetting.upsert({
        where: { key: "healthScore.activeConfigVersion" },
        create: { key: "healthScore.activeConfigVersion", value: version },
        update: { value: version },
      }),
    ]);
    await this.audit.record({
      ...ctx,
      action: "health.config.update",
      resourceType: "system_setting",
      resourceId: "healthScore",
      after: { version, weights },
    });
    return { version, weights, active: true };
  }

  private async activeConfig() {
    const cfg = await this.prisma.healthScoreConfig.findFirst({
      where: { active: true },
      orderBy: { version: "desc" },
    });
    if (cfg) return cfg;
    return {
      version: 1,
      weights: {
        OCCUPANCY: 0.2,
        RENT_COLLECTION: 0.2,
        MAINTENANCE: 0.15,
        CONDITION: 0.15,
        TENANT_SATISFACTION: 0.1,
        DOCUMENTATION: 0.1,
        SECURITY: 0.05,
        FINANCIAL: 0.05,
      } as Record<string, number>,
    };
  }

  // --------------------------------------------------------------------------
  // Read
  // --------------------------------------------------------------------------

  async latest(user: AuthUser, propertyId: string) {
    const property = await this.loadProperty(user, propertyId);
    const score = await this.prisma.propertyHealthScore.findFirst({
      where: { propertyId },
      orderBy: { scoredAt: "desc" },
    });
    if (!score) {
      return {
        propertyId,
        property: property.name,
        score: null,
        scoredAt: null,
        components: [],
        recommendations: [],
      };
    }
    return {
      propertyId,
      property: property.name,
      score: score.score,
      scoredAt: score.scoredAt.toISOString(),
      methodologyVersion: score.methodologyVersion,
      components: score.components,
      recommendations: score.recommendations,
    };
  }

  async history(user: AuthUser, propertyId: string) {
    await this.loadProperty(user, propertyId);
    const rows = await this.prisma.propertyHealthScore.findMany({
      where: { propertyId },
      orderBy: { scoredAt: "asc" },
      select: { score: true, scoredAt: true, methodologyVersion: true },
    });
    return {
      __list: true as const,
      items: rows.map((r) => ({
        score: r.score,
        scoredAt: r.scoredAt.toISOString(),
        methodologyVersion: r.methodologyVersion,
      })),
      meta: {},
    };
  }

  // --------------------------------------------------------------------------
  // Compute
  // --------------------------------------------------------------------------

  async recompute(user: AuthUser, propertyId: string, ctx: AuditContext) {
    const property = await this.loadProperty(user, propertyId);
    return this.computeAndStore(propertyId, property.clientId, ctx);
  }

  async recomputeAll(ctx: AuditContext): Promise<{ scored: number }> {
    const properties = await this.prisma.property.findMany({
      where: { deletedAt: null, status: { notIn: ["SOLD", "ARCHIVED"] } },
      select: { id: true, clientId: true },
    });
    for (const p of properties) {
      await this.computeAndStore(p.id, p.clientId, ctx).catch(() => undefined);
    }
    return { scored: properties.length };
  }

  private async computeAndStore(
    propertyId: string,
    clientId: string,
    ctx: AuditContext,
  ) {
    const cfg = await this.activeConfig();
    const factors = await this.gatherFactors(propertyId);
    const result = computeHealthScore(
      factors,
      cfg.weights as Record<ComponentKey, number>,
    );

    const stored = await this.prisma.$transaction(async (tx) => {
      const row = await tx.propertyHealthScore.create({
        data: {
          propertyId,
          score: result.score,
          methodologyVersion: cfg.version,
          components: result.components.map((c) => ({
            key: c.key,
            value: Math.round(c.value * 100),
            weight: c.weight,
            weighted: c.weightedScore,
            basis: c.basis,
            confidence: c.confidence,
          })),
          recommendations: result.recommendations,
          componentRows: {
            create: result.components.map((c) => ({
              key: c.key,
              rawValue: c.value,
              weight: c.weight,
              weightedScore: c.weightedScore,
            })),
          },
        },
      });
      await this.events.emit(
        DomainEventType.HEALTH_SCORE_UPDATED,
        { propertyId, clientId, score: result.score },
        tx,
      );
      await this.audit.record(
        {
          ...ctx,
          action: "health.recompute",
          resourceType: "property",
          resourceId: propertyId,
          after: { score: result.score, methodologyVersion: cfg.version },
        },
        tx,
      );
      return row;
    });

    return {
      propertyId,
      score: stored.score,
      scoredAt: stored.scoredAt.toISOString(),
      methodologyVersion: cfg.version,
      components: result.components,
      recommendations: result.recommendations,
    };
  }

  /** All factor derivations live here — transparent and auditable (spec §97). */
  private async gatherFactors(propertyId: string): Promise<FactorInput[]> {
    const sixMonths = periodRange("6m");
    const [
      units,
      rent,
      openMaintenance,
      totalMaintenance,
      latestInspection,
      urgentItems,
      docs,
      complianceIssues,
      netTxn,
    ] = await Promise.all([
      this.prisma.unit.groupBy({
        by: ["status"],
        where: { propertyId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.rentCharge.aggregate({
        where: {
          propertyId,
          dueDate: { gte: sixMonths.start, lt: sixMonths.end },
          status: { not: "WAIVED" },
        },
        _sum: { amountMinor: true, paidMinor: true },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          propertyId,
          status: { notIn: ["CLOSED", "CANCELLED", "VERIFIED"] },
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: { propertyId, createdAt: { gte: sixMonths.start } },
      }),
      this.prisma.inspection.findFirst({
        where: {
          propertyId,
          status: { in: ["COMPLETED", "REVIEWED", "REPORT_ISSUED"] },
        },
        orderBy: { completedAt: "desc" },
        select: { overallCondition: true, completedAt: true },
      }),
      this.prisma.inspectionItem.count({
        where: {
          inspection: { propertyId },
          rating: "URGENT",
        },
      }),
      this.prisma.document.findMany({
        where: { scopeType: "PROPERTY", scopeId: propertyId, status: "ACTIVE" },
        select: { category: true, expiresAt: true },
      }),
      this.prisma.complianceItem.count({
        where: {
          status: { in: ["EXPIRED", "MISSING"] },
          category: "PROPERTY_DOC",
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          propertyId,
          status: "POSTED",
          occurredAt: { gte: sixMonths.start, lt: sixMonths.end },
        },
        _sum: { amountMinor: true },
      }),
    ]);

    const totalUnits = units.reduce((s, g) => s + g._count._all, 0);
    const occupied =
      units.find((g) => g.status === "OCCUPIED")?._count._all ?? 0;
    const occupancy = totalUnits === 0 ? 0.5 : occupied / totalUnits;

    const expected = rent._sum.amountMinor ?? 0n;
    const collected = rent._sum.paidMinor ?? 0n;
    const collectionRate =
      expected === 0n ? 0.8 : Number(collected) / Number(expected);

    const maintenanceValue =
      totalMaintenance === 0
        ? 0.9
        : Math.max(0, 1 - openMaintenance / Math.max(3, totalMaintenance));

    const conditionValue = Math.max(
      0.1,
      conditionToValue(latestInspection?.overallCondition) - urgentItems * 0.05,
    );

    const presentCats = new Set(docs.map((d) => d.category));
    const presentRequired = REQUIRED_DOC_CATEGORIES.filter((c) =>
      presentCats.has(c as never),
    ).length;
    const expiredDocs = docs.filter(
      (d) => d.expiresAt && d.expiresAt < new Date(),
    ).length;
    const documentation = Math.max(
      0,
      presentRequired / REQUIRED_DOC_CATEGORIES.length - expiredDocs * 0.1,
    );

    const security = Math.max(
      0.3,
      0.95 - complianceIssues * 0.15 - urgentItems * 0.03,
    );

    const net = netTxn._sum.amountMinor ?? 0n;
    const financial =
      expected === 0n
        ? 0.7
        : net > 0n
          ? Math.min(1, 0.7 + Number(net) / Number(expected))
          : 0.4;

    return [
      {
        key: HealthComponentKey.OCCUPANCY,
        value: occupancy,
        basis: `${occupied}/${totalUnits} units occupied`,
        confidence: "actual",
      },
      {
        key: HealthComponentKey.RENT_COLLECTION,
        value: collectionRate,
        basis: `${Math.round(collectionRate * 100)}% of expected rent collected (6 months)`,
        confidence: "actual",
      },
      {
        key: HealthComponentKey.MAINTENANCE,
        value: maintenanceValue,
        basis: `${openMaintenance} open of ${totalMaintenance} requests (6 months)`,
        confidence: "actual",
      },
      {
        key: HealthComponentKey.CONDITION,
        value: conditionValue,
        basis: latestInspection?.overallCondition
          ? `latest inspection: ${latestInspection.overallCondition}${urgentItems ? `, ${urgentItems} urgent item(s)` : ""}`
          : "no completed inspection yet",
        confidence: latestInspection ? "actual" : "assumption",
      },
      {
        key: HealthComponentKey.TENANT_SATISFACTION,
        value: 0.85,
        basis: "no tenant survey data yet — assumed",
        confidence: "assumption",
      },
      {
        key: HealthComponentKey.DOCUMENTATION,
        value: documentation,
        basis: `${presentRequired}/${REQUIRED_DOC_CATEGORIES.length} core document types on file${expiredDocs ? `, ${expiredDocs} expired` : ""}`,
        confidence: "actual",
      },
      {
        key: HealthComponentKey.SECURITY,
        value: security,
        basis: complianceIssues
          ? `${complianceIssues} compliance item(s) need attention`
          : "no outstanding compliance items",
        confidence: complianceIssues || urgentItems ? "actual" : "estimate",
      },
      {
        key: HealthComponentKey.FINANCIAL,
        value: financial,
        basis:
          net > 0n
            ? "net positive on the ledger over 6 months"
            : "net not positive over 6 months",
        confidence: "estimate",
      },
    ];
  }

  private async loadProperty(user: AuthUser, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true, clientId: true, name: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    return property;
  }
}

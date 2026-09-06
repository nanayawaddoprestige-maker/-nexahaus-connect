import { createHash, randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { DomainEventType, type AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate } from "../../common/pagination";
import { propertyInScope } from "../authz/scope.util";
import { EventsService } from "../events/events.service";
import { StorageService } from "../storage/storage.service";
import { PdfService } from "../reports/pdf.service";
import { periodRange } from "../finance/period.util";

interface Finding {
  key: string;
  problem: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  /** 0..1 contribution to the overall score (1 = healthy). */
  score: number;
}

const RECS: Record<string, { title: string; detail: string }> = {
  RENT_BELOW_MARKET: {
    title: "Review rental pricing",
    detail:
      "One or more units are let materially below their recorded market rent. Review the pricing at the next renewal against comparable local listings. Professional review recommended before any increase.",
  },
  VACANCY: {
    title: "Address vacancy",
    detail:
      "Vacant units are producing no income. Refresh photography and listings, review the asking rent, and consider a short-term incentive to fill the unit.",
  },
  MAINTENANCE_BACKLOG: {
    title: "Clear the maintenance backlog",
    detail:
      "Open and overdue maintenance requests are accumulating. Prioritise by tenant impact, assign vendors, and set up a preventive maintenance schedule to stop recurrence.",
  },
  COLLECTION: {
    title: "Tighten rent collection",
    detail:
      "Collection is below target for the period. Follow up arrears promptly, agree payment plans where needed, and move tenants onto reliable payment methods.",
  },
  CONDITION: {
    title: "Complete outstanding repairs",
    detail:
      "The latest inspection flags items needing attention. Schedule the work and re-inspect once complete.",
  },
  DOCUMENTATION: {
    title: "Complete the document file",
    detail:
      "Core property documents are missing or expired. Upload ownership, insurance and tenancy documents and diarise renewals.",
  },
  REVENUE_LEAKAGE: {
    title: "Recover outstanding rent",
    detail:
      "A significant balance is outstanding relative to what was billed. Reconcile payments and pursue arrears before they age further.",
  },
};

@Injectable()
export class PropertyRescueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly storage: StorageService,
    private readonly pdf: PdfService,
  ) {}

  async latest(user: AuthUser, propertyId: string) {
    await this.loadProperty(user, propertyId);
    const assessment = await this.prisma.propertyRescueAssessment.findFirst({
      where: { propertyId },
      orderBy: { assessedAt: "desc" },
      include: { recommendations: { orderBy: { sortOrder: "asc" } } },
    });
    if (!assessment) return { propertyId, assessment: null };
    return { propertyId, assessment: this.serialize(assessment) };
  }

  async getById(user: AuthUser, id: string) {
    const assessment = await this.prisma.propertyRescueAssessment.findUnique({
      where: { id },
      include: {
        recommendations: { orderBy: { sortOrder: "asc" } },
        property: { select: { id: true, clientId: true } },
      },
    });
    if (!assessment || !propertyInScope(user, assessment.property)) {
      throw AppError.notFound("assessment");
    }
    return this.serialize(assessment);
  }

  async list(user: AuthUser, propertyId: string) {
    await this.loadProperty(user, propertyId);
    const rows = await this.prisma.propertyRescueAssessment.findMany({
      where: { propertyId },
      orderBy: { assessedAt: "desc" },
      select: { id: true, ref: true, overallScore: true, status: true, assessedAt: true, pdfDocumentId: true },
    });
    return {
      __list: true as const,
      items: rows.map((r) => ({
        id: r.id,
        ref: r.ref,
        overallScore: r.overallScore,
        status: r.status,
        assessedAt: r.assessedAt.toISOString(),
        hasPdf: r.pdfDocumentId !== null,
      })),
      meta: {},
    };
  }

  async assess(user: AuthUser, propertyId: string, ctx: AuditContext) {
    const property = await this.loadProperty(user, propertyId);
    const { findings, inputs } = await this.analyse(propertyId);

    const overallScore = Math.round(
      (findings.reduce((s, f) => s + f.score, 0) / (findings.length || 1)) * 100,
    );
    const problems = findings.filter((f) => f.score < 0.75).map((f) => f.problem);
    const recs = findings
      .filter((f) => f.score < 0.75 && RECS[f.key])
      .sort((a, b) => a.score - b.score)
      .map((f, i) => ({
        sortOrder: i,
        title: RECS[f.key]!.title,
        detail: RECS[f.key]!.detail,
        priority: f.severity,
      }));

    const assessment = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("rescue", tx);
      const created = await tx.propertyRescueAssessment.create({
        data: {
          ref,
          propertyId,
          overallScore,
          assessedByUserId: user.userId,
          inputs: inputs as never,
          findings: findings as never,
          status: "FINAL",
          recommendations: { create: recs.map((r) => ({ ...r, priority: r.priority as never })) },
        },
        include: { recommendations: { orderBy: { sortOrder: "asc" } } },
      });
      await this.events.emit(
        DomainEventType.PROPERTY_RESCUE_READY,
        { propertyId, clientId: property.clientId, assessmentId: created.id, overallScore },
        tx,
      );
      await this.audit.record(
        {
          ...ctx,
          action: "rescue.assess",
          resourceType: "property",
          resourceId: propertyId,
          after: { assessmentId: created.id, overallScore, problems: problems.length },
        },
        tx,
      );
      return created;
    });

    await this.renderPdf(assessment.id, property, overallScore, problems, recs);
    return this.getById(user, assessment.id);
  }

  async updateRecommendation(
    user: AuthUser,
    id: string,
    status: "OPEN" | "IN_PROGRESS" | "DONE" | "DISMISSED",
    ctx: AuditContext,
  ) {
    const rec = await this.prisma.propertyRescueRecommendation.findUnique({
      where: { id },
      include: { assessment: { select: { propertyId: true, property: { select: { id: true, clientId: true } } } } },
    });
    if (!rec || !propertyInScope(user, rec.assessment.property)) {
      throw AppError.notFound("recommendation");
    }
    await this.prisma.propertyRescueRecommendation.update({ where: { id }, data: { status } });
    await this.audit.record({
      ...ctx,
      action: "rescue.recommendation.update",
      resourceType: "property",
      resourceId: rec.assessment.propertyId,
      after: { recommendationId: id, status },
    });
    return { id, status };
  }

  // --------------------------------------------------------------------------

  private async analyse(propertyId: string): Promise<{ findings: Finding[]; inputs: Record<string, unknown> }> {
    const range = periodRange("6m");
    const [units, activeLeases, rent, maintenance, latestInspection, docs] = await Promise.all([
      this.prisma.unit.findMany({
        where: { propertyId, deletedAt: null },
        select: { id: true, status: true, marketRentMinor: true },
      }),
      this.prisma.lease.findMany({
        where: { propertyId, status: { in: ["ACTIVE", "EXPIRING"] } },
        select: { id: true, rentMinor: true, endDate: true, unitId: true },
      }),
      this.prisma.rentCharge.aggregate({
        where: { propertyId, dueDate: { gte: range.start, lt: range.end }, status: { not: "WAIVED" } },
        _sum: { amountMinor: true, paidMinor: true },
      }),
      this.prisma.maintenanceRequest.findMany({
        where: { propertyId, status: { notIn: ["CLOSED", "CANCELLED", "VERIFIED"] } },
        select: { id: true, createdAt: true, priority: true },
      }),
      this.prisma.inspection.findFirst({
        where: { propertyId, status: { in: ["COMPLETED", "REVIEWED", "REPORT_ISSUED"] } },
        orderBy: { completedAt: "desc" },
        include: { items: { where: { rating: { in: ["ATTENTION_REQUIRED", "URGENT"] } }, select: { id: true } } },
      }),
      this.prisma.document.findMany({
        where: { scopeType: "PROPERTY", scopeId: propertyId, status: "ACTIVE" },
        select: { category: true, expiresAt: true },
      }),
    ]);

    const findings: Finding[] = [];
    const totalUnits = units.length || 1;
    const vacant = units.filter((u) => u.status === "VACANT" || u.status === "UNAVAILABLE").length;

    // Occupancy / vacancy
    const occValue = 1 - vacant / totalUnits;
    findings.push({
      key: "VACANCY",
      problem: `${vacant} of ${totalUnits} unit(s) vacant`,
      severity: vacant / totalUnits > 0.5 ? "HIGH" : vacant > 0 ? "MEDIUM" : "LOW",
      score: occValue,
    });

    // Rent vs market
    const belowMarket = activeLeases.filter((l) => {
      const unit = units.find((u) => u.id === l.unitId);
      return unit?.marketRentMinor && l.rentMinor < (unit.marketRentMinor * 90n) / 100n;
    }).length;
    findings.push({
      key: "RENT_BELOW_MARKET",
      problem: `${belowMarket} lease(s) let >10% below recorded market rent`,
      severity: belowMarket > 0 ? "MEDIUM" : "LOW",
      score: belowMarket === 0 ? 1 : Math.max(0.3, 1 - belowMarket / activeLeases.length),
    });

    // Collection
    const expected = rent._sum.amountMinor ?? 0n;
    const collected = rent._sum.paidMinor ?? 0n;
    const collectionRate = expected === 0n ? 0.9 : Number(collected) / Number(expected);
    findings.push({
      key: "COLLECTION",
      problem: `${Math.round(collectionRate * 100)}% of billed rent collected over 6 months`,
      severity: collectionRate < 0.7 ? "HIGH" : collectionRate < 0.9 ? "MEDIUM" : "LOW",
      score: Math.min(1, collectionRate),
    });

    // Revenue leakage (outstanding vs billed)
    const outstanding = expected - collected;
    const leakage = expected === 0n ? 0 : Number(outstanding) / Number(expected);
    findings.push({
      key: "REVENUE_LEAKAGE",
      problem: `Outstanding rent is ${Math.round(leakage * 100)}% of what was billed`,
      severity: leakage > 0.25 ? "HIGH" : leakage > 0.1 ? "MEDIUM" : "LOW",
      score: Math.max(0, 1 - leakage),
    });

    // Maintenance backlog
    const oldest = maintenance.reduce(
      (max, m) => Math.max(max, (Date.now() - m.createdAt.getTime()) / 86_400_000),
      0,
    );
    const backlogValue = Math.max(0, 1 - maintenance.length / 5 - Math.min(0.4, oldest / 90));
    findings.push({
      key: "MAINTENANCE_BACKLOG",
      problem: `${maintenance.length} open request(s), oldest ${Math.round(oldest)} days`,
      severity:
        maintenance.some((m) => m.priority === "URGENT") || oldest > 30
          ? "HIGH"
          : maintenance.length > 2
            ? "MEDIUM"
            : "LOW",
      score: backlogValue,
    });

    // Condition
    const attentionItems = latestInspection?.items.length ?? 0;
    const conditionValue = latestInspection
      ? Math.max(0.2, ({ EXCELLENT: 1, GOOD: 0.85, FAIR: 0.6, POOR: 0.3 }[
          latestInspection.overallCondition ?? "GOOD"
        ] ?? 0.7) - attentionItems * 0.05)
      : 0.7;
    findings.push({
      key: "CONDITION",
      problem: latestInspection
        ? `Latest inspection: ${latestInspection.overallCondition}, ${attentionItems} item(s) need attention`
        : "No completed inspection on file",
      severity: conditionValue < 0.5 ? "HIGH" : conditionValue < 0.75 ? "MEDIUM" : "LOW",
      score: conditionValue,
    });

    // Documentation
    const present = new Set(docs.map((d) => d.category));
    const required = ["OWNERSHIP", "INSURANCE", "TENANCY"];
    const have = required.filter((c) => present.has(c as never)).length;
    const expired = docs.filter((d) => d.expiresAt && d.expiresAt < new Date()).length;
    const docValue = Math.max(0, have / required.length - expired * 0.1);
    findings.push({
      key: "DOCUMENTATION",
      problem: `${have}/${required.length} core documents on file${expired ? `, ${expired} expired` : ""}`,
      severity: docValue < 0.5 ? "MEDIUM" : "LOW",
      score: docValue,
    });

    return {
      findings,
      inputs: {
        totalUnits,
        vacant,
        activeLeases: activeLeases.length,
        belowMarket,
        collectionRatePct: Math.round(collectionRate * 100),
        outstandingMinor: outstanding.toString(),
        openMaintenance: maintenance.length,
        oldestOpenDays: Math.round(oldest),
        latestCondition: latestInspection?.overallCondition ?? null,
        coreDocsPresent: have,
      },
    };
  }

  private async renderPdf(
    assessmentId: string,
    property: { id: string; clientId: string; name: string; ref: string; addressLine: string; city: string },
    overallScore: number,
    problems: string[],
    recs: { title: string; detail: string; priority: string }[],
  ): Promise<void> {
    const assessment = await this.prisma.propertyRescueAssessment.findUniqueOrThrow({
      where: { id: assessmentId },
    });
    const buffer = await this.pdf.rescueReport({
      ref: assessment.ref,
      propertyName: property.name,
      propertyRef: property.ref,
      address: `${property.addressLine}, ${property.city}`,
      assessedAt: assessment.assessedAt.toISOString(),
      overallScore,
      problems,
      recommendations: recs,
    });

    const documentId = randomUUID();
    const versionId = randomUUID();
    const key = this.storage.buildKey({
      clientId: property.clientId,
      scopeType: "PROPERTY",
      scopeId: property.id,
      documentId,
      versionId,
    });
    await this.storage.put(key, buffer, "application/pdf");
    const checksum = createHash("sha256").update(buffer).digest("hex");

    await this.prisma.$transaction([
      this.prisma.document.create({
        data: {
          id: documentId,
          scopeType: "PROPERTY",
          scopeId: property.id,
          category: "OTHER",
          title: `Property Rescue report ${assessment.ref}`,
          mimeType: "application/pdf",
          sizeBytes: BigInt(buffer.length),
          checksumSha256: checksum,
          storageKey: key,
          currentVersionId: versionId,
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
        },
      }),
      this.prisma.propertyRescueAssessment.update({
        where: { id: assessmentId },
        data: { pdfDocumentId: documentId },
      }),
    ]);
  }

  private serialize(a: {
    id: string;
    ref: string;
    overallScore: number;
    status: string;
    assessedAt: Date;
    findings: unknown;
    inputs: unknown;
    pdfDocumentId: string | null;
    recommendations: {
      id: string;
      sortOrder: number;
      title: string;
      detail: string;
      priority: string;
      status: string;
    }[];
  }) {
    return {
      id: a.id,
      ref: a.ref,
      overallScore: a.overallScore,
      status: a.status,
      assessedAt: a.assessedAt.toISOString(),
      findings: a.findings,
      inputs: a.inputs,
      pdfDocumentId: a.pdfDocumentId,
      recommendations: a.recommendations.map((r) => ({
        id: r.id,
        order: r.sortOrder,
        title: r.title,
        detail: r.detail,
        priority: r.priority,
        status: r.status,
      })),
    };
  }

  private async loadProperty(user: AuthUser, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true, clientId: true, name: true, ref: true, addressLine: true, city: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    return property;
  }
}

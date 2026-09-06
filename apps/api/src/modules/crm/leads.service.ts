import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { LeadGrade, type AuthUser } from "@nexahaus/types";
import type {
  ConvertLeadInput,
  CreateLeadInput,
  LeadActivityInput,
  ListLeadQuery,
  UpdateLeadInput,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate, parseSort } from "../../common/pagination";
import { computeLeadScore, type LeadScoreConfigShape } from "./lead-scoring.util";

const SORTABLE = ["createdAt", "score", "name", "status"] as const;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListLeadQuery) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.LeadWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.grade ? { grade: query.grade } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
              { ref: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(query.sort, SORTABLE, { createdAt: "desc" }),
        include: {
          owner: { select: { id: true, fullName: true } },
          _count: { select: { activities: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return paginate(
      rows.map((l) => ({
        id: l.id,
        ref: l.ref,
        name: l.name,
        email: l.email,
        phone: l.phone,
        source: l.source,
        status: l.status,
        score: l.score,
        grade: l.grade,
        propertyCount: l.propertyCount,
        location: l.location,
        owner: l.owner,
        activityCount: l._count.activities,
        createdAt: l.createdAt.toISOString(),
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async pipeline() {
    const groups = await this.prisma.lead.groupBy({
      by: ["status"],
      _count: { _all: true },
      _avg: { score: true },
    });
    return {
      __list: true as const,
      items: groups.map((g) => ({
        status: g.status,
        count: g._count._all,
        averageScore: Math.round(g._avg.score ?? 0),
      })),
      meta: {},
    };
  }

  async getById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true } },
        activities: {
          orderBy: { occurredAt: "desc" },
          include: { byUser: { select: { id: true, fullName: true } } },
        },
        healthChecks: { select: { id: true, preliminaryScore: true, createdAt: true } },
        surveyResponses: { select: { id: true, surveyId: true, submittedAt: true } },
      },
    });
    if (!lead) throw AppError.notFound("lead");
    return {
      id: lead.id,
      ref: lead.ref,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      campaign: lead.campaign,
      segment: lead.segment,
      status: lead.status,
      score: lead.score,
      grade: lead.grade,
      propertyCount: lead.propertyCount,
      propertyType: lead.propertyType,
      location: lead.location,
      livesInGhana: lead.livesInGhana,
      biggestChallenge: lead.biggestChallenge,
      serviceInterest: lead.serviceInterest,
      consent: lead.consent,
      owner: lead.owner,
      convertedClientId: lead.convertedClientId,
      activities: lead.activities.map((a) => ({
        id: a.id,
        type: a.type,
        body: a.body,
        by: a.byUser?.fullName ?? "System",
        occurredAt: a.occurredAt.toISOString(),
        dueAt: a.dueAt?.toISOString() ?? null,
        completedAt: a.completedAt?.toISOString() ?? null,
      })),
      healthChecks: lead.healthChecks.map((h) => ({
        id: h.id,
        preliminaryScore: h.preliminaryScore,
        createdAt: h.createdAt.toISOString(),
      })),
      surveyResponses: lead.surveyResponses.length,
      createdAt: lead.createdAt.toISOString(),
    };
  }

  async create(user: AuthUser, input: CreateLeadInput, ctx: AuditContext) {
    const scored = computeLeadScore({
      propertyCount: input.propertyCount,
      livesInGhana: input.livesInGhana,
      location: input.location,
      biggestChallenge: input.biggestChallenge,
      serviceInterest: input.serviceInterest,
    });

    const lead = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("lead", tx);
      const created = await tx.lead.create({
        data: {
          ref,
          name: input.name,
          email: input.email,
          phone: input.phone,
          source: input.source,
          campaign: input.campaign ?? null,
          segment: input.segment ?? null,
          propertyCount: input.propertyCount ?? null,
          propertyType: input.propertyType ?? null,
          location: input.location ?? null,
          serviceInterest: input.serviceInterest ?? [],
          livesInGhana: input.livesInGhana ?? null,
          biggestChallenge: input.biggestChallenge ?? null,
          score: scored.score,
          grade: scored.grade,
          status: "NEW",
          ownerUserId: user.userId,
          consent: input.consent ? (input.consent as Prisma.InputJsonValue) : undefined,
        },
      });
      if (input.consent) {
        await tx.consentRecord.create({
          data: {
            subjectType: "LEAD",
            subjectId: created.id,
            purpose: input.consent.purpose ?? "marketing",
            lawfulBasis: "consent",
            source: "crm.manual",
            evidence: input.consent as Prisma.InputJsonValue,
            revokedAt: input.consent.marketing ? null : new Date(),
          },
        });
      }
      await this.audit.record(
        { ...ctx, action: "lead.create", resourceType: "lead", resourceId: created.id, after: { ref: created.ref, score: scored.score, grade: scored.grade } },
        tx,
      );
      return created;
    });
    return this.getById(lead.id);
  }

  async update(user: AuthUser, id: string, input: UpdateLeadInput, ctx: AuditContext) {
    const existing = await this.prisma.lead.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("lead");

    const statusChanged = input.status && input.status !== existing.status;
    await this.prisma.lead.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        email: input.email ?? undefined,
        phone: input.phone ?? undefined,
        source: input.source ?? undefined,
        campaign: input.campaign ?? undefined,
        segment: input.segment ?? undefined,
        propertyCount: input.propertyCount ?? undefined,
        propertyType: input.propertyType ?? undefined,
        location: input.location ?? undefined,
        serviceInterest: input.serviceInterest ?? undefined,
        livesInGhana: input.livesInGhana ?? undefined,
        biggestChallenge: input.biggestChallenge ?? undefined,
        status: input.status ?? undefined,
        ownerUserId: input.ownerUserId ?? undefined,
      },
    });
    if (statusChanged) {
      await this.prisma.leadActivity.create({
        data: {
          leadId: id,
          type: "STATUS_CHANGE",
          body: `Status ${existing.status} → ${input.status}`,
          byUserId: user.userId,
        },
      });
    }
    await this.audit.record({
      ...ctx,
      action: "lead.update",
      resourceType: "lead",
      resourceId: id,
      before: { status: existing.status },
      after: { status: input.status ?? existing.status },
    });
    return this.rescore(user, id, ctx);
  }

  async addActivity(
    user: AuthUser,
    id: string,
    input: LeadActivityInput,
    ctx: AuditContext,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!lead) throw AppError.notFound("lead");
    await this.prisma.leadActivity.create({
      data: {
        leadId: id,
        type: input.type,
        body: input.body,
        byUserId: user.userId,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
      },
    });
    await this.audit.record({
      ...ctx,
      action: "lead.activity.add",
      resourceType: "lead",
      resourceId: id,
      after: { type: input.type },
    });
    return this.rescore(user, id, ctx);
  }

  async rescore(user: AuthUser, id: string, _ctx: AuditContext) {
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id },
      include: {
        _count: { select: { activities: true } },
        healthChecks: { select: { id: true }, take: 1 },
        surveyResponses: { select: { id: true }, take: 1 },
      },
    });
    const config = await this.activeConfig();
    const consultationBooked = await this.prisma.leadActivity.count({
      where: { leadId: id, type: "MEETING" },
    });
    const scored = computeLeadScore(
      {
        propertyCount: lead.propertyCount,
        livesInGhana: lead.livesInGhana,
        location: lead.location,
        biggestChallenge: lead.biggestChallenge,
        serviceInterest: lead.serviceInterest,
        assessmentCompleted: lead.healthChecks.length > 0 || lead.surveyResponses.length > 0,
        consultationBooked: consultationBooked > 0,
        engagementTouches: lead._count.activities,
      },
      config,
    );
    await this.prisma.lead.update({
      where: { id },
      data: { score: scored.score, grade: scored.grade },
    });
    return { ...(await this.getById(id)), scoreBreakdown: scored.breakdown };
  }

  async convert(
    user: AuthUser,
    id: string,
    input: ConvertLeadInput,
    ctx: AuditContext,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw AppError.notFound("lead");
    if (lead.convertedClientId) {
      throw AppError.conflict("This lead has already been converted.");
    }

    const client = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("client", tx);
      const created = await tx.client.create({
        data: {
          ref,
          type: input.clientType,
          displayName: lead.name,
          segment: input.segment,
          status: "ONBOARDING",
          primaryEmail: lead.email,
          primaryPhone: lead.phone,
          countryOfResidence: lead.livesInGhana === false ? null : "GH",
          servicePackage: input.servicePackage ?? null,
          accountManagerId: input.accountManagerId ?? user.userId,
          onboarding: { create: { currentStep: 1, status: "IN_PROGRESS" } },
        },
      });
      await tx.lead.update({
        where: { id },
        data: { status: "WON", convertedClientId: created.id },
      });
      await tx.leadActivity.create({
        data: { leadId: id, type: "STATUS_CHANGE", body: `Converted to client ${created.ref}`, byUserId: user.userId },
      });
      // Carry the marketing consent onto the client.
      if (lead.consent) {
        await tx.consentRecord.create({
          data: {
            subjectType: "CLIENT",
            subjectId: created.id,
            purpose: "marketing",
            lawfulBasis: "consent",
            source: "crm.convert",
            evidence: lead.consent as Prisma.InputJsonValue,
          },
        });
      }
      await this.audit.record(
        { ...ctx, action: "lead.convert", resourceType: "lead", resourceId: id, after: { clientId: created.id, clientRef: created.ref } },
        tx,
      );
      return created;
    });

    return { leadId: id, clientId: client.id, clientRef: client.ref };
  }

  async getScoreConfig() {
    const active = await this.prisma.leadScoreConfig.findFirst({
      where: { active: true },
      orderBy: { version: "desc" },
    });
    return active ?? { version: 1, factors: null };
  }

  async setScoreConfig(
    user: AuthUser,
    factors: LeadScoreConfigShape["factors"],
    ctx: AuditContext,
  ) {
    const latest = await this.prisma.leadScoreConfig.findFirst({
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    await this.prisma.$transaction([
      this.prisma.leadScoreConfig.updateMany({ where: { active: true }, data: { active: false } }),
      this.prisma.leadScoreConfig.create({
        data: { version, factors: factors as Prisma.InputJsonValue, active: true, createdById: user.userId },
      }),
    ]);
    await this.audit.record({
      ...ctx,
      action: "lead.score_config.update",
      resourceType: "lead_score_config",
      resourceId: String(version),
      after: { version },
    });
    return { version, factors };
  }

  private async activeConfig(): Promise<LeadScoreConfigShape["factors"] | undefined> {
    const cfg = await this.prisma.leadScoreConfig.findFirst({
      where: { active: true },
      orderBy: { version: "desc" },
      select: { factors: true },
    });
    return (cfg?.factors as LeadScoreConfigShape["factors"] | undefined) ?? undefined;
  }
}

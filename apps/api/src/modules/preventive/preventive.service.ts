import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@nexahaus/types";
import type { PreventivePlanInput } from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { propertyInScope } from "../authz/scope.util";

const INTERVAL_DAYS: Record<string, number> = {
  MONTHLY: 30,
  QUARTERLY: 91,
  BIANNUAL: 182,
  ANNUAL: 365,
};

/**
 * Recurring maintenance schedules (spec §23). A worker (Phase 5) will read
 * `nextDueAt` and raise a maintenance request + reminder when a plan comes due;
 * this module owns the plan CRUD and the next-due arithmetic.
 */
@Injectable()
export class PreventiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listForProperty(user: AuthUser, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    const plans = await this.prisma.preventiveMaintenancePlan.findMany({
      where: { propertyId },
      orderBy: { nextDueAt: "asc" },
    });
    return {
      __list: true as const,
      items: plans.map((p) => ({
        id: p.id,
        serviceType: p.serviceType,
        frequency: p.frequency,
        intervalDays: p.intervalDays,
        nextDueAt: p.nextDueAt.toISOString(),
        lastRunAt: p.lastRunAt?.toISOString() ?? null,
        vendorId: p.vendorId,
        active: p.active,
      })),
      meta: {},
    };
  }

  async create(user: AuthUser, input: PreventivePlanInput, ctx: AuditContext) {
    const property = await this.prisma.property.findFirst({
      where: { id: input.propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    const plan = await this.prisma.preventiveMaintenancePlan.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId ?? null,
        serviceType: input.serviceType,
        frequency: input.frequency,
        intervalDays:
          input.frequency === "CUSTOM"
            ? (input.intervalDays ?? 30)
            : INTERVAL_DAYS[input.frequency],
        nextDueAt: new Date(input.nextDueAt),
        vendorId: input.vendorId ?? null,
        active: input.active,
        createdById: user.userId,
      },
    });
    await this.audit.record({
      ...ctx,
      action: "preventive.create",
      resourceType: "property",
      resourceId: input.propertyId,
      after: {
        planId: plan.id,
        serviceType: plan.serviceType,
        frequency: plan.frequency,
      },
    });
    return plan;
  }

  async update(
    user: AuthUser,
    id: string,
    input: Partial<PreventivePlanInput> & { markRun?: boolean },
    ctx: AuditContext,
  ) {
    const plan = await this.prisma.preventiveMaintenancePlan.findUnique({
      where: { id },
      include: { property: { select: { id: true, clientId: true } } },
    });
    if (!plan || !propertyInScope(user, plan.property)) {
      throw AppError.notFound("preventive plan");
    }

    let nextDueAt = input.nextDueAt ? new Date(input.nextDueAt) : undefined;
    let lastRunAt: Date | undefined;
    if (input.markRun) {
      lastRunAt = new Date();
      const days = plan.intervalDays ?? INTERVAL_DAYS[plan.frequency] ?? 91;
      nextDueAt = new Date(Date.now() + days * 86_400_000);
    }

    const updated = await this.prisma.preventiveMaintenancePlan.update({
      where: { id },
      data: {
        serviceType: input.serviceType ?? undefined,
        frequency: input.frequency ?? undefined,
        intervalDays: input.intervalDays ?? undefined,
        vendorId: input.vendorId ?? undefined,
        active: input.active ?? undefined,
        nextDueAt,
        lastRunAt,
      },
    });
    await this.audit.record({
      ...ctx,
      action: input.markRun ? "preventive.mark_run" : "preventive.update",
      resourceType: "property",
      resourceId: plan.propertyId,
      after: {
        planId: id,
        nextDueAt: updated.nextDueAt.toISOString(),
        active: updated.active,
      },
    });
    return updated;
  }
}

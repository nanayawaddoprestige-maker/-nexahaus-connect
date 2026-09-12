import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DomainEventType } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { RefService } from "../../common/ref.service";
import { EventsService } from "../events/events.service";

const INTERVAL_DAYS: Record<string, number> = {
  MONTHLY: 30,
  QUARTERLY: 91,
  BIANNUAL: 182,
  ANNUAL: 365,
};

/**
 * Daily scan for time-based obligations (spec §14, §22, §23, §27, §51). It only
 * detects and emits domain events / creates work — the outbox turns those into
 * notifications. Every step is idempotent (guarded by `sentAt` / status / a
 * dedupe reference) so a re-run in the same day is safe.
 */
@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly events: EventsService,
  ) {}

  @Cron("0 7 * * *", { name: "daily-reminders", timeZone: "Africa/Accra" })
  async daily(): Promise<void> {
    // Set DISABLE_SCHEDULERS=true on API instances once a dedicated worker runs.
    if (process.env.DISABLE_SCHEDULERS === "true") return;
    await this.scan();
  }

  /** Manual trigger for staff / tests — always runs. */
  runNow(): Promise<{
    overdue: number;
    leases: number;
    documents: number;
    preventive: number;
  }> {
    return this.scan();
  }

  private async scan(): Promise<{
    overdue: number;
    leases: number;
    documents: number;
    preventive: number;
  }> {
    const now = new Date();
    const [overdue, leases, documents, preventive] = await Promise.all([
      this.markOverdueRent(now),
      this.fireLeaseReminders(now),
      this.fireDocumentReminders(now),
      this.raisePreventiveMaintenance(now),
    ]);
    this.logger.log(
      `Daily scan: ${overdue} overdue charges, ${leases} lease reminders, ${documents} document reminders, ${preventive} preventive jobs`,
    );
    return { overdue, leases, documents, preventive };
  }

  private async markOverdueRent(now: Date): Promise<number> {
    const due = await this.prisma.rentCharge.findMany({
      where: {
        status: { in: ["EXPECTED", "PARTIALLY_PAID"] },
        dueDate: { lt: startOfDay(now) },
      },
      select: { id: true, clientId: true, propertyId: true },
      take: 1000,
    });
    for (const charge of due) {
      await this.prisma.$transaction(async (tx) => {
        await tx.rentCharge.update({
          where: { id: charge.id },
          data: { status: "OVERDUE" },
        });
        await this.events.emit(
          DomainEventType.RENT_OVERDUE,
          {
            rentChargeId: charge.id,
            clientId: charge.clientId,
            propertyId: charge.propertyId,
          },
          tx,
        );
      });
    }
    return due.length;
  }

  private async fireLeaseReminders(now: Date): Promise<number> {
    const reminders = await this.prisma.leaseReminder.findMany({
      where: { sentAt: null, remindAt: { lte: now } },
      include: {
        lease: {
          select: {
            id: true,
            endDate: true,
            clientId: true,
            propertyId: true,
            status: true,
          },
        },
      },
      take: 500,
    });
    for (const r of reminders) {
      const inDays = Math.max(
        0,
        Math.ceil((r.lease.endDate.getTime() - now.getTime()) / 86_400_000),
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.leaseReminder.update({
          where: { id: r.id },
          data: { sentAt: now },
        });
        if (r.lease.status === "ACTIVE" && inDays <= 90) {
          await tx.lease.update({
            where: { id: r.lease.id },
            data: { status: "EXPIRING" },
          });
        }
        await this.events.emit(
          DomainEventType.LEASE_EXPIRING,
          {
            leaseId: r.lease.id,
            clientId: r.lease.clientId,
            propertyId: r.lease.propertyId,
            inDays,
          },
          tx,
        );
      });
    }
    return reminders.length;
  }

  private async fireDocumentReminders(now: Date): Promise<number> {
    const reminders = await this.prisma.documentExpiryReminder.findMany({
      where: { sentAt: null, remindAt: { lte: now } },
      include: {
        document: {
          select: {
            id: true,
            scopeType: true,
            scopeId: true,
            expiresAt: true,
            title: true,
          },
        },
      },
      take: 500,
    });
    for (const r of reminders) {
      const propertyId =
        r.document.scopeType === "PROPERTY" ? r.document.scopeId : undefined;
      await this.prisma.$transaction(async (tx) => {
        await tx.documentExpiryReminder.update({
          where: { id: r.id },
          data: { sentAt: now },
        });
        await this.events.emit(
          DomainEventType.DOCUMENT_EXPIRING,
          {
            documentId: r.document.id,
            title: r.document.title,
            expiresAt: r.document.expiresAt?.toISOString(),
            inDays: r.offsetDays,
            propertyId,
          },
          tx,
        );
      });
    }
    return reminders.length;
  }

  private async raisePreventiveMaintenance(now: Date): Promise<number> {
    const plans = await this.prisma.preventiveMaintenancePlan.findMany({
      where: { active: true, nextDueAt: { lte: now } },
      include: { property: { select: { id: true, clientId: true } } },
      take: 500,
    });
    for (const plan of plans) {
      const dedupeRef = `PPM:${plan.id}:${startOfDay(now).toISOString().slice(0, 10)}`;
      const already = await this.prisma.maintenanceRequest.findFirst({
        where: { description: { contains: dedupeRef } },
        select: { id: true },
      });
      if (already) continue;

      const days = plan.intervalDays ?? INTERVAL_DAYS[plan.frequency] ?? 91;
      await this.prisma.$transaction(async (tx) => {
        const ref = await this.refs.next("maintenance", tx);
        const request = await tx.maintenanceRequest.create({
          data: {
            ref,
            propertyId: plan.propertyId,
            unitId: plan.unitId,
            reportedByType: "SYSTEM",
            category: plan.serviceType,
            priority: "MEDIUM",
            title: `Scheduled: ${titleCase(plan.serviceType)}`,
            description: `Preventive maintenance due per the schedule for this property. [${dedupeRef}]`,
            status: "REPORTED",
            statusHistory: {
              create: {
                toStatus: "REPORTED",
                note: "Raised by preventive schedule",
              },
            },
          },
        });
        await tx.preventiveMaintenancePlan.update({
          where: { id: plan.id },
          data: {
            lastRunAt: now,
            nextDueAt: new Date(now.getTime() + days * 86_400_000),
          },
        });
        await this.events.emit(
          DomainEventType.MAINTENANCE_CREATED,
          {
            maintenanceRequestId: request.id,
            propertyId: plan.propertyId,
            clientId: plan.property.clientId,
            priority: "MEDIUM",
          },
          tx,
        );
      });
    }
    return plans.length;
  }
}

function startOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}
function titleCase(v: string): string {
  return v
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

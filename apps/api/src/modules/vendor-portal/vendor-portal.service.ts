import { Injectable } from "@nestjs/common";
import { DomainEventType, type AuthUser } from "@nexahaus/types";
import type { CompleteWorkOrderInput } from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { EventsService } from "../events/events.service";

/**
 * Vendor self-service (spec §44). Bound to the caller's own `vendorId`
 * (resolved by AuthGuard from Vendor.userId). A vendor sees ONLY the work
 * orders assigned to them — never other vendors' work, owner finances, or
 * tenant personal data.
 */
@Injectable()
export class VendorPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  private vendorIdOrThrow(user: AuthUser): string {
    if (!user.vendorId)
      throw AppError.forbidden("No vendor account is linked to this login.");
    return user.vendorId;
  }

  async profile(user: AuthUser) {
    const vendorId = this.vendorIdOrThrow(user);
    const v = await this.prisma.vendor.findUniqueOrThrow({
      where: { id: vendorId },
      select: {
        id: true,
        ref: true,
        name: true,
        categories: true,
        phone: true,
        email: true,
        rating: true,
        status: true,
        insuranceExpiryAt: true,
      },
    });
    return {
      ...v,
      rating: v.rating ? Number(v.rating) : null,
      insuranceExpiryAt: v.insuranceExpiryAt?.toISOString() ?? null,
    };
  }

  async workOrders(user: AuthUser, openOnly: boolean) {
    const vendorId = this.vendorIdOrThrow(user);
    const rows = await this.prisma.workOrder.findMany({
      where: {
        vendorId,
        ...(openOnly
          ? { status: { in: ["DRAFT", "ISSUED", "IN_PROGRESS"] } }
          : {}),
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
      include: {
        request: {
          select: {
            id: true,
            ref: true,
            title: true,
            category: true,
            priority: true,
            status: true,
            property: { select: { name: true, addressLine: true, city: true } },
            unit: { select: { label: true } },
          },
        },
      },
    });
    return {
      __list: true as const,
      items: rows.map((w) => ({
        id: w.id,
        ref: w.ref,
        status: w.status,
        scheduledFor: w.scheduledFor?.toISOString() ?? null,
        completedAt: w.completedAt?.toISOString() ?? null,
        cost: w.costMinor
          ? { minor: w.costMinor.toString(), currency: w.currency ?? "GHS" }
          : null,
        request: {
          id: w.request.id,
          ref: w.request.ref,
          title: w.request.title,
          category: w.request.category,
          priority: w.request.priority,
          status: w.request.status,
          location: `${w.request.property.name}${w.request.unit ? ` · ${w.request.unit.label}` : ""}`,
          address: `${w.request.property.addressLine}, ${w.request.property.city}`,
        },
      })),
      meta: {},
    };
  }

  async getWorkOrder(user: AuthUser, id: string) {
    const vendorId = this.vendorIdOrThrow(user);
    const w = await this.prisma.workOrder.findFirst({
      where: { id, vendorId },
      include: {
        request: {
          select: {
            id: true,
            ref: true,
            title: true,
            description: true,
            category: true,
            priority: true,
            status: true,
            property: { select: { name: true, addressLine: true, city: true } },
            unit: { select: { label: true } },
            media: {
              where: { kind: { in: ["REPORTED", "BEFORE"] } },
              select: { documentId: true, kind: true },
            },
          },
        },
      },
    });
    if (!w) throw AppError.notFound("work order");
    return {
      id: w.id,
      ref: w.ref,
      status: w.status,
      scheduledFor: w.scheduledFor?.toISOString() ?? null,
      startedAt: w.startedAt?.toISOString() ?? null,
      completedAt: w.completedAt?.toISOString() ?? null,
      cost: w.costMinor
        ? { minor: w.costMinor.toString(), currency: w.currency ?? "GHS" }
        : null,
      completionNotes: w.completionNotes,
      request: {
        ref: w.request.ref,
        title: w.request.title,
        description: w.request.description,
        category: w.request.category,
        priority: w.request.priority,
        status: w.request.status,
        location: `${w.request.property.name}${w.request.unit ? ` · ${w.request.unit.label}` : ""}`,
        address: `${w.request.property.addressLine}, ${w.request.property.city}`,
        photos: w.request.media.map((m) => ({
          documentId: m.documentId,
          kind: m.kind,
        })),
      },
    };
  }

  async start(user: AuthUser, id: string, ctx: AuditContext) {
    const vendorId = this.vendorIdOrThrow(user);
    const w = await this.prisma.workOrder.findFirst({
      where: { id, vendorId },
      include: {
        request: { select: { id: true, status: true, propertyId: true } },
      },
    });
    if (!w) throw AppError.notFound("work order");
    if (!["DRAFT", "ISSUED"].includes(w.status)) {
      throw AppError.illegalTransition(
        `A ${w.status} work order cannot be started.`,
      );
    }
    if (w.request.status === "AWAITING_APPROVAL") {
      throw AppError.approvalRequired(
        "This job is still awaiting owner approval.",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
      if (["ASSIGNED", "SCHEDULED"].includes(w.request.status)) {
        await tx.maintenanceRequest.update({
          where: { id: w.request.id },
          data: { status: "IN_PROGRESS" },
        });
        await tx.maintenanceStatusHistory.create({
          data: {
            requestId: w.request.id,
            fromStatus: w.request.status as never,
            toStatus: "IN_PROGRESS",
            byUserId: user.userId,
            note: "Vendor started work",
          },
        });
      }
      await this.audit.record(
        {
          ...ctx,
          action: "vendor.workorder.start",
          resourceType: "work_order",
          resourceId: id,
          after: { status: "IN_PROGRESS" },
        },
        tx,
      );
    });
    return this.getWorkOrder(user, id);
  }

  async complete(
    user: AuthUser,
    id: string,
    input: CompleteWorkOrderInput,
    ctx: AuditContext,
  ) {
    const vendorId = this.vendorIdOrThrow(user);
    const w = await this.prisma.workOrder.findFirst({
      where: { id, vendorId },
      include: {
        request: {
          select: {
            id: true,
            status: true,
            propertyId: true,
            property: { select: { clientId: true } },
          },
        },
      },
    });
    if (!w) throw AppError.notFound("work order");
    if (w.status === "COMPLETED")
      throw AppError.conflict("This work order is already completed.");
    if (w.request.status === "AWAITING_APPROVAL") {
      throw AppError.approvalRequired(
        "This job is still awaiting owner approval.",
      );
    }
    const actualMinor = BigInt(input.actualCost.minor);

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          costMinor: actualMinor,
          currency: input.actualCost.currency,
          completionNotes: input.completionNotes ?? null,
          invoiceDocumentId: input.invoiceDocumentId ?? null,
        },
      });
      if (input.afterMediaDocumentIds?.length) {
        await tx.maintenanceMedia.createMany({
          data: input.afterMediaDocumentIds.map((documentId) => ({
            requestId: w.request.id,
            workOrderId: id,
            documentId,
            kind: "AFTER" as const,
            uploadedById: user.userId,
          })),
        });
      }
      await tx.maintenanceRequest.update({
        where: { id: w.request.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          actualCostMinor: actualMinor,
          costCurrency: input.actualCost.currency,
        },
      });
      await tx.maintenanceStatusHistory.create({
        data: {
          requestId: w.request.id,
          fromStatus: w.request.status as never,
          toStatus: "COMPLETED",
          byUserId: user.userId,
          note: "Vendor marked the work order complete",
        },
      });
      await this.events.emit(
        DomainEventType.MAINTENANCE_COMPLETED,
        {
          maintenanceRequestId: w.request.id,
          propertyId: w.request.propertyId,
          clientId: w.request.property.clientId,
        },
        tx,
      );
      await this.audit.record(
        {
          ...ctx,
          action: "vendor.workorder.complete",
          resourceType: "work_order",
          resourceId: id,
          after: { actualCostMinor: actualMinor.toString() },
        },
        tx,
      );
    });
    return this.getWorkOrder(user, id);
  }
}

import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  MAINTENANCE_TRANSITIONS,
  DomainEventType,
  type AuthUser,
  type MaintenanceStatus,
} from "@nexahaus/types";
import type {
  AssignVendorInput,
  CompleteWorkOrderInput,
  CreateMaintenanceInput,
  ListMaintenanceQuery,
  TransitionMaintenanceInput,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate, parseSort } from "../../common/pagination";
import { propertyInScope } from "../authz/scope.util";
import { EventsService } from "../events/events.service";
import { ApprovalsService } from "../approvals/approvals.service";

const SORTABLE = ["createdAt", "priority", "status", "ref"] as const;
const DEFAULT_THRESHOLD_MINOR = 150_000n; // GHS 1,500.00

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly approvals: ApprovalsService,
  ) {}

  // --------------------------------------------------------------------------
  // Read
  // --------------------------------------------------------------------------

  async list(user: AuthUser, query: ListMaintenanceQuery) {
    const { skip, take, page, pageSize } = pageParams(query);

    // A tenant also sees requests on the unit(s) they currently lease.
    const tenantUnitIds = user.tenantId
      ? (
          await this.prisma.leaseParty.findMany({
            where: { tenantId: user.tenantId },
            select: { lease: { select: { unitId: true } } },
          })
        ).map((p) => p.lease.unitId)
      : [];

    const scope: Prisma.MaintenanceRequestWhereInput = user.scopeExempt
      ? {}
      : {
          OR: [
            user.clientIds.length
              ? { property: { clientId: { in: user.clientIds } } }
              : { id: "" },
            user.assignedPropertyIds.length
              ? { propertyId: { in: user.assignedPropertyIds } }
              : { id: "" },
            user.tenantId ? { reportedByTenantId: user.tenantId } : { id: "" },
            tenantUnitIds.length ? { unitId: { in: tenantUnitIds } } : { id: "" },
          ],
        };

    const where: Prisma.MaintenanceRequestWhereInput = {
      AND: [
        scope,
        query.status ? { status: query.status } : {},
        query.priority ? { priority: query.priority } : {},
        query.propertyId ? { propertyId: query.propertyId } : {},
        query.openOnly
          ? { status: { notIn: ["CLOSED", "CANCELLED", "VERIFIED"] } }
          : {},
      ],
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.maintenanceRequest.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(query.sort, SORTABLE, { createdAt: "desc" }),
        include: {
          property: { select: { id: true, name: true, ref: true } },
          unit: { select: { label: true } },
        },
      }),
      this.prisma.maintenanceRequest.count({ where }),
    ]);

    return paginate(
      rows.map((r) => ({
        id: r.id,
        ref: r.ref,
        title: r.title,
        category: r.category,
        priority: r.priority,
        status: r.status,
        property: r.property,
        unit: r.unit?.label ?? null,
        estimatedCost: money(r.estimatedCostMinor, r.costCurrency),
        approvedCost: money(r.approvedCostMinor, r.costCurrency),
        actualCost: money(r.actualCostMinor, r.costCurrency),
        scheduledFor: r.scheduledFor?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(user: AuthUser, id: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, clientId: true, name: true, ref: true } },
        unit: { select: { id: true, label: true } },
        reportedByTenant: { select: { id: true, fullName: true } },
        statusHistory: { orderBy: { changedAt: "asc" } },
        workOrders: {
          orderBy: { createdAt: "desc" },
          include: { vendor: { select: { id: true, name: true, phone: true } } },
        },
        media: { orderBy: { createdAt: "asc" } },
      },
    });
    if (
      !request ||
      (!propertyInScope(user, request.property) &&
        request.reportedByTenantId !== user.tenantId)
    ) {
      throw AppError.notFound("maintenance request");
    }

    return {
      id: request.id,
      ref: request.ref,
      title: request.title,
      description: request.description,
      category: request.category,
      priority: request.priority,
      status: request.status,
      property: {
        id: request.property.id,
        name: request.property.name,
        ref: request.property.ref,
      },
      unit: request.unit,
      reportedBy: {
        type: request.reportedByType,
        tenant: request.reportedByTenant,
      },
      estimatedCost: money(request.estimatedCostMinor, request.costCurrency),
      approvedCost: money(request.approvedCostMinor, request.costCurrency),
      actualCost: money(request.actualCostMinor, request.costCurrency),
      scheduledFor: request.scheduledFor?.toISOString() ?? null,
      completedAt: request.completedAt?.toISOString() ?? null,
      verifiedAt: request.verifiedAt?.toISOString() ?? null,
      closedAt: request.closedAt?.toISOString() ?? null,
      cancellationReason: request.cancellationReason,
      timeline: request.statusHistory.map((h) => ({
        from: h.fromStatus,
        to: h.toStatus,
        note: h.note,
        at: h.changedAt.toISOString(),
        byUserId: h.byUserId,
      })),
      workOrders: request.workOrders.map((w) => ({
        id: w.id,
        ref: w.ref,
        status: w.status,
        vendor: w.vendor,
        scheduledFor: w.scheduledFor?.toISOString() ?? null,
        completedAt: w.completedAt?.toISOString() ?? null,
        cost: money(w.costMinor, w.currency),
        completionNotes: w.completionNotes,
      })),
      media: request.media.map((m) => ({
        documentId: m.documentId,
        kind: m.kind,
        caption: m.caption,
      })),
      nextStatuses: MAINTENANCE_TRANSITIONS[request.status as MaintenanceStatus],
    };
  }

  // --------------------------------------------------------------------------
  // Write
  // --------------------------------------------------------------------------

  async create(user: AuthUser, input: CreateMaintenanceInput, ctx: AuditContext) {
    const property = await this.prisma.property.findFirst({
      where: { id: input.propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property) throw AppError.notFound("property");

    const isTenant = user.roles.includes("TENANT");
    const isOwner = user.roles.includes("OWNER");

    if (isTenant) {
      const tenancy = await this.prisma.leaseParty.findFirst({
        where: {
          tenantId: user.tenantId ?? "",
          lease: { propertyId: input.propertyId, status: { in: ["ACTIVE", "EXPIRING"] } },
        },
        select: { id: true },
      });
      if (!tenancy) throw AppError.forbidden();
    } else if (!propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }

    const reportedByType = isTenant ? "TENANT" : isOwner ? "OWNER" : "STAFF";

    const request = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("maintenance", tx);
      const created = await tx.maintenanceRequest.create({
        data: {
          ref,
          propertyId: input.propertyId,
          unitId: input.unitId ?? null,
          leaseId: input.leaseId ?? null,
          reportedByType,
          reportedByUserId: isTenant ? null : user.userId,
          reportedByTenantId: isTenant ? user.tenantId : null,
          category: input.category,
          priority: input.priority,
          title: input.title,
          description: input.description,
          status: "REPORTED",
          statusHistory: { create: { toStatus: "REPORTED", byUserId: user.userId } },
          media: input.mediaDocumentIds
            ? {
                create: input.mediaDocumentIds.map((documentId) => ({
                  documentId,
                  kind: "REPORTED" as const,
                  uploadedById: user.userId,
                })),
              }
            : undefined,
        },
      });
      await this.events.emit(
        DomainEventType.MAINTENANCE_CREATED,
        {
          maintenanceRequestId: created.id,
          propertyId: input.propertyId,
          clientId: property.clientId,
          priority: input.priority,
        },
        tx,
      );
      await this.audit.record(
        {
          ...ctx,
          action: "maintenance.create",
          resourceType: "maintenance_request",
          resourceId: created.id,
          after: { ref: created.ref, priority: input.priority, reportedByType },
        },
        tx,
      );
      return created;
    });

    return this.getById(user, request.id);
  }

  async transition(
    user: AuthUser,
    id: string,
    input: TransitionMaintenanceInput,
    ctx: AuditContext,
  ) {
    const request = await this.loadInScope(user, id);
    const from = request.status as MaintenanceStatus;
    let to = input.toStatus;

    if (!MAINTENANCE_TRANSITIONS[from].includes(to)) {
      throw AppError.illegalTransition(
        `A maintenance request cannot move from ${from} to ${to}.`,
      );
    }
    if (to === "VERIFIED" && !user.permissions.includes("maintenance:verify")) {
      throw AppError.forbidden("Only a manager or inspector can verify completion.");
    }

    const estimateMinor = input.estimatedCost
      ? BigInt(input.estimatedCost.minor)
      : request.estimatedCostMinor;
    const currency = input.estimatedCost?.currency ?? request.costCurrency ?? "GHS";

    // Cost gate: entering IN_PROGRESS with an estimate over the property's
    // threshold and no prior approval → divert to AWAITING_APPROVAL.
    let approvalCreated = false;
    if (
      (to === "IN_PROGRESS" || to === "SCHEDULED") &&
      estimateMinor != null &&
      request.approvedCostMinor == null
    ) {
      const threshold = await this.thresholdFor(request.propertyId);
      if (estimateMinor > threshold) {
        to = "AWAITING_APPROVAL";
        approvalCreated = true;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: to,
          estimatedCostMinor: estimateMinor ?? undefined,
          costCurrency: currency,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
          completedAt: to === "COMPLETED" ? new Date() : undefined,
          verifiedAt: to === "VERIFIED" ? new Date() : undefined,
          verifiedByUserId: to === "VERIFIED" ? user.userId : undefined,
          closedAt: to === "CLOSED" ? new Date() : undefined,
          cancellationReason:
            to === "CANCELLED" ? (input.note ?? "Cancelled") : undefined,
        },
      });
      await tx.maintenanceStatusHistory.create({
        data: { requestId: id, fromStatus: from, toStatus: to, byUserId: user.userId, note: input.note ?? null },
      });

      if (approvalCreated) {
        await this.approvals.createInTx(tx, {
          type: "MAINTENANCE_COST",
          subjectRefType: "maintenance_request",
          subjectRefId: id,
          propertyId: request.propertyId,
          clientId: request.property.clientId,
          requestedByUserId: user.userId,
          thresholdMinor: await this.thresholdFor(request.propertyId),
          amountMinor: estimateMinor ?? undefined,
          currency,
          dueInDays: 5,
        });
      }
      if (to === "ASSIGNED" || to === "SCHEDULED") {
        await this.events.emit(
          DomainEventType.MAINTENANCE_ASSIGNED,
          { maintenanceRequestId: id, propertyId: request.propertyId },
          tx,
        );
      }
      if (to === "COMPLETED") {
        await this.events.emit(
          DomainEventType.MAINTENANCE_COMPLETED,
          {
            maintenanceRequestId: id,
            propertyId: request.propertyId,
            clientId: request.property.clientId,
          },
          tx,
        );
      }
      await this.audit.record(
        {
          ...ctx,
          action: "maintenance.transition",
          resourceType: "maintenance_request",
          resourceId: id,
          before: { status: from },
          after: { status: to, note: input.note },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }

  async assignVendor(
    user: AuthUser,
    id: string,
    input: AssignVendorInput,
    ctx: AuditContext,
  ) {
    const request = await this.loadInScope(user, id);
    if (["CLOSED", "CANCELLED", "VERIFIED", "COMPLETED"].includes(request.status)) {
      throw AppError.illegalTransition("This request is no longer open for assignment.");
    }
    if (input.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({
        where: { id: input.vendorId, deletedAt: null, status: "ACTIVE" },
        select: { id: true },
      });
      if (!vendor) throw AppError.validation("That vendor could not be found.");
    }

    const estimateMinor = input.estimatedCost
      ? BigInt(input.estimatedCost.minor)
      : request.estimatedCostMinor;
    const currency = input.estimatedCost?.currency ?? request.costCurrency ?? "GHS";
    const threshold = await this.thresholdFor(request.propertyId);
    const needsApproval =
      estimateMinor != null &&
      request.approvedCostMinor == null &&
      estimateMinor > threshold;

    const result = await this.prisma.$transaction(async (tx) => {
      const woRef = await this.refs.next("workorder", tx);
      const workOrder = await tx.workOrder.create({
        data: {
          ref: woRef,
          requestId: id,
          vendorId: input.vendorId ?? null,
          assignedUserId: input.assignedUserId ?? null,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
          status: "ISSUED",
          currency,
          createdById: user.userId,
        },
      });
      const nextStatus: MaintenanceStatus = needsApproval
        ? "AWAITING_APPROVAL"
        : input.scheduledFor
          ? "SCHEDULED"
          : "ASSIGNED";
      await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          estimatedCostMinor: estimateMinor ?? undefined,
          costCurrency: currency,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
        },
      });
      await tx.maintenanceStatusHistory.create({
        data: {
          requestId: id,
          fromStatus: request.status as MaintenanceStatus,
          toStatus: nextStatus,
          byUserId: user.userId,
          note: input.vendorId ? "Vendor assigned" : "Assigned to staff",
        },
      });
      if (needsApproval) {
        await this.approvals.createInTx(tx, {
          type: "MAINTENANCE_COST",
          subjectRefType: "maintenance_request",
          subjectRefId: id,
          propertyId: request.propertyId,
          clientId: request.property.clientId,
          requestedByUserId: user.userId,
          thresholdMinor: threshold,
          amountMinor: estimateMinor ?? undefined,
          currency,
          dueInDays: 5,
        });
      } else {
        await this.events.emit(
          DomainEventType.MAINTENANCE_ASSIGNED,
          { maintenanceRequestId: id, propertyId: request.propertyId },
          tx,
        );
      }
      await this.audit.record(
        {
          ...ctx,
          action: "maintenance.assign",
          resourceType: "maintenance_request",
          resourceId: id,
          after: {
            workOrderId: workOrder.id,
            vendorId: input.vendorId,
            status: nextStatus,
          },
        },
        tx,
      );
      return workOrder;
    });

    return this.getById(user, id);
  }

  async completeWorkOrder(
    user: AuthUser,
    id: string,
    workOrderId: string,
    input: CompleteWorkOrderInput,
    ctx: AuditContext,
  ) {
    const request = await this.loadInScope(user, id);
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, requestId: id },
    });
    if (!workOrder) throw AppError.notFound("work order");
    if (request.status === "AWAITING_APPROVAL") {
      throw AppError.approvalRequired(
        "This work is still awaiting owner approval and cannot be completed.",
      );
    }

    const actualMinor = BigInt(input.actualCost.minor);

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id: workOrderId },
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
            requestId: id,
            workOrderId,
            documentId,
            kind: "AFTER" as const,
            uploadedById: user.userId,
          })),
        });
      }
      await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          actualCostMinor: actualMinor,
          costCurrency: input.actualCost.currency,
        },
      });
      await tx.maintenanceStatusHistory.create({
        data: {
          requestId: id,
          fromStatus: request.status as MaintenanceStatus,
          toStatus: "COMPLETED",
          byUserId: user.userId,
          note: "Work order completed",
        },
      });
      await this.events.emit(
        DomainEventType.MAINTENANCE_COMPLETED,
        {
          maintenanceRequestId: id,
          propertyId: request.propertyId,
          clientId: request.property.clientId,
        },
        tx,
      );
      await this.audit.record(
        {
          ...ctx,
          action: "maintenance.complete",
          resourceType: "maintenance_request",
          resourceId: id,
          after: { workOrderId, actualCostMinor: actualMinor.toString() },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }

  async addMedia(
    user: AuthUser,
    id: string,
    documentIds: string[],
    kind: "BEFORE" | "AFTER" | "OTHER",
    ctx: AuditContext,
  ) {
    await this.loadInScope(user, id);
    await this.prisma.maintenanceMedia.createMany({
      data: documentIds.map((documentId) => ({
        requestId: id,
        documentId,
        kind,
        uploadedById: user.userId,
      })),
    });
    await this.audit.record({
      ...ctx,
      action: "maintenance.media.add",
      resourceType: "maintenance_request",
      resourceId: id,
      after: { count: documentIds.length, kind },
    });
    return this.getById(user, id);
  }

  // --------------------------------------------------------------------------

  private async loadInScope(user: AuthUser, id: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { property: { select: { id: true, clientId: true } } },
    });
    if (!request) throw AppError.notFound("maintenance request");
    const canReach =
      propertyInScope(user, request.property) ||
      (user.tenantId != null && request.reportedByTenantId === user.tenantId);
    if (!canReach) throw AppError.notFound("maintenance request");
    return request;
  }

  private async thresholdFor(propertyId: string): Promise<bigint> {
    const agreement = await this.prisma.managementAgreement.findFirst({
      where: { propertyId, status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      select: { maintenanceApprovalThresholdMinor: true },
    });
    if (agreement && agreement.maintenanceApprovalThresholdMinor > 0n) {
      return agreement.maintenanceApprovalThresholdMinor;
    }
    const setting = await this.prisma.organizationSetting.findUnique({
      where: { key: "approval.thresholds" },
    });
    const raw = (setting?.value as { maintenanceCostMinor?: string } | undefined)
      ?.maintenanceCostMinor;
    return raw ? BigInt(raw) : DEFAULT_THRESHOLD_MINOR;
  }
}

function money(minor: bigint | null, currency: string | null) {
  return minor == null
    ? null
    : { minor: minor.toString(), currency: currency ?? "GHS" };
}

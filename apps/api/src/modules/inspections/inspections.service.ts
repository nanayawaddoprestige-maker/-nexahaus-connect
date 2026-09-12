import { createHash, randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { DomainEventType, type AuthUser } from "@nexahaus/types";
import type {
  CreateInspectionInput,
  ListInspectionQuery,
  ReviewInspectionInput,
  SubmitInspectionInput,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate, parseSort } from "../../common/pagination";
import { propertyInScope } from "../authz/scope.util";
import { EventsService } from "../events/events.service";
import { StorageService } from "../storage/storage.service";
import { PdfService } from "../reports/pdf.service";

const SORTABLE = ["createdAt", "scheduledFor", "status", "ref"] as const;

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly storage: StorageService,
    private readonly pdf: PdfService,
  ) {}

  async templates() {
    const templates = await this.prisma.inspectionTemplate.findMany({
      where: { isActive: true },
      include: {
        areas: {
          orderBy: { sortOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
    return {
      __list: true as const,
      items: templates.map((t) => ({
        id: t.id,
        name: t.name,
        version: t.version,
        areas: t.areas.map((a) => ({
          name: a.name,
          items: a.items.map((i) => i.label),
        })),
      })),
      meta: {},
    };
  }

  async list(user: AuthUser, query: ListInspectionQuery) {
    const { skip, take, page, pageSize } = pageParams(query);
    const scope: Prisma.InspectionWhereInput = user.scopeExempt
      ? {}
      : {
          OR: [
            user.clientIds.length
              ? { property: { clientId: { in: user.clientIds } } }
              : { id: "" },
            user.assignedPropertyIds.length
              ? { propertyId: { in: user.assignedPropertyIds } }
              : { id: "" },
            { inspectorUserId: user.userId },
          ],
        };
    const where: Prisma.InspectionWhereInput = {
      AND: [
        scope,
        query.status ? { status: query.status } : {},
        query.type ? { type: query.type } : {},
        query.propertyId ? { propertyId: query.propertyId } : {},
        query.inspectorUserId ? { inspectorUserId: query.inspectorUserId } : {},
      ],
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.inspection.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(query.sort, SORTABLE, { createdAt: "desc" }),
        include: {
          property: { select: { id: true, name: true, ref: true } },
          inspector: { select: { id: true, fullName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.inspection.count({ where }),
    ]);

    return paginate(
      rows.map((i) => ({
        id: i.id,
        ref: i.ref,
        type: i.type,
        status: i.status,
        property: i.property,
        inspector: i.inspector,
        overallCondition: i.overallCondition,
        scheduledFor: i.scheduledFor?.toISOString() ?? null,
        completedAt: i.completedAt?.toISOString() ?? null,
        reportDocumentId: i.reportDocumentId,
        itemCount: i._count.items,
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(user: AuthUser, id: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            clientId: true,
            name: true,
            ref: true,
            addressLine: true,
            city: true,
          },
        },
        unit: { select: { id: true, label: true } },
        inspector: { select: { id: true, fullName: true } },
        template: { select: { id: true, name: true, version: true } },
        items: { orderBy: [{ area: "asc" }, { sortOrder: "asc" }] },
        media: true,
      },
    });
    if (
      !inspection ||
      (!propertyInScope(user, inspection.property) &&
        inspection.inspectorUserId !== user.userId)
    ) {
      throw AppError.notFound("inspection");
    }
    return {
      id: inspection.id,
      ref: inspection.ref,
      type: inspection.type,
      status: inspection.status,
      property: {
        id: inspection.property.id,
        name: inspection.property.name,
        ref: inspection.property.ref,
      },
      unit: inspection.unit,
      inspector: inspection.inspector,
      template: inspection.template,
      overallCondition: inspection.overallCondition,
      inspectorSignatureRef: inspection.inspectorSignatureRef,
      scheduledFor: inspection.scheduledFor?.toISOString() ?? null,
      startedAt: inspection.startedAt?.toISOString() ?? null,
      completedAt: inspection.completedAt?.toISOString() ?? null,
      reviewedAt: inspection.reviewedAt?.toISOString() ?? null,
      ownerReviewedAt: inspection.ownerReviewedAt?.toISOString() ?? null,
      reportDocumentId: inspection.reportDocumentId,
      items: inspection.items.map((it) => ({
        id: it.id,
        area: it.area,
        label: it.label,
        rating: it.rating,
        note: it.note,
        recommendation: it.recommendation,
      })),
      media: inspection.media.map((m) => ({
        documentId: m.documentId,
        inspectionItemId: m.inspectionItemId,
        caption: m.caption,
      })),
    };
  }

  async create(
    user: AuthUser,
    input: CreateInspectionInput,
    ctx: AuditContext,
  ) {
    const [property, inspector] = await Promise.all([
      this.prisma.property.findFirst({
        where: { id: input.propertyId, deletedAt: null },
        select: { id: true, clientId: true },
      }),
      this.prisma.user.findFirst({
        where: { id: input.inspectorUserId, deletedAt: null, status: "ACTIVE" },
        select: { id: true },
      }),
    ]);
    if (!property || !propertyInScope(user, property))
      throw AppError.notFound("property");
    if (!inspector)
      throw AppError.validation("That inspector could not be found.");

    const inspection = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("inspection", tx);
      const created = await tx.inspection.create({
        data: {
          ref,
          propertyId: input.propertyId,
          unitId: input.unitId ?? null,
          type: input.type,
          templateId: input.templateId ?? null,
          inspectorUserId: input.inspectorUserId,
          status: input.scheduledFor ? "SCHEDULED" : "ASSIGNED",
          scheduledFor: input.scheduledFor
            ? new Date(input.scheduledFor)
            : null,
          createdById: user.userId,
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "inspection.create",
          resourceType: "inspection",
          resourceId: created.id,
          after: {
            ref: created.ref,
            type: input.type,
            inspectorUserId: input.inspectorUserId,
          },
        },
        tx,
      );
      return created;
    });
    return this.getById(user, inspection.id);
  }

  async submit(
    user: AuthUser,
    id: string,
    input: SubmitInspectionInput,
    ctx: AuditContext,
  ) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: { property: { select: { id: true, clientId: true } } },
    });
    if (!inspection) throw AppError.notFound("inspection");
    const isInspector = inspection.inspectorUserId === user.userId;
    if (!isInspector && !user.permissions.includes("inspection:review")) {
      throw AppError.forbidden(
        "Only the assigned inspector can submit this inspection.",
      );
    }
    if (!["ASSIGNED", "SCHEDULED", "IN_PROGRESS"].includes(inspection.status)) {
      throw AppError.illegalTransition(
        `A ${inspection.status} inspection cannot be submitted.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inspectionItem.deleteMany({ where: { inspectionId: id } });
      await tx.inspectionItem.createMany({
        data: input.items.map((it, idx) => ({
          inspectionId: id,
          area: it.area,
          label: it.label,
          rating: it.rating,
          note: it.note ?? null,
          recommendation: it.recommendation ?? null,
          sortOrder: idx,
        })),
      });
      // Attach any per-item media that referenced areas by index later; for now
      // link inspection-level media passed on submit.
      for (const it of input.items) {
        if (it.mediaDocumentIds?.length) {
          const item = await tx.inspectionItem.findFirst({
            where: { inspectionId: id, area: it.area, label: it.label },
            select: { id: true },
          });
          await tx.inspectionMedia.createMany({
            data: it.mediaDocumentIds.map((documentId) => ({
              inspectionId: id,
              inspectionItemId: item?.id ?? null,
              documentId,
            })),
          });
        }
      }
      await tx.inspection.update({
        where: { id },
        data: {
          status: "COMPLETED",
          startedAt: inspection.startedAt ?? new Date(),
          completedAt: new Date(),
          overallCondition: input.overallCondition,
          inspectorSignatureRef: input.inspectorSignatureRef ?? null,
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "inspection.submit",
          resourceType: "inspection",
          resourceId: id,
          after: {
            overallCondition: input.overallCondition,
            items: input.items.length,
          },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }

  async review(
    user: AuthUser,
    id: string,
    input: ReviewInspectionInput,
    ctx: AuditContext,
  ) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            clientId: true,
            name: true,
            ref: true,
            addressLine: true,
            city: true,
          },
        },
        inspector: { select: { fullName: true } },
        items: { orderBy: [{ area: "asc" }, { sortOrder: "asc" }] },
      },
    });
    if (!inspection || !propertyInScope(user, inspection.property)) {
      throw AppError.notFound("inspection");
    }
    if (inspection.status !== "COMPLETED") {
      throw AppError.illegalTransition(
        "Only a completed inspection can be reviewed.",
      );
    }

    let reportDocumentId: string | null = null;

    if (input.issueReport) {
      const pdfBuffer = await this.pdf.inspectionReport({
        ref: inspection.ref,
        type: inspection.type,
        propertyName: inspection.property.name,
        propertyRef: inspection.property.ref,
        address: `${inspection.property.addressLine}, ${inspection.property.city}`,
        inspectorName: inspection.inspector.fullName,
        scheduledFor: inspection.scheduledFor?.toISOString() ?? null,
        completedAt: inspection.completedAt?.toISOString() ?? null,
        overallCondition: inspection.overallCondition ?? "GOOD",
        items: inspection.items.map((it) => ({
          area: it.area,
          label: it.label,
          rating: it.rating,
          note: it.note,
          recommendation: it.recommendation,
        })),
      });

      const documentId = randomUUID();
      const versionId = randomUUID();
      const key = this.storage.buildKey({
        clientId: inspection.property.clientId,
        scopeType: "INSPECTION",
        scopeId: id,
        documentId,
        versionId,
      });
      await this.storage.put(key, pdfBuffer, "application/pdf");
      const checksum = createHash("sha256").update(pdfBuffer).digest("hex");

      await this.prisma.$transaction(async (tx) => {
        await tx.document.create({
          data: {
            id: documentId,
            scopeType: "INSPECTION",
            scopeId: id,
            category: "INSPECTION_REPORT",
            title: `Inspection report ${inspection.ref}`,
            mimeType: "application/pdf",
            sizeBytes: BigInt(pdfBuffer.length),
            checksumSha256: checksum,
            storageKey: key,
            currentVersionId: versionId,
            uploadedById: user.userId,
            malwareScanStatus: "CLEAN", // server-generated
            status: "ACTIVE",
          },
        });
        await tx.documentVersion.create({
          data: {
            id: versionId,
            documentId,
            versionNo: 1,
            storageKey: key,
            sizeBytes: BigInt(pdfBuffer.length),
            checksumSha256: checksum,
            uploadedById: user.userId,
          },
        });
      });
      reportDocumentId = documentId;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inspection.update({
        where: { id },
        data: {
          status: reportDocumentId ? "REPORT_ISSUED" : "REVIEWED",
          reviewedByUserId: user.userId,
          reviewedAt: new Date(),
          reportDocumentId: reportDocumentId ?? undefined,
        },
      });
      await this.events.emit(
        DomainEventType.INSPECTION_COMPLETED,
        {
          inspectionId: id,
          propertyId: inspection.property.id,
          clientId: inspection.property.clientId,
          reportDocumentId,
        },
        tx,
      );
      await this.audit.record(
        {
          ...ctx,
          action: "inspection.review",
          resourceType: "inspection",
          resourceId: id,
          after: {
            status: reportDocumentId ? "REPORT_ISSUED" : "REVIEWED",
            reportDocumentId,
          },
        },
        tx,
      );
    });

    return this.getById(user, id);
  }
}

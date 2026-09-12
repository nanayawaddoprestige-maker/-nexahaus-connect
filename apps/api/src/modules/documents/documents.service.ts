import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import type {
  FinalizeUploadInput,
  ListDocumentQuery,
  RequestUploadInput,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate } from "../../common/pagination";
import { StorageService } from "../storage/storage.service";
import { MalwareScanner } from "../storage/malware-scanner";
import { DocumentScopeService } from "./document-scope.service";

const DEFAULT_EXPIRY_OFFSETS = [60, 30, 7];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly scanner: MalwareScanner,
    private readonly scope: DocumentScopeService,
    private readonly audit: AuditService,
  ) {}

  async requestUpload(
    user: AuthUser,
    input: RequestUploadInput,
    _ctx: AuditContext,
  ) {
    if (!(await this.scope.canAccess(user, input.scopeType, input.scopeId))) {
      throw AppError.forbidden();
    }

    const documentId = randomUUID();
    const versionId = randomUUID();
    const key = this.storage.buildKey({
      clientId: await this.resolveClientId(input.scopeType, input.scopeId),
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      documentId,
      versionId,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.document.create({
        data: {
          id: documentId,
          scopeType: input.scopeType,
          scopeId: input.scopeId,
          category: input.category,
          title: input.title,
          mimeType: input.mimeType,
          sizeBytes: BigInt(input.sizeBytes),
          checksumSha256: "",
          storageKey: key,
          uploadedById: user.userId,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          malwareScanStatus: "PENDING",
          status: "ACTIVE",
        },
      });
      await tx.documentVersion.create({
        data: {
          id: versionId,
          documentId,
          versionNo: 1,
          storageKey: key,
          sizeBytes: BigInt(input.sizeBytes),
          checksumSha256: "",
          uploadedById: user.userId,
        },
      });
    });

    const uploadUrl = await this.storage.presignUpload(key, input.mimeType);
    return { documentId, versionId, uploadUrl, storageKey: key };
  }

  async finalize(
    user: AuthUser,
    id: string,
    input: FinalizeUploadInput,
    ctx: AuditContext,
  ) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNo: "desc" }, take: 1 } },
    });
    if (!doc) throw AppError.notFound("document");
    if (!(await this.scope.canAccess(user, doc.scopeType, doc.scopeId))) {
      throw AppError.forbidden();
    }

    const head = await this.storage.head(doc.storageKey);
    if (!head.exists) {
      throw AppError.validation(
        "No uploaded file was found for this document.",
      );
    }

    const scan = await this.scanner.scan(doc.storageKey);
    const latest = doc.versions[0]!;

    await this.prisma.$transaction(async (tx) => {
      await tx.documentVersion.update({
        where: { id: latest.id },
        data: { checksumSha256: input.checksumSha256 },
      });
      await tx.document.update({
        where: { id },
        data: {
          checksumSha256: input.checksumSha256,
          currentVersionId: latest.id,
          malwareScanStatus: scan,
          status: scan === "INFECTED" ? "ARCHIVED" : "ACTIVE",
        },
      });
      if (doc.expiresAt) {
        const offsets = await this.expiryOffsets();
        for (const days of offsets) {
          const remindAt = new Date(
            doc.expiresAt.getTime() - days * 86_400_000,
          );
          if (remindAt > new Date()) {
            await tx.documentExpiryReminder.create({
              data: { documentId: id, remindAt, offsetDays: days },
            });
          }
        }
      }
      await tx.documentAccessLog.create({
        data: {
          documentId: id,
          userId: user.userId,
          action: "UPLOAD",
          ip: ctx.ip ?? null,
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "document.upload",
          resourceType: "document",
          resourceId: id,
          after: { title: doc.title, scanStatus: scan, category: doc.category },
        },
        tx,
      );
    });

    if (scan === "INFECTED") {
      throw AppError.conflict(
        "The uploaded file failed a security scan and has been quarantined.",
      );
    }
    return this.serialize(id);
  }

  async downloadUrl(user: AuthUser, id: string, ctx: AuditContext) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc || doc.status === "DELETED") throw AppError.notFound("document");
    if (!(await this.scope.canAccess(user, doc.scopeType, doc.scopeId))) {
      throw AppError.notFound("document");
    }
    if (doc.malwareScanStatus !== "CLEAN") {
      throw AppError.conflict(
        "This document is not yet available for download (pending a security scan).",
      );
    }

    await this.prisma.documentAccessLog.create({
      data: {
        documentId: id,
        userId: user.userId,
        action: "DOWNLOAD",
        ip: ctx.ip ?? null,
      },
    });
    const url = await this.storage.presignDownload(
      doc.storageKey,
      safeName(doc.title, doc.mimeType),
    );
    return {
      url,
      expiresInSeconds: undefined as number | undefined,
      title: doc.title,
    };
  }

  async list(user: AuthUser, query: ListDocumentQuery) {
    const { skip, take, page, pageSize } = pageParams(query);

    if (query.scopeType && query.scopeId) {
      if (!(await this.scope.canAccess(user, query.scopeType, query.scopeId))) {
        throw AppError.forbidden();
      }
    } else if (!user.scopeExempt) {
      throw AppError.validation("scopeType and scopeId are required.");
    }

    const where: Prisma.DocumentWhereInput = {
      status: { not: "DELETED" },
      ...(query.scopeType ? { scopeType: query.scopeType } : {}),
      ...(query.scopeId ? { scopeId: query.scopeId } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.expiringWithinDays
        ? {
            expiresAt: {
              not: null,
              lte: new Date(Date.now() + query.expiringWithinDays * 86_400_000),
              gte: new Date(),
            },
          }
        : {}),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { versions: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    return paginate(
      rows.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        scopeType: d.scopeType,
        scopeId: d.scopeId,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes.toString(),
        version: d._count.versions,
        expiresAt: d.expiresAt?.toISOString() ?? null,
        scanStatus: d.malwareScanStatus,
        downloadable: d.malwareScanStatus === "CLEAN",
        uploadedById: d.uploadedById,
        createdAt: d.createdAt.toISOString(),
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async accessLog(user: AuthUser, id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw AppError.notFound("document");
    if (
      !user.scopeExempt &&
      !(await this.scope.canAccess(user, doc.scopeType, doc.scopeId))
    ) {
      throw AppError.notFound("document");
    }
    const rows = await this.prisma.documentAccessLog.findMany({
      where: { documentId: id },
      orderBy: { at: "desc" },
      take: 100,
      include: { document: false },
    });
    const userIds = [...new Set(rows.map((r) => r.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true },
    });
    const nameById = new Map(users.map((u) => [u.id, u.fullName]));
    return {
      __list: true as const,
      items: rows.map((r) => ({
        action: r.action,
        at: r.at.toISOString(),
        user: nameById.get(r.userId) ?? "Unknown",
        ip: r.ip,
      })),
      meta: {},
    };
  }

  private async serialize(id: string) {
    const d = await this.prisma.document.findUniqueOrThrow({
      where: { id },
      include: { versions: { orderBy: { versionNo: "asc" } } },
    });
    return {
      id: d.id,
      title: d.title,
      category: d.category,
      scopeType: d.scopeType,
      scopeId: d.scopeId,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes.toString(),
      checksumSha256: d.checksumSha256,
      expiresAt: d.expiresAt?.toISOString() ?? null,
      scanStatus: d.malwareScanStatus,
      downloadable: d.malwareScanStatus === "CLEAN",
      versions: d.versions.map((v) => ({
        versionNo: v.versionNo,
        sizeBytes: v.sizeBytes.toString(),
        checksumSha256: v.checksumSha256,
        createdAt: v.createdAt.toISOString(),
      })),
      createdAt: d.createdAt.toISOString(),
    };
  }

  private async resolveClientId(
    scopeType: string,
    scopeId: string,
  ): Promise<string | null> {
    try {
      if (scopeType === "CLIENT") return scopeId;
      if (scopeType === "PROPERTY") {
        const p = await this.prisma.property.findUnique({
          where: { id: scopeId },
          select: { clientId: true },
        });
        return p?.clientId ?? null;
      }
      if (scopeType === "LEASE") {
        const l = await this.prisma.lease.findUnique({
          where: { id: scopeId },
          select: { clientId: true },
        });
        return l?.clientId ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async expiryOffsets(): Promise<number[]> {
    const setting = await this.prisma.organizationSetting.findUnique({
      where: { key: "document.expiryReminderOffsetsDays" },
    });
    const value = setting?.value as unknown;
    if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
      return value;
    }
    return DEFAULT_EXPIRY_OFFSETS;
  }
}

function safeName(title: string, mime: string): string {
  const ext =
    {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }[mime] ?? "bin";
  return `${title.replace(/[^\w.-]+/g, "_").slice(0, 80)}.${ext}`;
}

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AppConfig } from "@nexahaus/config";
import type { AuthUser } from "@nexahaus/types";
import type {
  CreateTenantInput,
  ListTenantQuery,
  UpdateTenantInput,
} from "@nexahaus/validation";
import { APP_CONFIG } from "../../config/config.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate, parseSort } from "../../common/pagination";

const SORTABLE = ["createdAt", "fullName", "ref", "status"] as const;

/**
 * Tenant records hold sensitive personal data. A tenant is visible only to staff
 * in scope and to the owner of a property the tenant currently leases — never to
 * other owners or other tenants (docs/SECURITY.md §3). The ID-document reference
 * is encrypted at rest and never returned in full.
 */
@Injectable()
export class TenantsService {
  private readonly key: Buffer;

  constructor(
    @Inject(APP_CONFIG) config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
  ) {
    this.key = createHash("sha256").update(config.auth.accessSecret).digest();
  }

  private scopeWhere(user: AuthUser): Prisma.TenantWhereInput {
    if (user.scopeExempt) return { deletedAt: null };
    return {
      deletedAt: null,
      leaseParties: {
        some: {
          lease: {
            OR: [
              user.clientIds.length ? { clientId: { in: user.clientIds } } : { id: "" },
              user.assignedPropertyIds.length
                ? { propertyId: { in: user.assignedPropertyIds } }
                : { id: "" },
            ],
          },
        },
      },
    };
  }

  private async assertInScope(user: AuthUser, tenantId: string): Promise<void> {
    if (user.scopeExempt) return;
    const visible = await this.prisma.tenant.findFirst({
      where: { AND: [{ id: tenantId }, this.scopeWhere(user)] },
      select: { id: true },
    });
    if (!visible) throw AppError.notFound("tenant");
  }

  async list(user: AuthUser, query: ListTenantQuery) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.TenantWhereInput = {
      AND: [
        this.scopeWhere(user),
        query.status ? { status: query.status } : {},
        query.propertyId
          ? { leaseParties: { some: { lease: { propertyId: query.propertyId } } } }
          : {},
        query.q
          ? {
              OR: [
                { fullName: { contains: query.q, mode: "insensitive" } },
                { ref: { contains: query.q, mode: "insensitive" } },
                { phone: { contains: query.q } },
              ],
            }
          : {},
      ],
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(query.sort, SORTABLE, { createdAt: "desc" }),
        select: {
          id: true,
          ref: true,
          fullName: true,
          phone: true,
          email: true,
          status: true,
          leaseParties: {
            where: { lease: { status: "ACTIVE" } },
            select: {
              lease: {
                select: {
                  id: true,
                  ref: true,
                  propertyId: true,
                  property: { select: { name: true } },
                  unit: { select: { label: true } },
                },
              },
            },
            take: 1,
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginate(
      rows.map((t) => {
        const lease = t.leaseParties[0]?.lease;
        return {
          id: t.id,
          ref: t.ref,
          fullName: t.fullName,
          phone: t.phone,
          email: t.email,
          status: t.status,
          currentTenancy: lease
            ? {
                leaseId: lease.id,
                leaseRef: lease.ref,
                propertyId: lease.propertyId,
                property: lease.property.name,
                unit: lease.unit.label,
              }
            : null,
        };
      }),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(user: AuthUser, id: string) {
    await this.assertInScope(user, id);
    const tenant = await this.prisma.tenant.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: {
        leaseParties: {
          select: {
            isPrimary: true,
            lease: {
              select: {
                id: true,
                ref: true,
                status: true,
                startDate: true,
                endDate: true,
                rentMinor: true,
                rentCurrency: true,
                property: { select: { id: true, name: true, ref: true } },
                unit: { select: { label: true } },
              },
            },
          },
        },
      },
    });

    return {
      id: tenant.id,
      ref: tenant.ref,
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
      emergencyContactName: tenant.emergencyContactName,
      emergencyContactPhone: tenant.emergencyContactPhone,
      idDocumentType: tenant.idDocumentType,
      idDocumentOnFile: tenant.idDocumentRefEnc !== null,
      status: tenant.status,
      tenancies: tenant.leaseParties.map((p) => ({
        isPrimary: p.isPrimary,
        leaseId: p.lease.id,
        leaseRef: p.lease.ref,
        status: p.lease.status,
        startDate: p.lease.startDate.toISOString(),
        endDate: p.lease.endDate.toISOString(),
        rent: { minor: p.lease.rentMinor.toString(), currency: p.lease.rentCurrency },
        property: p.lease.property,
        unit: p.lease.unit.label,
      })),
      createdAt: tenant.createdAt.toISOString(),
    };
  }

  async create(user: AuthUser, input: CreateTenantInput, ctx: AuditContext) {
    const tenant = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("tenant", tx);
      const created = await tx.tenant.create({
        data: {
          ref,
          fullName: input.fullName,
          phone: input.phone,
          email: input.email ?? null,
          emergencyContactName: input.emergencyContactName ?? null,
          emergencyContactPhone: input.emergencyContactPhone ?? null,
          idDocumentType: input.idDocumentType ?? null,
          idDocumentRefEnc: input.idDocumentRef
            ? this.encrypt(input.idDocumentRef)
            : null,
          status: "PROSPECTIVE",
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "tenant.create",
          resourceType: "tenant",
          resourceId: created.id,
          after: { ref: created.ref, fullName: created.fullName },
        },
        tx,
      );
      return created;
    });
    return this.getById(user, tenant.id);
  }

  async update(
    user: AuthUser,
    id: string,
    input: UpdateTenantInput,
    ctx: AuditContext,
  ) {
    await this.assertInScope(user, id);
    const existing = await this.prisma.tenant.findFirstOrThrow({
      where: { id, deletedAt: null },
    });
    await this.prisma.tenant.update({
      where: { id },
      data: {
        fullName: input.fullName ?? undefined,
        phone: input.phone ?? undefined,
        email: input.email ?? undefined,
        emergencyContactName: input.emergencyContactName ?? undefined,
        emergencyContactPhone: input.emergencyContactPhone ?? undefined,
        idDocumentType: input.idDocumentType ?? undefined,
        status: input.status ?? undefined,
        idDocumentRefEnc: input.idDocumentRef
          ? this.encrypt(input.idDocumentRef)
          : undefined,
      },
    });
    await this.audit.record({
      ...ctx,
      action: "tenant.update",
      resourceType: "tenant",
      resourceId: id,
      before: { fullName: existing.fullName, status: existing.status },
      after: { fullName: input.fullName ?? existing.fullName },
    });
    return this.getById(user, id);
  }

  // AES-256-GCM at rest for the ID-document reference. Phase 10 moves the key to
  // a KMS; the stored format (iv:tag:ciphertext, base64) stays the same.
  private encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
  }

  /** Reserved for authorised reveal flows (audited); not used by list/detail. */
  decrypt(stored: string): string {
    const [ivB64, tagB64, dataB64] = stored.split(":");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(ivB64!, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64!, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64!, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }
}

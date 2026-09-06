import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import type { CreateVendorInput } from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate, parseSort } from "../../common/pagination";

const SORTABLE = ["createdAt", "name", "ref", "rating", "status"] as const;

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    page?: number;
    pageSize?: number;
    sort?: string;
    status?: string;
    category?: string;
    q?: string;
  }) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.VendorWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as Prisma.EnumVendorStatusFilter["equals"] } : {}),
      ...(query.category ? { categories: { has: query.category } } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { ref: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(query.sort, SORTABLE, { name: "asc" }),
        include: {
          _count: { select: { workOrders: true, propertyAssignments: true } },
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);
    return paginate(
      rows.map((v) => ({
        id: v.id,
        ref: v.ref,
        name: v.name,
        type: v.type,
        categories: v.categories,
        phone: v.phone,
        email: v.email,
        region: v.region,
        rating: v.rating ? Number(v.rating) : null,
        status: v.status,
        insuranceExpiryAt: v.insuranceExpiryAt?.toISOString() ?? null,
        workOrderCount: v._count.workOrders,
        propertyCount: v._count.propertyAssignments,
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, deletedAt: null },
      include: {
        propertyAssignments: {
          include: { property: { select: { id: true, name: true, ref: true } } },
        },
        workOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            ref: true,
            status: true,
            scheduledFor: true,
            costMinor: true,
            currency: true,
          },
        },
      },
    });
    if (!vendor) throw AppError.notFound("vendor");
    return {
      id: vendor.id,
      ref: vendor.ref,
      name: vendor.name,
      type: vendor.type,
      categories: vendor.categories,
      phone: vendor.phone,
      email: vendor.email,
      region: vendor.region,
      servicesDescription: vendor.servicesDescription,
      rating: vendor.rating ? Number(vendor.rating) : null,
      status: vendor.status,
      insuranceExpiryAt: vendor.insuranceExpiryAt?.toISOString() ?? null,
      assignedProperties: vendor.propertyAssignments.map((a) => a.property),
      recentWorkOrders: vendor.workOrders.map((w) => ({
        id: w.id,
        ref: w.ref,
        status: w.status,
        scheduledFor: w.scheduledFor?.toISOString() ?? null,
        cost: w.costMinor
          ? { minor: w.costMinor.toString(), currency: w.currency ?? "GHS" }
          : null,
      })),
    };
  }

  async create(user: AuthUser, input: CreateVendorInput, ctx: AuditContext) {
    const vendor = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("vendor", tx);
      const created = await tx.vendor.create({
        data: {
          ref,
          name: input.name,
          type: input.type,
          categories: input.categories,
          phone: input.phone,
          email: input.email ?? null,
          region: input.region ?? null,
          servicesDescription: input.servicesDescription ?? null,
          insuranceExpiryAt: input.insuranceExpiryAt
            ? new Date(input.insuranceExpiryAt)
            : null,
          status: "ACTIVE",
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "vendor.create",
          resourceType: "vendor",
          resourceId: created.id,
          after: { ref: created.ref, name: created.name },
        },
        tx,
      );
      return created;
    });
    return this.getById(vendor.id);
  }

  async update(
    id: string,
    input: Partial<CreateVendorInput> & { status?: string },
    ctx: AuditContext,
  ) {
    const existing = await this.prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound("vendor");
    await this.prisma.vendor.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        type: input.type ?? undefined,
        categories: input.categories ?? undefined,
        phone: input.phone ?? undefined,
        email: input.email ?? undefined,
        region: input.region ?? undefined,
        servicesDescription: input.servicesDescription ?? undefined,
        status: (input.status as never) ?? undefined,
        insuranceExpiryAt: input.insuranceExpiryAt
          ? new Date(input.insuranceExpiryAt)
          : undefined,
      },
    });
    await this.audit.record({
      ...ctx,
      action: "vendor.update",
      resourceType: "vendor",
      resourceId: id,
      before: { name: existing.name, status: existing.status },
      after: { name: input.name ?? existing.name, status: input.status ?? existing.status },
    });
    return this.getById(id);
  }

  async assignToProperty(
    id: string,
    propertyId: string,
    ctx: AuditContext,
  ) {
    const [vendor, property] = await Promise.all([
      this.prisma.vendor.findFirst({ where: { id, deletedAt: null }, select: { id: true } }),
      this.prisma.property.findFirst({
        where: { id: propertyId, deletedAt: null },
        select: { id: true },
      }),
    ]);
    if (!vendor || !property) throw AppError.notFound("vendor or property");
    await this.prisma.vendorPropertyAssignment.upsert({
      where: { vendorId_propertyId: { vendorId: id, propertyId } },
      create: { vendorId: id, propertyId, addedById: ctx.actorUserId ?? null },
      update: {},
    });
    await this.audit.record({
      ...ctx,
      action: "vendor.assign",
      resourceType: "vendor",
      resourceId: id,
      after: { propertyId },
    });
    return { assigned: true };
  }
}

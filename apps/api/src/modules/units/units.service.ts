import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import type { CreateUnitInput } from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { propertyInScope } from "../authz/scope.util";

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
  ) {}

  private async loadProperty(user: AuthUser, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!property || !propertyInScope(user, property)) {
      throw AppError.notFound("property");
    }
    return property;
  }

  async listForProperty(user: AuthUser, propertyId: string) {
    await this.loadProperty(user, propertyId);
    const [units, buildings] = await Promise.all([
      this.prisma.unit.findMany({
        where: { propertyId, deletedAt: null },
        orderBy: { label: "asc" },
        include: {
          building: { select: { id: true, name: true } },
          floor: { select: { id: true, label: true, level: true } },
          leases: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              ref: true,
              rentMinor: true,
              rentCurrency: true,
              endDate: true,
              parties: {
                where: { isPrimary: true },
                select: { tenant: { select: { id: true, fullName: true } } },
              },
            },
          },
        },
      }),
      this.prisma.building.findMany({
        where: { propertyId },
        include: { floors: { orderBy: { level: "asc" } } },
      }),
    ]);

    return {
      __list: true as const,
      items: units.map((u) => {
        const lease = u.leases[0];
        return {
          id: u.id,
          ref: u.ref,
          label: u.label,
          status: u.status,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          floorAreaSqm: u.floorAreaSqm ? Number(u.floorAreaSqm) : null,
          building: u.building,
          floor: u.floor,
          marketRent: u.marketRentMinor
            ? {
                minor: u.marketRentMinor.toString(),
                currency: u.marketRentCurrency ?? "GHS",
              }
            : null,
          activeLease: lease
            ? {
                id: lease.id,
                ref: lease.ref,
                rent: {
                  minor: lease.rentMinor.toString(),
                  currency: lease.rentCurrency,
                },
                endDate: lease.endDate.toISOString(),
                tenant: lease.parties[0]?.tenant ?? null,
              }
            : null,
        };
      }),
      meta: {
        buildings: buildings.map((b) => ({
          id: b.id,
          name: b.name,
          floors: b.floors.map((f) => ({
            id: f.id,
            label: f.label,
            level: f.level,
          })),
        })),
      },
    };
  }

  async getById(user: AuthUser, id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: {
          select: { id: true, clientId: true, name: true, ref: true },
        },
      },
    });
    if (!unit || !propertyInScope(user, unit.property)) {
      throw AppError.notFound("unit");
    }
    return {
      id: unit.id,
      ref: unit.ref,
      label: unit.label,
      status: unit.status,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      floorAreaSqm: unit.floorAreaSqm ? Number(unit.floorAreaSqm) : null,
      marketRent: unit.marketRentMinor
        ? {
            minor: unit.marketRentMinor.toString(),
            currency: unit.marketRentCurrency ?? "GHS",
          }
        : null,
      property: unit.property,
    };
  }

  async create(
    user: AuthUser,
    propertyId: string,
    input: CreateUnitInput,
    ctx: AuditContext,
  ) {
    await this.loadProperty(user, propertyId);

    const unit = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("unit", tx);
      const created = await tx.unit.create({
        data: {
          propertyId,
          buildingId: input.buildingId ?? null,
          floorId: input.floorId ?? null,
          ref,
          label: input.label,
          bedrooms: input.bedrooms ?? null,
          bathrooms: input.bathrooms ?? null,
          floorAreaSqm: input.floorAreaSqm ?? null,
          marketRentMinor: input.marketRent
            ? BigInt(input.marketRent.minor)
            : null,
          marketRentCurrency: input.marketRent?.currency ?? null,
          status: input.status,
        },
      });
      await tx.property.update({
        where: { id: propertyId },
        data: { unitCount: { increment: 1 } },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "unit.create",
          resourceType: "unit",
          resourceId: created.id,
          after: { ref: created.ref, label: created.label, propertyId },
        },
        tx,
      );
      return created;
    });
    return this.getById(user, unit.id);
  }

  async update(
    user: AuthUser,
    id: string,
    input: Partial<CreateUnitInput>,
    ctx: AuditContext,
  ) {
    const existing = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: { property: { select: { id: true, clientId: true } } },
    });
    if (!existing || !propertyInScope(user, existing.property)) {
      throw AppError.notFound("unit");
    }

    const data: Prisma.UnitUpdateInput = {
      label: input.label ?? undefined,
      bedrooms: input.bedrooms ?? undefined,
      bathrooms: input.bathrooms ?? undefined,
      floorAreaSqm: input.floorAreaSqm ?? undefined,
      status: input.status ?? undefined,
      marketRentMinor: input.marketRent
        ? BigInt(input.marketRent.minor)
        : undefined,
      marketRentCurrency: input.marketRent?.currency ?? undefined,
    };
    await this.prisma.unit.update({ where: { id }, data });
    await this.audit.record({
      ...ctx,
      action: "unit.update",
      resourceType: "unit",
      resourceId: id,
      before: { label: existing.label, status: existing.status },
      after: {
        label: input.label ?? existing.label,
        status: input.status ?? existing.status,
      },
    });
    return this.getById(user, id);
  }

  async createBuilding(
    user: AuthUser,
    propertyId: string,
    input: { name: string; floors?: { level: number; label: string }[] },
    ctx: AuditContext,
  ) {
    await this.loadProperty(user, propertyId);
    const building = await this.prisma.building.create({
      data: {
        propertyId,
        name: input.name,
        floorsCount: input.floors?.length ?? null,
        floors: input.floors
          ? {
              create: input.floors.map((f) => ({
                level: f.level,
                label: f.label,
              })),
            }
          : undefined,
      },
      include: { floors: true },
    });
    await this.audit.record({
      ...ctx,
      action: "building.create",
      resourceType: "property",
      resourceId: propertyId,
      after: { buildingId: building.id, name: building.name },
    });
    return building;
  }
}

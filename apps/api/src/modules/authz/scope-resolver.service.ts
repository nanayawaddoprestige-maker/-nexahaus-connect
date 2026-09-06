import { Injectable } from "@nestjs/common";
import type { ScopedResourceMeta } from "../../common/decorators";
import { PrismaService } from "../../prisma/prisma.service";

export interface ResourceOwner {
  /** Managing owner-client of the resource, if any. */
  clientId: string | null;
  /** Property the resource belongs to, if any (for staff assignment checks). */
  propertyId: string | null;
  /** Tenant the resource belongs to, if any (for tenant self-service). */
  tenantId: string | null;
}

/**
 * Maps a resource id to its owning client / property / tenant. Used by the
 * ResourceScopeGuard. Returns null when the resource does not exist so the guard
 * can respond identically to "not yours".
 */
@Injectable()
export class ScopeResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    type: ScopedResourceMeta["type"],
    id: string,
  ): Promise<ResourceOwner | null> {
    switch (type) {
      case "client": {
        const row = await this.prisma.client.findFirst({
          where: { id, deletedAt: null },
          select: { id: true },
        });
        return row ? { clientId: row.id, propertyId: null, tenantId: null } : null;
      }
      case "property": {
        const row = await this.prisma.property.findFirst({
          where: { id, deletedAt: null },
          select: { id: true, clientId: true },
        });
        return row
          ? { clientId: row.clientId, propertyId: row.id, tenantId: null }
          : null;
      }
      case "unit": {
        const row = await this.prisma.unit.findFirst({
          where: { id, deletedAt: null },
          select: { propertyId: true, property: { select: { clientId: true } } },
        });
        return row
          ? {
              clientId: row.property.clientId,
              propertyId: row.propertyId,
              tenantId: null,
            }
          : null;
      }
      case "lease": {
        const row = await this.prisma.lease.findUnique({
          where: { id },
          select: {
            clientId: true,
            propertyId: true,
            parties: { select: { tenantId: true }, take: 1 },
          },
        });
        return row
          ? {
              clientId: row.clientId,
              propertyId: row.propertyId,
              tenantId: row.parties[0]?.tenantId ?? null,
            }
          : null;
      }
      case "tenant": {
        const row = await this.prisma.tenant.findFirst({
          where: { id, deletedAt: null },
          select: {
            id: true,
            leaseParties: {
              select: { lease: { select: { clientId: true, propertyId: true } } },
              take: 1,
            },
          },
        });
        if (!row) return null;
        const lease = row.leaseParties[0]?.lease;
        return {
          clientId: lease?.clientId ?? null,
          propertyId: lease?.propertyId ?? null,
          tenantId: row.id,
        };
      }
      case "maintenance": {
        const row = await this.prisma.maintenanceRequest.findUnique({
          where: { id },
          select: {
            propertyId: true,
            reportedByTenantId: true,
            property: { select: { clientId: true } },
          },
        });
        return row
          ? {
              clientId: row.property.clientId,
              propertyId: row.propertyId,
              tenantId: row.reportedByTenantId,
            }
          : null;
      }
      case "inspection": {
        const row = await this.prisma.inspection.findUnique({
          where: { id },
          select: {
            propertyId: true,
            property: { select: { clientId: true } },
          },
        });
        return row
          ? {
              clientId: row.property.clientId,
              propertyId: row.propertyId,
              tenantId: null,
            }
          : null;
      }
      default:
        return null;
    }
  }
}

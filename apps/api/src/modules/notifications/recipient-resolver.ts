import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Resolves the human recipients for a domain event. A notification about a
 * property goes to that property's owner-client users and its assigned staff;
 * one about a tenancy also reaches the tenant's login user where they have one.
 */
@Injectable()
export class RecipientResolver {
  constructor(private readonly prisma: PrismaService) {}

  async clientUsers(clientId: string, onlyApprovers = false): Promise<string[]> {
    const rows = await this.prisma.clientUser.findMany({
      where: {
        clientId,
        acceptedAt: { not: null },
        ...(onlyApprovers ? { canApprove: true } : {}),
      },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async assignedStaff(propertyId: string): Promise<string[]> {
    const rows = await this.prisma.propertyAssignment.findMany({
      where: {
        propertyId,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async tenantUser(tenantId: string | null | undefined): Promise<string[]> {
    if (!tenantId) return [];
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { userId: true },
    });
    return tenant?.userId ? [tenant.userId] : [];
  }

  async financeOfficers(): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { role: { key: "FINANCE_OFFICER" } },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async propertyClientId(propertyId: string): Promise<string | null> {
    const p = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { clientId: true },
    });
    return p?.clientId ?? null;
  }
}

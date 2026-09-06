import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";

/**
 * Tenant self-service. Every method is bound to the caller's own `tenantId`
 * (resolved by AuthGuard from Tenant.userId) and returns ONLY tenancy-scoped
 * data. No owner-level figure — management fee, net owner income, owner
 * statements, other tenants, other units — is ever exposed here
 * (docs/SECURITY.md §3, spec §41).
 */
@Injectable()
export class TenantPortalService {
  constructor(private readonly prisma: PrismaService) {}

  private tenantIdOrThrow(user: AuthUser): string {
    if (!user.tenantId) throw AppError.forbidden("No tenancy is linked to this account.");
    return user.tenantId;
  }

  async me(user: AuthUser) {
    const tenantId = this.tenantIdOrThrow(user);
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        id: true,
        ref: true,
        fullName: true,
        phone: true,
        email: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        status: true,
        leaseParties: {
          where: { lease: { status: { in: ["ACTIVE", "EXPIRING"] } } },
          select: {
            isPrimary: true,
            lease: {
              select: {
                id: true,
                ref: true,
                unitId: true,
                startDate: true,
                endDate: true,
                rentMinor: true,
                rentCurrency: true,
                frequency: true,
                status: true,
                property: { select: { id: true, name: true, addressLine: true, city: true, region: true } },
                unit: { select: { label: true } },
              },
            },
          },
        },
      },
    });

    const current = tenant.leaseParties[0]?.lease ?? null;
    return {
      id: tenant.id,
      ref: tenant.ref,
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
      emergencyContactName: tenant.emergencyContactName,
      emergencyContactPhone: tenant.emergencyContactPhone,
      status: tenant.status,
      currentTenancy: current
        ? {
            leaseId: current.id,
            leaseRef: current.ref,
            propertyId: current.property.id,
            unitId: current.unitId,
            propertyName: current.property.name,
            address: `${current.property.addressLine}, ${current.property.city}`,
            unit: current.unit.label,
            startDate: current.startDate.toISOString(),
            endDate: current.endDate.toISOString(),
            rent: { minor: current.rentMinor.toString(), currency: current.rentCurrency },
            frequency: current.frequency,
            status: current.status,
          }
        : null,
    };
  }

  async lease(user: AuthUser) {
    const tenantId = this.tenantIdOrThrow(user);
    const party = await this.prisma.leaseParty.findFirst({
      where: { tenantId, lease: { status: { in: ["ACTIVE", "EXPIRING"] } } },
      include: {
        lease: {
          include: {
            property: { select: { name: true, addressLine: true, city: true, region: true } },
            unit: { select: { label: true, bedrooms: true, bathrooms: true } },
            parties: {
              select: { isPrimary: true, tenant: { select: { fullName: true } } },
            },
          },
        },
      },
    });
    if (!party) throw AppError.notFound("lease");
    const l = party.lease;
    return {
      id: l.id,
      ref: l.ref,
      status: l.status,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      rent: { minor: l.rentMinor.toString(), currency: l.rentCurrency },
      frequency: l.frequency,
      deposit: l.depositMinor
        ? { minor: l.depositMinor.toString(), currency: l.depositCurrency ?? "GHS" }
        : null,
      noticePeriodDays: l.noticePeriodDays,
      renewalStatus: l.renewalStatus,
      documentId: l.documentId,
      property: {
        name: l.property.name,
        address: `${l.property.addressLine}, ${l.property.city}, ${l.property.region}`,
      },
      unit: l.unit,
      coTenants: l.parties
        .filter((p) => p.tenant.fullName)
        .map((p) => ({ name: p.tenant.fullName, isPrimary: p.isPrimary })),
    };
  }

  async rent(user: AuthUser) {
    const tenantId = this.tenantIdOrThrow(user);
    const leaseIds = (
      await this.prisma.leaseParty.findMany({
        where: { tenantId },
        select: { leaseId: true },
      })
    ).map((p) => p.leaseId);
    if (leaseIds.length === 0) return { currency: "GHS", charges: [], summary: emptySummary() };

    const charges = await this.prisma.rentCharge.findMany({
      where: { leaseId: { in: leaseIds } },
      orderBy: { periodStart: "desc" },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        dueDate: true,
        amountMinor: true,
        currency: true,
        paidMinor: true,
        status: true,
      },
    });

    const billed = charges.reduce((s, c) => s + c.amountMinor, 0n);
    const paid = charges.reduce((s, c) => s + c.paidMinor, 0n);
    const paymentInfo = await this.prisma.organizationSetting.findUnique({
      where: { key: "tenant.paymentInstructions" },
    });

    return {
      currency: charges[0]?.currency ?? "GHS",
      charges: charges.map((c) => ({
        id: c.id,
        period: `${c.periodStart.toISOString().slice(0, 10)} – ${c.periodEnd.toISOString().slice(0, 10)}`,
        dueDate: c.dueDate.toISOString(),
        amount: { minor: c.amountMinor.toString(), currency: c.currency },
        paidMinor: c.paidMinor.toString(),
        outstandingMinor: (c.amountMinor - c.paidMinor).toString(),
        status: c.status,
      })),
      summary: {
        billedMinor: billed.toString(),
        paidMinor: paid.toString(),
        outstandingMinor: (billed - paid).toString(),
      },
      paymentInstructions:
        (paymentInfo?.value as { text?: string } | undefined)?.text ??
        "Pay via the Mobile Money or bank details your NexaHaus property manager has provided, quoting your lease reference. Payments are confirmed by NexaHaus once received.",
    };
  }

  async payments(user: AuthUser) {
    const tenantId = this.tenantIdOrThrow(user);
    const rows = await this.prisma.payment.findMany({
      where: { tenantId },
      orderBy: { receivedAt: "desc" },
      select: {
        id: true,
        ref: true,
        amountMinor: true,
        currency: true,
        method: true,
        status: true,
        receivedAt: true,
        providerRef: true,
      },
    });
    return {
      __list: true as const,
      items: rows.map((p) => ({
        id: p.id,
        ref: p.ref,
        amount: { minor: p.amountMinor.toString(), currency: p.currency },
        method: p.method,
        status: p.status,
        receivedAt: p.receivedAt.toISOString(),
        reference: p.providerRef,
      })),
      meta: {},
    };
  }

  async documents(user: AuthUser) {
    const tenantId = this.tenantIdOrThrow(user);
    const leaseIds = (
      await this.prisma.leaseParty.findMany({ where: { tenantId }, select: { leaseId: true } })
    ).map((p) => p.leaseId);

    const docs = await this.prisma.document.findMany({
      where: {
        status: { not: "DELETED" },
        malwareScanStatus: "CLEAN",
        OR: [
          { scopeType: "TENANT", scopeId: tenantId },
          { scopeType: "LEASE", scopeId: { in: leaseIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, category: true, mimeType: true, createdAt: true },
    });
    return {
      __list: true as const,
      items: docs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        mimeType: d.mimeType,
        createdAt: d.createdAt.toISOString(),
      })),
      meta: {},
    };
  }
}

function emptySummary() {
  return { billedMinor: "0", paidMinor: "0", outstandingMinor: "0" };
}

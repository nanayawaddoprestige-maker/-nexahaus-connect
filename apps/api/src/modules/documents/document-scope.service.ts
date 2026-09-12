import { Injectable } from "@nestjs/common";
import type { DocumentScopeType } from "@prisma/client";
import type { AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { ScopeResolverService } from "../authz/scope-resolver.service";
import { clientInScope } from "../authz/scope.util";

/**
 * Decides whether a caller may see documents attached to a given scope object.
 * A document inherits the access rules of the thing it hangs off — a property
 * document is visible to that property's owner and assigned staff, a compliance
 * document only to staff, and so on (docs/SECURITY.md §4).
 */
@Injectable()
export class DocumentScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: ScopeResolverService,
  ) {}

  async canAccess(
    user: AuthUser,
    scopeType: DocumentScopeType,
    scopeId: string,
  ): Promise<boolean> {
    if (user.scopeExempt) return true;

    switch (scopeType) {
      case "PROPERTY":
      case "UNIT":
      case "LEASE":
      case "TENANT":
      case "MAINTENANCE_REQUEST":
      case "INSPECTION": {
        const map: Record<
          string,
          Parameters<ScopeResolverService["resolve"]>[0]
        > = {
          PROPERTY: "property",
          UNIT: "unit",
          LEASE: "lease",
          TENANT: "tenant",
          MAINTENANCE_REQUEST: "maintenance",
          INSPECTION: "inspection",
        };
        const owner = await this.resolver.resolve(map[scopeType]!, scopeId);
        if (!owner) return false;
        return (
          (owner.clientId !== null &&
            user.clientIds.includes(owner.clientId)) ||
          (owner.propertyId !== null &&
            user.assignedPropertyIds.includes(owner.propertyId)) ||
          (owner.tenantId !== null && owner.tenantId === user.tenantId)
        );
      }
      case "CLIENT":
        return clientInScope(user, scopeId);
      case "EXPENSE": {
        const expense = await this.prisma.expense.findUnique({
          where: { id: scopeId },
          select: { property: { select: { id: true, clientId: true } } },
        });
        if (!expense) return false;
        return (
          user.clientIds.includes(expense.property.clientId) ||
          user.assignedPropertyIds.includes(expense.property.id)
        );
      }
      case "STATEMENT": {
        const statement = await this.prisma.statement.findUnique({
          where: { id: scopeId },
          select: { clientId: true },
        });
        return statement ? user.clientIds.includes(statement.clientId) : false;
      }
      case "WORK_ORDER": {
        const wo = await this.prisma.workOrder.findUnique({
          where: { id: scopeId },
          select: {
            request: {
              select: { property: { select: { id: true, clientId: true } } },
            },
          },
        });
        if (!wo) return false;
        return (
          user.clientIds.includes(wo.request.property.clientId) ||
          user.assignedPropertyIds.includes(wo.request.property.id)
        );
      }
      case "VENDOR":
      case "COMPLIANCE":
      case "USER":
      default:
        // Staff-only scopes: only reachable by a scope-exempt user (handled
        // above) or explicit future grants. Owners/tenants never see these.
        return false;
    }
  }
}

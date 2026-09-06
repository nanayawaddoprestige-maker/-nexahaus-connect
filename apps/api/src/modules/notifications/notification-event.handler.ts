import { Injectable, Logger } from "@nestjs/common";
import { DomainEventType } from "@nexahaus/types";
import { NotificationsService } from "./notifications.service";
import { RecipientResolver } from "./recipient-resolver";

interface DomainEventRow {
  id: string;
  type: string;
  payload: unknown;
}

/**
 * Maps a domain event to notifications for the right people (spec §22, §29).
 * Kept declarative: one case per event type, each resolving recipients then
 * calling NotificationsService. Unknown event types are a no-op.
 */
@Injectable()
export class NotificationEventHandler {
  private readonly logger = new Logger(NotificationEventHandler.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly recipients: RecipientResolver,
  ) {}

  async handle(event: DomainEventRow): Promise<void> {
    const p = (event.payload ?? {}) as Record<string, unknown>;
    const propertyId = str(p.propertyId);
    const clientId = str(p.clientId) ?? (propertyId ? await this.recipients.propertyClientId(propertyId) : null);

    switch (event.type) {
      case DomainEventType.APPROVAL_REQUIRED: {
        if (!clientId) return;
        const approvers = await this.recipients.clientUsers(clientId, true);
        const fallback = approvers.length ? approvers : await this.recipients.clientUsers(clientId);
        await this.notifications.notifyMany(fallback, {
          type: "APPROVAL_REQUIRED",
          title: "Approval needed",
          body: "NexaHaus needs your decision before proceeding with a cost on your property.",
          data: { approvalId: p.approvalId },
          sourceEventId: event.id,
          channels: ["EMAIL", "SMS"],
        });
        break;
      }
      case DomainEventType.APPROVAL_COMPLETED: {
        if (!clientId) return;
        const staff = propertyId ? await this.recipients.assignedStaff(propertyId) : [];
        await this.notifications.notifyMany(staff, {
          type: "APPROVAL_COMPLETED",
          title: `Approval ${String(p.decision ?? "decided").toLowerCase()}`,
          body: "The owner has responded to an approval request.",
          data: { approvalId: p.approvalId, decision: p.decision },
          sourceEventId: event.id,
        });
        break;
      }
      case DomainEventType.MAINTENANCE_CREATED: {
        if (!propertyId) return;
        await this.notifications.notifyMany(
          await this.recipients.assignedStaff(propertyId),
          {
            type: "MAINTENANCE_CREATED",
            title: "New maintenance request",
            body: "A maintenance issue has been reported on a property you manage.",
            data: { maintenanceRequestId: p.maintenanceRequestId, priority: p.priority },
            sourceEventId: event.id,
          },
        );
        break;
      }
      case DomainEventType.MAINTENANCE_ASSIGNED: {
        if (!clientId) return;
        await this.notifications.notifyMany(await this.recipients.clientUsers(clientId), {
          type: "MAINTENANCE_ASSIGNED",
          title: "Maintenance scheduled",
          body: "A maintenance request on your property has been assigned and scheduled.",
          data: { maintenanceRequestId: p.maintenanceRequestId },
          sourceEventId: event.id,
        });
        break;
      }
      case DomainEventType.MAINTENANCE_COMPLETED: {
        const recips = [
          ...(clientId ? await this.recipients.clientUsers(clientId) : []),
          ...(await this.recipients.tenantUser(str(p.reportedByTenantId))),
        ];
        await this.notifications.notifyMany(recips, {
          type: "MAINTENANCE_COMPLETED",
          title: "Maintenance completed",
          body: "Work on a maintenance request has been completed. The report and photos are available.",
          data: { maintenanceRequestId: p.maintenanceRequestId },
          sourceEventId: event.id,
        });
        break;
      }
      case DomainEventType.PAYMENT_RECEIVED:
      case DomainEventType.RENT_RECEIVED: {
        if (event.type === DomainEventType.RENT_RECEIVED || !clientId) return; // dedupe: act on PAYMENT_RECEIVED only
        await this.notifications.notifyMany(await this.recipients.clientUsers(clientId), {
          type: "RENT_RECEIVED",
          title: "Rent received",
          body: "A rent payment has been recorded against your property.",
          data: { paymentId: p.paymentId, amountMinor: p.amountMinor, currency: p.currency },
          sourceEventId: event.id,
        });
        break;
      }
      case DomainEventType.RENT_OVERDUE: {
        if (!clientId) return;
        await this.notifications.notifyMany(
          [
            ...(await this.recipients.clientUsers(clientId)),
            ...(propertyId ? await this.recipients.assignedStaff(propertyId) : []),
          ],
          {
            type: "RENT_OVERDUE",
            title: "Rent overdue",
            body: "A rent charge on your property is now overdue.",
            data: { rentChargeId: p.rentChargeId },
            sourceEventId: event.id,
          },
        );
        break;
      }
      case DomainEventType.INSPECTION_COMPLETED: {
        if (!clientId) return;
        await this.notifications.notifyMany(await this.recipients.clientUsers(clientId), {
          type: "INSPECTION_COMPLETED",
          title: "Inspection report ready",
          body: "An inspection on your property is complete and the report is available.",
          data: { inspectionId: p.inspectionId, reportDocumentId: p.reportDocumentId },
          sourceEventId: event.id,
        });
        break;
      }
      case DomainEventType.STATEMENT_GENERATED: {
        if (!clientId) return;
        await this.notifications.notifyMany(await this.recipients.clientUsers(clientId), {
          type: "STATEMENT_GENERATED",
          title: "New owner statement",
          body: "Your latest owner statement is available to view and download.",
          data: { statementId: p.statementId, netAmountMinor: p.netAmountMinor },
          sourceEventId: event.id,
          channels: ["EMAIL"],
        });
        break;
      }
      case DomainEventType.DOCUMENT_EXPIRING: {
        const recips = [
          ...(clientId ? await this.recipients.clientUsers(clientId) : []),
          ...(propertyId ? await this.recipients.assignedStaff(propertyId) : []),
        ];
        await this.notifications.notifyMany(recips, {
          type: "DOCUMENT_EXPIRING",
          title: "Document expiring soon",
          body: `A document is due to expire${p.inDays ? ` in ${String(p.inDays)} days` : ""}.`,
          data: { documentId: p.documentId, expiresAt: p.expiresAt },
          sourceEventId: event.id,
        });
        break;
      }
      case DomainEventType.LEASE_EXPIRING: {
        const recips = [
          ...(clientId ? await this.recipients.clientUsers(clientId) : []),
          ...(propertyId ? await this.recipients.assignedStaff(propertyId) : []),
        ];
        await this.notifications.notifyMany(recips, {
          type: "LEASE_EXPIRING",
          title: "Lease expiring soon",
          body: `A lease on your property expires${p.inDays ? ` in ${String(p.inDays)} days` : " soon"}.`,
          data: { leaseId: p.leaseId },
          sourceEventId: event.id,
        });
        break;
      }
      case DomainEventType.HEALTH_SCORE_UPDATED: {
        if (!clientId) return;
        await this.notifications.notifyMany(await this.recipients.clientUsers(clientId), {
          type: "HEALTH_SCORE_UPDATED",
          title: "Property Health Score updated",
          body: `Your property's health score is now ${String(p.score ?? "")}/100.`,
          data: { propertyId, score: p.score },
          sourceEventId: event.id,
        });
        break;
      }
      case DomainEventType.MESSAGE_RECEIVED: {
        const recips = (p.recipientUserIds as string[] | undefined) ?? [];
        await this.notifications.notifyMany(recips, {
          type: "MESSAGE_RECEIVED",
          title: "New message",
          body: str(p.preview) ?? "You have a new message from NexaHaus.",
          data: { threadId: p.threadId },
          sourceEventId: event.id,
        });
        break;
      }
      default:
        this.logger.debug(`No notification mapping for ${event.type}`);
    }
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

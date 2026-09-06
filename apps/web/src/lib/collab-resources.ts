export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  type: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface ThreadRow {
  id: string;
  type: string;
  title: string;
  status: string;
  client: { id: string; displayName: string } | null;
  property: { id: string; name: string } | null;
  participantCount: number;
  messageCount: number;
  lastMessage: { preview: string; at: string; fromMe: boolean } | null;
  unread: number;
  lastMessageAt: string;
}

export interface ThreadDetail {
  id: string;
  type: string;
  title: string;
  status: string;
  client: { id: string; displayName: string } | null;
  property: { id: string; name: string; ref: string } | null;
  subject: { type: string; id: string } | null;
  participants: { userId: string; name: string; role: string }[];
  messages: {
    id: string;
    body: string;
    sender: { id: string; fullName: string };
    fromMe: boolean;
    attachments: string[];
    createdAt: string;
    editedAt: string | null;
  }[];
}

/** Human labels for notification types. */
export const NOTIFICATION_LABELS: Record<string, string> = {
  APPROVAL_REQUIRED: "Approval needed",
  APPROVAL_COMPLETED: "Approval decided",
  MAINTENANCE_CREATED: "Maintenance reported",
  MAINTENANCE_ASSIGNED: "Maintenance scheduled",
  MAINTENANCE_COMPLETED: "Maintenance completed",
  RENT_RECEIVED: "Rent received",
  RENT_OVERDUE: "Rent overdue",
  INSPECTION_COMPLETED: "Inspection report ready",
  STATEMENT_GENERATED: "New owner statement",
  DOCUMENT_EXPIRING: "Document expiring",
  LEASE_EXPIRING: "Lease expiring",
  HEALTH_SCORE_UPDATED: "Health score updated",
  MESSAGE_RECEIVED: "New message",
};

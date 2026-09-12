import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { DomainEventType, type AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate } from "../../common/pagination";
import { EventsService } from "../events/events.service";
import { propertyInScope, clientInScope } from "../authz/scope.util";

export interface CreateThreadInput {
  type: "OWNER_NEXAHAUS" | "TENANT_NEXAHAUS" | "INTERNAL" | "MAINTENANCE";
  title: string;
  clientId?: string;
  propertyId?: string;
  subjectRefType?: string;
  subjectRefId?: string;
  participantUserIds?: string[];
  firstMessage: string;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  private async assertParticipant(user: AuthUser, threadId: string) {
    const participant = await this.prisma.threadParticipant.findUnique({
      where: { threadId_userId: { threadId, userId: user.userId } },
    });
    if (!participant && !user.scopeExempt) throw AppError.notFound("thread");
    return participant;
  }

  async listThreads(
    user: AuthUser,
    query: { page?: number; pageSize?: number; type?: string; status?: string },
  ) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.MessageThreadWhereInput = {
      ...(user.scopeExempt
        ? {}
        : { participants: { some: { userId: user.userId } } }),
      ...(query.type ? { type: query.type as never } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.messageThread.findMany({
        where,
        skip,
        take,
        orderBy: { lastMessageAt: "desc" },
        include: {
          client: { select: { id: true, displayName: true } },
          property: { select: { id: true, name: true } },
          participants: {
            where: { userId: user.userId },
            select: { lastReadAt: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, senderUserId: true },
          },
          _count: { select: { messages: true, participants: true } },
        },
      }),
      this.prisma.messageThread.count({ where }),
    ]);

    return paginate(
      await Promise.all(
        rows.map(async (t) => {
          const lastReadAt = t.participants[0]?.lastReadAt ?? null;
          const unread = await this.prisma.message.count({
            where: {
              threadId: t.id,
              senderUserId: { not: user.userId },
              ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
            },
          });
          const last = t.messages[0];
          return {
            id: t.id,
            type: t.type,
            title: t.title,
            status: t.status,
            client: t.client,
            property: t.property,
            participantCount: t._count.participants,
            messageCount: t._count.messages,
            lastMessage: last
              ? {
                  preview: last.body.slice(0, 140),
                  at: last.createdAt.toISOString(),
                  fromMe: last.senderUserId === user.userId,
                }
              : null,
            unread,
            lastMessageAt: t.lastMessageAt.toISOString(),
          };
        }),
      ),
      totalItems,
      page,
      pageSize,
    );
  }

  async getThread(user: AuthUser, id: string) {
    await this.assertParticipant(user, id);
    const thread = await this.prisma.messageThread.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, displayName: true } },
        property: { select: { id: true, name: true, ref: true } },
        participants: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, fullName: true } },
            attachments: { select: { documentId: true } },
          },
        },
      },
    });
    if (!thread) throw AppError.notFound("thread");
    return {
      id: thread.id,
      type: thread.type,
      title: thread.title,
      status: thread.status,
      client: thread.client,
      property: thread.property,
      subject:
        thread.subjectRefType && thread.subjectRefId
          ? { type: thread.subjectRefType, id: thread.subjectRefId }
          : null,
      participants: thread.participants.map((p) => ({
        userId: p.userId,
        name: p.user.fullName,
        role: p.role,
      })),
      messages: thread.messages.map((m) => ({
        id: m.id,
        body: m.body,
        sender: m.sender,
        fromMe: m.senderUserId === user.userId,
        attachments: m.attachments.map((a) => a.documentId),
        createdAt: m.createdAt.toISOString(),
        editedAt: m.editedAt?.toISOString() ?? null,
      })),
    };
  }

  async createThread(
    user: AuthUser,
    input: CreateThreadInput,
    ctx: AuditContext,
  ) {
    // Scope check on the thread's subject.
    if (input.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: input.propertyId, deletedAt: null },
        select: { id: true, clientId: true },
      });
      if (
        !property ||
        (!user.scopeExempt && !propertyInScope(user, property))
      ) {
        throw AppError.notFound("property");
      }
      input.clientId = input.clientId ?? property.clientId;
    } else if (
      input.clientId &&
      !user.scopeExempt &&
      !clientInScope(user, input.clientId)
    ) {
      throw AppError.notFound("client");
    }

    // Resolve participants: the creator, any explicit ids the creator may add,
    // plus the NexaHaus staff assigned to the property for owner-facing threads.
    const participants = new Set<string>([user.userId]);
    const isStaff = user.roles.some((r) =>
      [
        "SUPER_ADMIN",
        "MANAGING_DIRECTOR",
        "PROPERTY_MANAGER",
        "FINANCE_OFFICER",
        "MAINTENANCE_OFFICER",
        "INSPECTOR",
        "LEASING_OFFICER",
        "SUPPORT_STAFF",
      ].includes(r),
    );

    if (input.propertyId) {
      const assigned = await this.prisma.propertyAssignment.findMany({
        where: {
          propertyId: input.propertyId,
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        select: { userId: true },
      });
      assigned.forEach((a) => participants.add(a.userId));
    }
    if (isStaff && input.participantUserIds) {
      // Staff may add specific users; validate they exist and are active.
      const valid = await this.prisma.user.findMany({
        where: {
          id: { in: input.participantUserIds },
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });
      valid.forEach((u) => participants.add(u.id));
    }
    if (input.clientId) {
      const clientUsers = await this.prisma.clientUser.findMany({
        where: { clientId: input.clientId, acceptedAt: { not: null } },
        select: { userId: true },
      });
      // Only auto-add owner users for owner-facing threads.
      if (input.type === "OWNER_NEXAHAUS") {
        clientUsers.forEach((c) => participants.add(c.userId));
      }
    }

    const thread = await this.prisma.$transaction(async (tx) => {
      const created = await tx.messageThread.create({
        data: {
          type: input.type,
          title: input.title,
          clientId: input.clientId ?? null,
          propertyId: input.propertyId ?? null,
          subjectRefType: input.subjectRefType ?? null,
          subjectRefId: input.subjectRefId ?? null,
          createdById: user.userId,
          lastMessageAt: new Date(),
          participants: {
            create: [...participants].map((userId) => ({
              userId,
              role:
                userId === user.userId
                  ? isStaff
                    ? "NEXAHAUS_SIDE"
                    : "OWNER_SIDE"
                  : "MEMBER",
              lastReadAt: userId === user.userId ? new Date() : null,
            })),
          },
          messages: {
            create: { senderUserId: user.userId, body: input.firstMessage },
          },
        },
      });
      await this.events.emit(
        DomainEventType.MESSAGE_RECEIVED,
        {
          threadId: created.id,
          recipientUserIds: [...participants].filter(
            (id) => id !== user.userId,
          ),
          preview: input.firstMessage.slice(0, 140),
        },
        tx,
      );
      await this.audit.record(
        {
          ...ctx,
          action: "message.thread.create",
          resourceType: "message_thread",
          resourceId: created.id,
          after: { type: input.type, participants: participants.size },
        },
        tx,
      );
      return created;
    });

    return this.getThread(user, thread.id);
  }

  async postMessage(
    user: AuthUser,
    threadId: string,
    body: string,
    attachmentDocumentIds: string[] | undefined,
    _ctx: AuditContext,
  ) {
    const participant = await this.assertParticipant(user, threadId);
    if (!participant && user.scopeExempt) {
      // A scope-exempt user posting into a thread joins it.
      await this.prisma.threadParticipant.create({
        data: {
          threadId,
          userId: user.userId,
          role: "NEXAHAUS_SIDE",
          lastReadAt: new Date(),
        },
      });
    }

    const others = await this.prisma.threadParticipant.findMany({
      where: { threadId, userId: { not: user.userId } },
      select: { userId: true },
    });

    await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          threadId,
          senderUserId: user.userId,
          body,
          attachments: attachmentDocumentIds?.length
            ? {
                create: attachmentDocumentIds.map((documentId) => ({
                  documentId,
                })),
              }
            : undefined,
        },
      });
      await tx.messageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: message.createdAt },
      });
      await tx.threadParticipant.update({
        where: { threadId_userId: { threadId, userId: user.userId } },
        data: { lastReadAt: new Date() },
      });
      await this.events.emit(
        DomainEventType.MESSAGE_RECEIVED,
        {
          threadId,
          recipientUserIds: others.map((o) => o.userId),
          preview: body.slice(0, 140),
        },
        tx,
      );
    });

    return this.getThread(user, threadId);
  }

  async markRead(user: AuthUser, threadId: string): Promise<{ read: true }> {
    await this.assertParticipant(user, threadId);
    await this.prisma.threadParticipant.updateMany({
      where: { threadId, userId: user.userId },
      data: { lastReadAt: new Date() },
    });
    return { read: true };
  }
}

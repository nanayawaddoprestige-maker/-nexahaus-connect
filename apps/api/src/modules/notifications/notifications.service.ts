import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { NotificationChannel, type AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import {
  EmailAdapter,
  PushAdapter,
  SmsAdapter,
  WhatsAppAdapter,
} from "./channels/channel-adapter";

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sourceEventId?: string;
  /** Channels to consider beyond in-app; filtered by the user's preferences. */
  channels?: (keyof typeof NotificationChannel)[];
}

const DEFAULT_PREFS: Record<string, boolean> = {
  inApp: true,
  email: true,
  sms: false,
  whatsapp: false,
  push: false,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailAdapter,
    private readonly sms: SmsAdapter,
    private readonly whatsapp: WhatsAppAdapter,
    private readonly push: PushAdapter,
  ) {}

  /**
   * In-app notification is always written. Other channels are dispatched only
   * when the user's NotificationPreference for that type enables them
   * (falling back to sensible defaults). Best-effort — a channel failure is
   * logged, never thrown, so one bad address can't block the others.
   */
  async notify(input: NotifyInput): Promise<void> {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId_type: { userId: input.userId, type: input.type } },
    });
    const enabled = {
      inApp: pref?.inApp ?? DEFAULT_PREFS.inApp,
      email: pref?.email ?? DEFAULT_PREFS.email,
      sms: pref?.sms ?? DEFAULT_PREFS.sms,
      whatsapp: pref?.whatsapp ?? DEFAULT_PREFS.whatsapp,
      push: pref?.push ?? DEFAULT_PREFS.push,
    };

    // The in-app feed IS the Notification table: a user who turns off in-app
    // delivery for a type stops seeing those rows in their feed.
    if (enabled.inApp) {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: (input.data ?? {}) as Prisma.InputJsonValue,
          channels: [NotificationChannel.IN_APP],
          sourceEventId: input.sourceEventId ?? null,
        },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, phone: true },
    });
    if (!user) return;

    const wants = new Set(input.channels ?? ["EMAIL"]);

    if (enabled.email && user.email && wants.has("EMAIL")) {
      await this.safe("email", () =>
        this.email.send({
          to: user.email!,
          subject: input.title,
          body: input.body,
          data: input.data,
        }),
      );
    }
    if (enabled.sms && user.phone && wants.has("SMS")) {
      await this.safe("sms", () =>
        this.sms.send({
          to: user.phone!,
          body: `${input.title}: ${input.body}`,
        }),
      );
    }
    if (enabled.whatsapp && user.phone && wants.has("WHATSAPP")) {
      await this.safe("whatsapp", () =>
        this.whatsapp.send({
          to: user.phone!,
          body: `${input.title}: ${input.body}`,
        }),
      );
    }
    if (enabled.push && wants.has("PUSH")) {
      await this.safe("push", () =>
        this.push.send({
          to: input.userId,
          subject: input.title,
          body: input.body,
          data: input.data,
        }),
      );
    }
  }

  async notifyMany(
    userIds: string[],
    base: Omit<NotifyInput, "userId">,
  ): Promise<void> {
    await Promise.all(
      [...new Set(userIds)].map((userId) => this.notify({ ...base, userId })),
    );
  }

  // --------------------------------------------------------------------------
  // Feed + preferences API
  // --------------------------------------------------------------------------

  async feed(user: AuthUser, cursor: string | undefined, limit = 25) {
    const rows = await this.prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const unread = await this.prisma.notification.count({
      where: { userId: user.userId, readAt: null },
    });
    return {
      __list: true as const,
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        read: n.readAt !== null,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: {
        nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
        unread,
      },
    };
  }

  async markRead(user: AuthUser, id: string): Promise<{ read: true }> {
    const res = await this.prisma.notification.updateMany({
      where: { id, userId: user.userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (res.count === 0) {
      const exists = await this.prisma.notification.findFirst({
        where: { id, userId: user.userId },
        select: { id: true },
      });
      if (!exists) throw AppError.notFound("notification");
    }
    return { read: true };
  }

  async markAllRead(user: AuthUser): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId: user.userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: res.count };
  }

  async getPreferences(user: AuthUser) {
    const rows = await this.prisma.notificationPreference.findMany({
      where: { userId: user.userId },
    });
    return {
      __list: true as const,
      items: rows.map((r) => ({
        type: r.type,
        inApp: r.inApp,
        email: r.email,
        sms: r.sms,
        whatsapp: r.whatsapp,
        push: r.push,
      })),
      meta: { defaults: DEFAULT_PREFS },
    };
  }

  async setPreference(
    user: AuthUser,
    type: string,
    prefs: Partial<{
      inApp: boolean;
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      push: boolean;
    }>,
  ) {
    const saved = await this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId: user.userId, type } },
      create: {
        userId: user.userId,
        type,
        inApp: prefs.inApp ?? DEFAULT_PREFS.inApp,
        email: prefs.email ?? DEFAULT_PREFS.email,
        sms: prefs.sms ?? DEFAULT_PREFS.sms,
        whatsapp: prefs.whatsapp ?? DEFAULT_PREFS.whatsapp,
        push: prefs.push ?? DEFAULT_PREFS.push,
      },
      update: prefs,
    });
    return {
      type: saved.type,
      inApp: saved.inApp,
      email: saved.email,
      sms: saved.sms,
      whatsapp: saved.whatsapp,
      push: saved.push,
    };
  }

  private async safe(channel: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.warn(
        { err, channel },
        "Notification channel dispatch failed",
      );
    }
  }
}

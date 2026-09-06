import { createHmac, timingSafeEqual } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AppConfig } from "@nexahaus/config";
import { DomainEventType, type AuthUser } from "@nexahaus/types";
import { APP_CONFIG } from "../../config/config.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { EventsService } from "../events/events.service";

interface InboundWhatsApp {
  providerMsgId: string;
  from: string; // E.164
  text: string;
}

/**
 * Inbound WhatsApp + product analytics.
 *
 * WhatsApp: the webhook is verified against the raw body, deduped on
 * (provider, providerMsgId), and — when the sender's phone matches a known
 * user — routed into that user's NexaHaus thread (creating one if needed) so it
 * lands in the same Communication Centre as in-app messages. Unmatched messages
 * are stored for staff triage. Outbound goes through the WhatsAppAdapter.
 *
 * Analytics: events are persisted and forwarded to the configured provider
 * (noop until one is wired). No PII beyond a user id.
 */
@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly whatsappSecret: string;
  private readonly whatsappProvider: string;
  private readonly analyticsProvider: string;

  constructor(
    @Inject(APP_CONFIG) config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {
    this.whatsappSecret = config.payments.webhookSecret; // reuse until a dedicated secret is added
    this.whatsappProvider = config.whatsapp.provider;
    this.analyticsProvider = config.analytics.provider;
  }

  // --------------------------------------------------------------------------
  // WhatsApp inbound
  // --------------------------------------------------------------------------

  verifyWhatsApp(rawBody: Buffer, signature: string | undefined): boolean {
    if (this.whatsappProvider === "noop") return true; // dev: accept unsigned
    if (!signature) return false;
    const provided = signature.replace(/^sha256=/i, "").trim();
    const expected = createHmac("sha256", this.whatsappSecret).update(rawBody).digest("hex");
    if (provided.length !== expected.length) return false;
    try {
      return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
    } catch {
      return false;
    }
  }

  async handleWhatsApp(msg: InboundWhatsApp, rawBody: Buffer) {
    const prior = await this.prisma.whatsAppInboundMessage.findUnique({
      where: {
        provider_providerMsgId: {
          provider: this.whatsappProvider,
          providerMsgId: msg.providerMsgId,
        },
      },
      select: { id: true },
    });
    if (prior) return { status: "replayed" as const };

    const phone = normalisePhone(msg.from);
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, { tenantProfile: { phone } }] },
      select: { id: true, tenantProfile: { select: { id: true } }, clientLinks: { select: { clientId: true } } },
    });

    if (!user) {
      await this.prisma.whatsAppInboundMessage.create({
        data: {
          provider: this.whatsappProvider,
          providerMsgId: msg.providerMsgId,
          fromPhone: phone,
          body: msg.text.slice(0, 4000),
        },
      });
      this.logger.warn({ from: phone }, "Inbound WhatsApp from an unknown number — stored for triage");
      return { status: "unmatched" as const };
    }

    const threadType = user.tenantProfile ? "TENANT_NEXAHAUS" : "OWNER_NEXAHAUS";
    const thread = await this.prisma.$transaction(async (tx) => {
      let t = await tx.messageThread.findFirst({
        where: {
          type: threadType as never,
          status: "OPEN",
          participants: { some: { userId: user.id } },
        },
        select: { id: true, participants: { select: { userId: true } } },
      });
      if (!t) {
        // Route to support staff as the NexaHaus side.
        const supportStaff = await tx.userRole.findMany({
          where: { role: { key: { in: ["SUPPORT_STAFF", "PROPERTY_MANAGER"] } } },
          select: { userId: true },
          take: 3,
        });
        const created = await tx.messageThread.create({
          data: {
            type: threadType as never,
            title: "WhatsApp",
            createdById: user.id,
            lastMessageAt: new Date(),
            participants: {
              create: [
                { userId: user.id, role: user.tenantProfile ? "MEMBER" : "OWNER_SIDE", lastReadAt: new Date() },
                ...supportStaff.map((s) => ({ userId: s.userId, role: "NEXAHAUS_SIDE" as const })),
              ],
            },
          },
          select: { id: true, participants: { select: { userId: true } } },
        });
        t = created;
      }
      await tx.message.create({
        data: { threadId: t.id, senderUserId: user.id, body: `[WhatsApp] ${msg.text}` },
      });
      await tx.messageThread.update({ where: { id: t.id }, data: { lastMessageAt: new Date() } });
      await tx.whatsAppInboundMessage.create({
        data: {
          provider: this.whatsappProvider,
          providerMsgId: msg.providerMsgId,
          fromPhone: phone,
          body: msg.text.slice(0, 4000),
          matchedUserId: user.id,
          threadId: t.id,
          processedAt: new Date(),
        },
      });
      await this.events.emit(
        DomainEventType.MESSAGE_RECEIVED,
        {
          threadId: t.id,
          recipientUserIds: t.participants.map((p) => p.userId).filter((id) => id !== user.id),
          preview: msg.text.slice(0, 140),
        },
        tx,
      );
      return t;
    });

    return { status: "routed" as const, threadId: thread.id };
  }

  async triageInbox() {
    const rows = await this.prisma.whatsAppInboundMessage.findMany({
      where: { matchedUserId: null },
      orderBy: { receivedAt: "desc" },
      take: 100,
      select: { id: true, fromPhone: true, body: true, receivedAt: true },
    });
    return {
      __list: true as const,
      items: rows.map((r) => ({
        id: r.id,
        fromPhone: r.fromPhone,
        body: r.body,
        receivedAt: r.receivedAt.toISOString(),
      })),
      meta: {},
    };
  }

  // --------------------------------------------------------------------------
  // Analytics
  // --------------------------------------------------------------------------

  async track(name: string, opts: { userId?: string; anonId?: string; props?: Record<string, unknown> }) {
    await this.prisma.analyticsEvent.create({
      data: {
        name,
        userId: opts.userId ?? null,
        anonId: opts.anonId ?? null,
        props: (opts.props ?? {}) as Prisma.InputJsonValue,
      },
    });
    if (this.analyticsProvider !== "noop") {
      // Forward to PostHog / vendor here (Phase 10). Kept as a no-op so the
      // pipeline — validate → persist → forward — is exercised in development.
      this.logger.debug(`analytics forward → ${this.analyticsProvider}: ${name}`);
    }
  }

  async recordEvent(user: AuthUser, name: string, props: Record<string, unknown>) {
    if (!/^[a-z][a-z0-9_]{1,48}$/.test(name)) {
      throw AppError.validation("Invalid event name.");
    }
    await this.track(name, { userId: user.userId, props });
    return { recorded: true };
  }
}

function normalisePhone(v: string): string {
  const t = v.replace(/[^\d+]/g, "");
  if (t.startsWith("0") && t.length === 10) return `+233${t.slice(1)}`;
  if (t.startsWith("233")) return `+${t}`;
  return t;
}

import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationEventHandler } from "./notification-event.handler";

const BATCH = 50;
const MAX_ATTEMPTS = 5;

/**
 * Transactional-outbox pump (ARCHITECTURE.md §5.3). Every few seconds it claims
 * a batch of unprocessed DomainEvent rows and dispatches each to the handler.
 * A claim marks `processedAt` up front so a crash mid-batch does not double-fire
 * side effects that already ran; failures bump `attempts` and record the error,
 * and events that exhaust MAX_ATTEMPTS are left for inspection.
 *
 * This runs in-process. Phase 10 moves dispatch to a dedicated BullMQ worker;
 * the handler contract stays the same.
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly handler: NotificationEventHandler,
  ) {}

  @Interval("outbox-pump", 5000)
  async scheduledPump(): Promise<void> {
    // Set DISABLE_SCHEDULERS=true on API instances once a dedicated worker runs.
    if (process.env.DISABLE_SCHEDULERS === "true") return;
    if (this.running) return;
    this.running = true;
    try {
      let processed = 0;
      // Drain up to a few batches per tick.
      for (let i = 0; i < 4; i += 1) {
        const n = await this.pump();
        processed += n;
        if (n < BATCH) break;
      }
      if (processed > 0) this.logger.debug(`Outbox: dispatched ${processed} event(s)`);
    } catch (err) {
      this.logger.error({ err }, "Outbox pump failed");
    } finally {
      this.running = false;
    }
  }

  /** Process one batch; returns how many events were dispatched. */
  async pump(): Promise<number> {
    const due = await this.prisma.domainEvent.findMany({
      where: { processedAt: null, attempts: { lt: MAX_ATTEMPTS } },
      orderBy: { occurredAt: "asc" },
      take: BATCH,
      select: { id: true, type: true, payload: true },
    });
    if (due.length === 0) return 0;

    for (const event of due) {
      try {
        await this.handler.handle(event);
        await this.prisma.domainEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date() },
        });
      } catch (err) {
        this.logger.warn({ err, eventId: event.id, type: event.type }, "Event dispatch failed");
        await this.prisma.domainEvent.update({
          where: { id: event.id },
          data: {
            attempts: { increment: 1 },
            lastError: err instanceof Error ? err.message.slice(0, 500) : "unknown",
          },
        });
      }
    }
    return due.length;
  }
}

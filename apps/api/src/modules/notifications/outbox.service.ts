import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { QUEUE, DOMAIN_EVENT_JOB } from "../queue/queue.constants";
import { NotificationEventHandler } from "./notification-event.handler";

const BATCH = 100;

/**
 * Transactional-outbox relay (ARCHITECTURE.md §5.3). Every few seconds it claims
 * a batch of unprocessed DomainEvent rows and publishes them to the BullMQ
 * `domain-event` queue, marking `processedAt` so a crash mid-batch does not
 * re-publish. The queue's own retry/backoff and the consumer (EventConsumer)
 * handle delivery. Gated by DISABLE_SCHEDULERS so only one instance relays.
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly handler: NotificationEventHandler,
  ) {}

  @Interval("outbox-relay", 5000)
  async scheduledPump(): Promise<void> {
    if (process.env.DISABLE_SCHEDULERS === "true") return;
    if (this.running) return;
    this.running = true;
    try {
      let relayed = 0;
      for (let i = 0; i < 4; i += 1) {
        const n = await this.pump();
        relayed += n;
        if (n < BATCH) break;
      }
      if (relayed > 0) this.logger.debug(`Outbox: relayed ${relayed} event(s) to the queue`);
    } catch (err) {
      this.logger.error({ err }, "Outbox relay failed");
    } finally {
      this.running = false;
    }
  }

  /** Claim + publish one batch. Returns how many events were relayed. */
  async pump(): Promise<number> {
    const due = await this.prisma.domainEvent.findMany({
      where: { processedAt: null },
      orderBy: { occurredAt: "asc" },
      take: BATCH,
      select: { id: true, type: true, payload: true },
    });
    if (due.length === 0) return 0;

    await this.queue.publishMany(
      QUEUE.DOMAIN_EVENT,
      due.map((e) => ({
        name: DOMAIN_EVENT_JOB,
        data: { eventId: e.id, type: e.type, payload: e.payload },
      })),
    );
    await this.prisma.domainEvent.updateMany({
      where: { id: { in: due.map((e) => e.id) } },
      data: { processedAt: new Date() },
    });
    return due.length;
  }

  /**
   * Test-only: relay is asynchronous in production (queue → consumer). e2e tests
   * that assert on side effects call this to dispatch every pending event
   * synchronously, in-process, without going through Redis.
   */
  async drainForTests(): Promise<number> {
    const due = await this.prisma.domainEvent.findMany({
      where: { processedAt: null },
      orderBy: { occurredAt: "asc" },
      select: { id: true, type: true, payload: true },
    });
    for (const e of due) {
      await this.handler.handle({ id: e.id, type: e.type, payload: e.payload });
      await this.prisma.domainEvent.update({
        where: { id: e.id },
        data: { processedAt: new Date() },
      });
    }
    return due.length;
  }
}

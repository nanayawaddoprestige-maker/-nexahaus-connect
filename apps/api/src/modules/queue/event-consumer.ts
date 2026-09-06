import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { Worker, type Job } from "bullmq";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationEventHandler } from "../notifications/notification-event.handler";
import { QUEUE } from "./queue.constants";
import { QueueService } from "./queue.service";

interface DomainEventJob {
  eventId: string;
  type: string;
  payload: unknown;
}

/**
 * BullMQ consumer for the domain-event queue. Created only when WORKER_ENABLED
 * (dev, or the dedicated worker process). Retries and backoff are BullMQ's;
 * exhausted jobs land in the queue's failed set and are logged for triage.
 */
@Injectable()
export class EventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumer.name);
  private worker?: Worker;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly queue: QueueService,
    private readonly prisma: PrismaService,
    private readonly handler: NotificationEventHandler,
  ) {}

  onModuleInit(): void {
    if (!this.config.worker.enabled) {
      this.logger.log("WORKER_ENABLED=false — not starting the domain-event consumer");
      return;
    }
    this.worker = new Worker<DomainEventJob>(
      QUEUE.DOMAIN_EVENT,
      async (job: Job<DomainEventJob>) => {
        await this.handler.handle({
          id: job.data.eventId,
          type: job.data.type,
          payload: job.data.payload,
        });
      },
      {
        connection: this.queue.connection,
        prefix: this.queue.prefix,
        concurrency: 8,
      },
    );

    this.worker.on("failed", (job, err) => {
      this.logger.warn(
        { jobId: job?.id, eventId: job?.data.eventId, attemptsMade: job?.attemptsMade, err: err.message },
        "domain-event job failed",
      );
      if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        void this.prisma.domainEvent
          .update({
            where: { id: job.data.eventId },
            data: { lastError: `queue: ${err.message.slice(0, 400)}` },
          })
          .catch(() => undefined);
      }
    });
    this.worker.on("error", (err) => this.logger.error({ err }, "domain-event worker error"));
    this.logger.log("domain-event consumer started");
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}

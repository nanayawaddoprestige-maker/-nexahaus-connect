import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
} from "@nestjs/common";
import { Queue, type JobsOptions } from "bullmq";
import IORedis, { type Redis } from "ioredis";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";
import { QUEUE, type QueueName } from "./queue.constants";

const DEFAULT_JOB_OPTS: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 7 * 86_400 },
};

/**
 * Owns the BullMQ producer connection and one Queue per name. Consumers live in
 * their own providers (see EventConsumer) and are only created when
 * WORKER_ENABLED — an API-only instance produces jobs but does not process them.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  readonly connection: Redis;
  readonly prefix: string;
  private readonly queues = new Map<QueueName, Queue>();

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.prefix = config.worker.queuePrefix;
    this.connection = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    for (const name of Object.values(QUEUE)) {
      this.queues.set(
        name,
        new Queue(name, { connection: this.connection, prefix: this.prefix }),
      );
    }
  }

  async publish(
    name: QueueName,
    jobName: string,
    data: Record<string, unknown>,
    opts?: JobsOptions,
  ): Promise<void> {
    const queue = this.queues.get(name);
    if (!queue) throw new Error(`Unknown queue ${name}`);
    await queue.add(jobName, data, { ...DEFAULT_JOB_OPTS, ...opts });
  }

  /** Bulk enqueue — used by the outbox poller. */
  async publishMany(
    name: QueueName,
    jobs: { name: string; data: Record<string, unknown>; opts?: JobsOptions }[],
  ): Promise<void> {
    if (jobs.length === 0) return;
    const queue = this.queues.get(name);
    if (!queue) throw new Error(`Unknown queue ${name}`);
    await queue.addBulk(
      jobs.map((j) => ({
        name: j.name,
        data: j.data,
        opts: { ...DEFAULT_JOB_OPTS, ...j.opts },
      })),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    await this.connection.quit().catch(() => undefined);
    this.logger.log("Queue connection closed");
  }
}

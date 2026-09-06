import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { loadConfig } from "@nexahaus/config";
import { AppModule } from "./app.module";

/**
 * Background worker entrypoint. Runs the same DI container as the API but starts
 * no HTTP listener. It owns:
 *  - the BullMQ domain-event consumer (EventConsumer, when WORKER_ENABLED)
 *  - the outbox relay + daily reminder cron (when DISABLE_SCHEDULERS is not set)
 *
 * Production topology: run the API with WORKER_ENABLED=false and
 * DISABLE_SCHEDULERS=true, and one or more workers with the defaults.
 */
async function bootstrapWorker(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  // eslint-disable-next-line no-console
  console.error(
    `NexaHaus Connect worker started — consumer=${config.worker.enabled} ` +
      `schedulers=${!config.worker.disableSchedulers}`,
  );
}

void bootstrapWorker();

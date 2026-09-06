import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

/**
 * Background worker entrypoint. Runs the same DI container as the API but starts
 * no HTTP listener — BullMQ queue processors (notifications, documents, finance,
 * scheduling, scoring) are registered by their feature modules and begin
 * consuming once the context is initialised.
 *
 * Queue processors are added from Phase 5 onward; today this just boots cleanly.
 */
async function bootstrapWorker(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  // eslint-disable-next-line no-console
  console.error("NexaHaus Connect worker started");
}

void bootstrapWorker();

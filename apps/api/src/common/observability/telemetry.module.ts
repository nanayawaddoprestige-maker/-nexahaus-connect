import { Global, Injectable, Module, type OnApplicationShutdown } from "@nestjs/common";
import { stopTelemetry } from "../../instrumentation";

/**
 * Flushes Sentry and shuts down the OpenTelemetry SDK when Nest receives a
 * termination signal, so in-flight events/spans are exported before exit.
 * `startTelemetry()` already ran at import time in main.ts / worker.ts.
 */
@Injectable()
class TelemetryLifecycle implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await stopTelemetry();
  }
}

@Global()
@Module({ providers: [TelemetryLifecycle] })
export class TelemetryModule {}

/**
 * Observability bootstrap — Sentry (errors + perf) and OpenTelemetry (traces).
 *
 * This module MUST be the first application import in main.ts / worker.ts, ahead
 * of `@nestjs/core` and any database/redis client, so OpenTelemetry can patch
 * `http`, `express`, `pg` and `ioredis` before they are required.
 *
 * Both stacks are strictly opt-in and add zero overhead when unconfigured:
 *   - Sentry starts only when SENTRY_DSN is set.
 *   - OpenTelemetry starts only when OTEL_EXPORTER_OTLP_ENDPOINT is set.
 *
 * Privacy (docs/COMPLIANCE.md — Data Protection Act 843): request bodies,
 * cookies and auth headers are stripped from every event before it leaves the
 * process; `sendDefaultPii` is off.
 */
import * as Sentry from "@sentry/node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { loadConfig } from "@nexahaus/config";

const config = loadConfig();
const release = config.monitoring.release || undefined;

let otelSdk: NodeSDK | undefined;
let started = false;

export function startTelemetry(): void {
  if (started) return;
  started = true;

  if (config.monitoring.sentryDsn) {
    Sentry.init({
      dsn: config.monitoring.sentryDsn,
      environment: config.env,
      release,
      tracesSampleRate: config.monitoring.sentryTracesSampleRate,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request) {
          delete event.request.data;
          delete event.request.cookies;
          const ua = event.request.headers?.["user-agent"];
          event.request.headers = ua ? { "user-agent": ua } : undefined;
          if (event.request.query_string) delete event.request.query_string;
        }
        return event;
      },
    });
  }

  if (config.monitoring.otelEndpoint) {
    otelSdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: config.monitoring.otelServiceName,
        [ATTR_SERVICE_VERSION]: release ?? "0.0.0",
        "deployment.environment": config.env,
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${config.monitoring.otelEndpoint.replace(/\/$/, "")}/v1/traces`,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          // Noisy and low-signal for a web service.
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });
    otelSdk.start();
  }
}

export async function stopTelemetry(): Promise<void> {
  try {
    await otelSdk?.shutdown();
  } catch {
    /* shutting down — best effort */
  }
  try {
    await Sentry.close(2_000);
  } catch {
    /* best effort */
  }
}

// Self-start on import so instrumentation is in place before Nest boots.
startTelemetry();

export { Sentry };

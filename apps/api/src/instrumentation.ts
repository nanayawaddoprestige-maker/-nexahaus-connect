/**
 * Observability bootstrap — Sentry (errors + perf) and OpenTelemetry (traces).
 *
 * `startTelemetry()` is awaited at the very top of bootstrap() in main.ts /
 * worker.ts, before Nest and any DB/Redis client are created, so OpenTelemetry
 * auto-instrumentation can patch `http`, `express`, `pg` and `ioredis`.
 *
 * Both stacks are strictly opt-in and add zero cost when unconfigured:
 *   - Sentry loads + starts only when SENTRY_DSN is set.
 *   - OpenTelemetry loads + starts only when OTEL_EXPORTER_OTLP_ENDPOINT is set.
 * The heavy SDKs are imported dynamically so a process (or a test run) that
 * doesn't use them never pulls them in.
 *
 * Privacy (docs/COMPLIANCE.md — Data Protection Act 843): request bodies,
 * cookies, query strings and all headers except user-agent are stripped from
 * every event before it leaves the process; `sendDefaultPii` is off.
 */
import { loadConfig } from "@nexahaus/config";

type SentryLike = {
  captureException: (e: unknown, hint?: unknown) => void;
  close: (timeoutMs?: number) => Promise<boolean>;
};

let sentry: SentryLike | undefined;
let otelSdk: { shutdown: () => Promise<void> } | undefined;
let started = false;

export async function startTelemetry(): Promise<void> {
  if (started) return;
  started = true;
  const config = loadConfig();
  const release = config.monitoring.release || undefined;

  if (config.monitoring.sentryDsn) {
    const Sentry = (await import("@sentry/node")) as unknown as SentryLike & {
      init: (o: Record<string, unknown>) => void;
    };
    Sentry.init({
      dsn: config.monitoring.sentryDsn,
      environment: config.env,
      release,
      tracesSampleRate: config.monitoring.sentryTracesSampleRate,
      sendDefaultPii: false,
      beforeSend(event: unknown) {
        const e = event as { request?: Record<string, unknown> };
        const req = e.request;
        if (req) {
          delete req.data;
          delete req.cookies;
          delete req.query_string;
          const headers = req.headers as Record<string, string> | undefined;
          const ua = headers?.["user-agent"];
          req.headers = ua ? { "user-agent": ua } : undefined;
        }
        return event;
      },
    });
    sentry = Sentry;
  }

  if (config.monitoring.otelEndpoint) {
    const [
      { NodeSDK },
      { OTLPTraceExporter },
      { getNodeAutoInstrumentations },
      resources,
      sc,
    ] = await Promise.all([
      import("@opentelemetry/sdk-node"),
      import("@opentelemetry/exporter-trace-otlp-http"),
      import("@opentelemetry/auto-instrumentations-node"),
      import("@opentelemetry/resources"),
      import("@opentelemetry/semantic-conventions"),
    ]);
    const sdk = new NodeSDK({
      resource: new resources.Resource({
        [sc.ATTR_SERVICE_NAME]: config.monitoring.otelServiceName,
        [sc.ATTR_SERVICE_VERSION]: release ?? "0.0.0",
        "deployment.environment": config.env,
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${config.monitoring.otelEndpoint.replace(/\/$/, "")}/v1/traces`,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });
    sdk.start();
    otelSdk = sdk;
  }
}

/** No-op until Sentry has been initialised. Safe to call from anywhere. */
export function captureException(err: unknown, hint?: unknown): void {
  sentry?.captureException(err, hint);
}

export async function stopTelemetry(): Promise<void> {
  try {
    await otelSdk?.shutdown();
  } catch {
    /* best effort on shutdown */
  }
  try {
    await sentry?.close(2_000);
  } catch {
    /* best effort */
  }
}

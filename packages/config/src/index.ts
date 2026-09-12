import { envSchema, type RawEnv } from "./env.schema.js";

export { envSchema, type RawEnv } from "./env.schema.js";

export interface AppConfig {
  env: RawEnv["NODE_ENV"];
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  urls: { app: string; api: string };
  api: { port: number };
  logLevel: RawEnv["LOG_LEVEL"];
  locale: { currency: string; locale: string; timezone: string };
  database: { url: string };
  redis: { url: string };
  worker: { enabled: boolean; disableSchedulers: boolean; queuePrefix: string };
  auth: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: number;
    refreshTtl: number;
    argon2: { memoryKib: number; iterations: number; parallelism: number };
    otpTtl: number;
    otpMaxAttempts: number;
    mfaIssuer: string;
  };
  rateLimit: { windowSec: number; max: number; authMax: number };
  storage: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    forcePathStyle: boolean;
    signedUrlTtl: number;
    maxUploadBytes: number;
  };
  malwareScan: { provider: string; endpoint: string };
  email: { provider: string; apiKey: string; from: string };
  sms: { provider: string; apiKey: string; senderId: string };
  whatsapp: { provider: string; apiKey: string };
  push: { provider: string; apiKey: string };
  payments: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    webhookSecret: string;
    callbackUrl: string;
  };
  analytics: { provider: string; apiKey: string; host: string };
  monitoring: {
    sentryDsn: string;
    sentryTracesSampleRate: number;
    otelEndpoint: string;
    otelServiceName: string;
    release: string;
  };
  demo: {
    seed: boolean;
    ownerEmail: string;
    adminEmail: string;
    password: string;
  };
}

let cached: AppConfig | null = null;

/**
 * Parse and validate `process.env` (or a provided source). Throws a readable
 * aggregated error listing every invalid/missing variable. Result is cached.
 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\n` +
        `Check your .env against .env.example.`,
    );
  }

  const e = parsed.data;

  // Cross-field production guards.
  if (e.NODE_ENV === "production") {
    const weak = [
      e.JWT_ACCESS_SECRET,
      e.JWT_REFRESH_SECRET,
      e.PAYMENT_WEBHOOK_SECRET,
    ].some((s) => /change-me/i.test(s));
    if (weak) {
      throw new Error(
        "Refusing to boot in production with a placeholder secret (contains 'change-me').",
      );
    }
    if (e.SEED_DEMO_DATA) {
      throw new Error("SEED_DEMO_DATA must be false in production.");
    }
  }

  cached = {
    env: e.NODE_ENV,
    isProduction: e.NODE_ENV === "production",
    isDevelopment: e.NODE_ENV === "development",
    isTest: e.NODE_ENV === "test",
    urls: { app: e.APP_URL, api: e.API_URL },
    api: { port: e.API_PORT },
    logLevel: e.LOG_LEVEL,
    locale: {
      currency: e.DEFAULT_CURRENCY,
      locale: e.DEFAULT_LOCALE,
      timezone: e.DEFAULT_TIMEZONE,
    },
    database: { url: e.DATABASE_URL },
    redis: { url: e.REDIS_URL },
    worker: {
      enabled: e.WORKER_ENABLED,
      disableSchedulers: e.DISABLE_SCHEDULERS,
      queuePrefix: e.QUEUE_PREFIX,
    },
    auth: {
      accessSecret: e.JWT_ACCESS_SECRET,
      refreshSecret: e.JWT_REFRESH_SECRET,
      accessTtl: e.JWT_ACCESS_TTL,
      refreshTtl: e.JWT_REFRESH_TTL,
      argon2: {
        memoryKib: e.ARGON2_MEMORY_KIB,
        iterations: e.ARGON2_ITERATIONS,
        parallelism: e.ARGON2_PARALLELISM,
      },
      otpTtl: e.OTP_TTL,
      otpMaxAttempts: e.OTP_MAX_ATTEMPTS,
      mfaIssuer: e.MFA_ISSUER,
    },
    rateLimit: {
      windowSec: e.RATE_LIMIT_WINDOW,
      max: e.RATE_LIMIT_MAX,
      authMax: e.AUTH_RATE_LIMIT_MAX,
    },
    storage: {
      endpoint: e.STORAGE_ENDPOINT,
      region: e.STORAGE_REGION,
      bucket: e.STORAGE_BUCKET,
      accessKey: e.STORAGE_ACCESS_KEY,
      secretKey: e.STORAGE_SECRET_KEY,
      forcePathStyle: e.STORAGE_FORCE_PATH_STYLE,
      signedUrlTtl: e.STORAGE_SIGNED_URL_TTL,
      maxUploadBytes: e.STORAGE_MAX_UPLOAD_BYTES,
    },
    malwareScan: {
      provider: e.MALWARE_SCAN_PROVIDER,
      endpoint: e.MALWARE_SCAN_ENDPOINT ?? "",
    },
    email: {
      provider: e.EMAIL_PROVIDER,
      apiKey: e.EMAIL_API_KEY,
      from: e.EMAIL_FROM,
    },
    sms: {
      provider: e.SMS_PROVIDER,
      apiKey: e.SMS_API_KEY,
      senderId: e.SMS_SENDER_ID,
    },
    whatsapp: { provider: e.WHATSAPP_PROVIDER, apiKey: e.WHATSAPP_API_KEY },
    push: { provider: e.PUSH_PROVIDER, apiKey: e.PUSH_API_KEY },
    payments: {
      provider: e.PAYMENT_PROVIDER,
      apiKey: e.PAYMENT_API_KEY,
      apiSecret: e.PAYMENT_API_SECRET,
      webhookSecret: e.PAYMENT_WEBHOOK_SECRET,
      callbackUrl: e.PAYMENT_CALLBACK_URL ?? "",
    },
    analytics: {
      provider: e.ANALYTICS_PROVIDER,
      apiKey: e.ANALYTICS_API_KEY,
      host: e.ANALYTICS_HOST ?? "",
    },
    monitoring: {
      sentryDsn: e.SENTRY_DSN,
      sentryTracesSampleRate: e.SENTRY_TRACES_SAMPLE_RATE,
      otelEndpoint: e.OTEL_EXPORTER_OTLP_ENDPOINT,
      otelServiceName: e.OTEL_SERVICE_NAME,
      release: e.APP_RELEASE,
    },
    demo: {
      seed: e.SEED_DEMO_DATA,
      ownerEmail: e.DEMO_OWNER_EMAIL,
      adminEmail: e.DEMO_ADMIN_EMAIL,
      password: e.DEMO_ACCOUNT_PASSWORD,
    },
  };

  return cached;
}

/** Test helper — clears the memoised config. */
export function resetConfigCache(): void {
  cached = null;
}

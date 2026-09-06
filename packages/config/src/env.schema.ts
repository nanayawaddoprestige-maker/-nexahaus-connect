import { z } from "zod";

/**
 * Runtime environment schema. Every process that boots calls `loadConfig()`
 * (see index.ts), which parses `process.env` against this and THROWS on any
 * missing or invalid value — a misconfigured deploy never serves traffic.
 *
 * Keep this in sync with the repo-root `.env.example`.
 */

const nonEmpty = z.string().min(1);
const secret = z
  .string()
  .min(32, "secrets must be at least 32 characters — generate a long random value");
const port = z.coerce.number().int().positive().max(65535);
const seconds = z.coerce.number().int().positive();
const bytes = z.coerce.number().int().positive();
const bool = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  API_PORT: port.default(4000),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  DEFAULT_CURRENCY: z.string().length(3).default("GHS"),
  DEFAULT_LOCALE: nonEmpty.default("en-GH"),
  DEFAULT_TIMEZONE: nonEmpty.default("Africa/Accra"),

  DATABASE_URL: z.string().url().refine((v) => v.startsWith("postgres"), {
    message: "DATABASE_URL must be a postgres:// connection string",
  }),

  REDIS_URL: z.string().url().refine((v) => v.startsWith("redis"), {
    message: "REDIS_URL must be a redis:// connection string",
  }),

  JWT_ACCESS_SECRET: secret,
  JWT_REFRESH_SECRET: secret,
  JWT_ACCESS_TTL: seconds.default(900),
  JWT_REFRESH_TTL: seconds.default(2_592_000),
  ARGON2_MEMORY_KIB: z.coerce.number().int().min(8192).default(19456),
  ARGON2_ITERATIONS: z.coerce.number().int().min(1).default(2),
  ARGON2_PARALLELISM: z.coerce.number().int().min(1).default(1),
  OTP_TTL: seconds.default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  MFA_ISSUER: nonEmpty.default("NexaHaus Connect"),

  RATE_LIMIT_WINDOW: seconds.default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_REGION: nonEmpty.default("us-east-1"),
  STORAGE_BUCKET: nonEmpty,
  STORAGE_ACCESS_KEY: nonEmpty,
  STORAGE_SECRET_KEY: nonEmpty,
  STORAGE_FORCE_PATH_STYLE: bool.default("true"),
  STORAGE_SIGNED_URL_TTL: seconds.default(300),
  STORAGE_MAX_UPLOAD_BYTES: bytes.default(26_214_400),
  MALWARE_SCAN_PROVIDER: z.enum(["noop", "clamav"]).default("noop"),
  MALWARE_SCAN_ENDPOINT: z.string().url().optional().or(z.literal("")),

  EMAIL_PROVIDER: z
    .enum(["console", "ses", "sendgrid", "postmark"])
    .default("console"),
  EMAIL_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().email(),

  SMS_PROVIDER: z.enum(["console", "generic"]).default("console"),
  SMS_API_KEY: z.string().optional().default(""),
  SMS_SENDER_ID: nonEmpty.default("NexaHaus"),

  WHATSAPP_PROVIDER: z.enum(["noop", "generic"]).default("noop"),
  WHATSAPP_API_KEY: z.string().optional().default(""),

  PUSH_PROVIDER: z.enum(["noop", "expo", "fcm"]).default("noop"),
  PUSH_API_KEY: z.string().optional().default(""),

  PAYMENT_PROVIDER: z.enum(["manual", "generic"]).default("manual"),
  PAYMENT_API_KEY: z.string().optional().default(""),
  PAYMENT_API_SECRET: z.string().optional().default(""),
  PAYMENT_WEBHOOK_SECRET: secret,
  PAYMENT_CALLBACK_URL: z.string().url().optional().or(z.literal("")),

  ANALYTICS_PROVIDER: z.enum(["noop", "posthog"]).default("noop"),
  ANALYTICS_API_KEY: z.string().optional().default(""),
  ANALYTICS_HOST: z.string().url().optional().or(z.literal("")),

  SENTRY_DSN: z.string().optional().default(""),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional().default(""),

  SEED_DEMO_DATA: bool.default("false"),
  DEMO_OWNER_EMAIL: z.string().email().default("owner.demo@nexahaus.example"),
  DEMO_ADMIN_EMAIL: z.string().email().default("admin.demo@nexahaus.example"),
  DEMO_ACCOUNT_PASSWORD: z.string().optional().default(""),
});

export type RawEnv = z.infer<typeof envSchema>;

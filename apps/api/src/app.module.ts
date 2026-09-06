import { randomUUID } from "node:crypto";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { loadConfig } from "@nexahaus/config";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuditModule } from "./audit/audit.module";
import { HealthModule } from "./health/health.module";

const config = loadConfig();

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: config.logLevel,
        genReqId: (req) =>
          (req.headers["x-request-id"] as string | undefined) ?? randomUUID(),
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            'req.body.password',
            'req.body.mfaCode',
            'req.body.code',
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
        transport: config.isProduction
          ? undefined
          : { target: "pino-pretty", options: { singleLine: true } },
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: config.rateLimit.windowSec * 1000,
        limit: config.rateLimit.max,
      },
    ]),
    ConfigModule,
    PrismaModule,
    RedisModule,
    AuditModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

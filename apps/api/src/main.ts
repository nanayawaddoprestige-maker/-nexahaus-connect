import "reflect-metadata";
// Must load before @nestjs/core and any db/redis client so OpenTelemetry can
// patch http/express/pg/ioredis. Inert unless SENTRY_DSN / OTEL endpoint is set.
import "./instrumentation";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import helmet from "helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { loadConfig } from "@nexahaus/config";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { ResponseInterceptor } from "./common/response.interceptor";

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // payment webhook verifies the signature over the raw bytes
    cors: {
      origin: [config.urls.app],
      credentials: true,
    },
  });

  app.useLogger(app.get(Logger));
  // The API returns JSON only; in production it renders no HTML at all (Swagger
  // is dev-only), so lock the CSP right down. Dev keeps CSP off so Swagger UI
  // can load its assets.
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction
        ? {
            useDefaults: false,
            directives: {
              "default-src": ["'none'"],
              "frame-ancestors": ["'none'"],
              "base-uri": ["'none'"],
              "form-action": ["'none'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "same-site" },
      referrerPolicy: { policy: "no-referrer" },
      hsts: { maxAge: 63_072_000, includeSubDomains: true, preload: true },
    }),
  );
  app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
  app.enableShutdownHooks();

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (!config.isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("NexaHaus Connect API")
      .setDescription("Property & asset management platform — REST API (v1)")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      jsonDocumentUrl: "api/docs-json",
    });
  }

  await app.listen(config.api.port);
  // eslint-disable-next-line no-console
  console.error(`NexaHaus Connect API listening on :${config.api.port}`);
}

void bootstrap();

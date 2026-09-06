import "reflect-metadata";
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
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
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

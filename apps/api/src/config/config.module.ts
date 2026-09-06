import { Global, Module } from "@nestjs/common";
import { loadConfig, type AppConfig } from "@nexahaus/config";

export const APP_CONFIG = "APP_CONFIG";

/**
 * Wraps @nexahaus/config so the validated, typed AppConfig can be injected
 * anywhere with `@Inject(APP_CONFIG)`. loadConfig() throws on invalid env, so a
 * misconfigured process fails to boot.
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => loadConfig(),
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}

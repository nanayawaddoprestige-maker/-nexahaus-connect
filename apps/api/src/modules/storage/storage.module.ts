import { Global, Module } from "@nestjs/common";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";
import { StorageService } from "./storage.service";
import { MalwareScanner, NoopMalwareScanner } from "./malware-scanner";

@Global()
@Module({
  providers: [
    StorageService,
    {
      provide: MalwareScanner,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): MalwareScanner => {
        switch (config.malwareScan.provider) {
          // case "clamav": return new ClamAvScanner(config);  // Phase 10
          default:
            return new NoopMalwareScanner(config);
        }
      },
    },
  ],
  exports: [StorageService, MalwareScanner],
})
export class StorageModule {}

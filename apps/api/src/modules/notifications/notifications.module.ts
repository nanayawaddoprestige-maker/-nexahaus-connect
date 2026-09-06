import { Global, Module } from "@nestjs/common";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationEventHandler } from "./notification-event.handler";
import { RecipientResolver } from "./recipient-resolver";
import { OutboxService } from "./outbox.service";
import {
  ConsoleEmailAdapter,
  ConsoleSmsAdapter,
  EmailAdapter,
  NoopPushAdapter,
  NoopWhatsAppAdapter,
  PushAdapter,
  SmsAdapter,
  WhatsAppAdapter,
} from "./channels/channel-adapter";

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationEventHandler,
    RecipientResolver,
    OutboxService,
    {
      provide: EmailAdapter,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): EmailAdapter => new ConsoleEmailAdapter(config),
    },
    { provide: SmsAdapter, useClass: ConsoleSmsAdapter },
    { provide: WhatsAppAdapter, useClass: NoopWhatsAppAdapter },
    { provide: PushAdapter, useClass: NoopPushAdapter },
  ],
  exports: [NotificationsService, NotificationEventHandler],
})
export class NotificationsModule {}

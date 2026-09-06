import { Inject, Injectable, Logger } from "@nestjs/common";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../../config/config.module";

export interface OutboundMessage {
  to: string;
  subject?: string;
  body: string;
  /** Structured data for push payloads / templating. */
  data?: Record<string, unknown>;
}

/**
 * One interface per delivery channel (spec §29, §51). Providers are swapped via
 * env; until a real provider is configured the console adapter logs the message
 * so the whole pipeline — event → recipient resolution → preference check →
 * dispatch — is exercised in development.
 */
export abstract class EmailAdapter {
  abstract send(msg: OutboundMessage): Promise<void>;
}
export abstract class SmsAdapter {
  abstract send(msg: OutboundMessage): Promise<void>;
}
export abstract class WhatsAppAdapter {
  abstract send(msg: OutboundMessage): Promise<void>;
}
export abstract class PushAdapter {
  abstract send(msg: OutboundMessage): Promise<void>;
}

@Injectable()
export class ConsoleEmailAdapter extends EmailAdapter {
  private readonly logger = new Logger("EmailAdapter");
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    super();
  }
  send(msg: OutboundMessage): Promise<void> {
    this.logger.log(
      `EMAIL from ${this.config.email.from} → ${msg.to} :: ${msg.subject ?? "(no subject)"} :: ${msg.body}`,
    );
    return Promise.resolve();
  }
}

@Injectable()
export class ConsoleSmsAdapter extends SmsAdapter {
  private readonly logger = new Logger("SmsAdapter");
  send(msg: OutboundMessage): Promise<void> {
    this.logger.log(`SMS → ${msg.to} :: ${msg.body}`);
    return Promise.resolve();
  }
}

@Injectable()
export class NoopWhatsAppAdapter extends WhatsAppAdapter {
  private readonly logger = new Logger("WhatsAppAdapter");
  send(msg: OutboundMessage): Promise<void> {
    this.logger.debug(`WHATSAPP → ${msg.to} :: ${msg.body} (noop)`);
    return Promise.resolve();
  }
}

@Injectable()
export class NoopPushAdapter extends PushAdapter {
  private readonly logger = new Logger("PushAdapter");
  send(msg: OutboundMessage): Promise<void> {
    this.logger.debug(`PUSH → ${msg.to} :: ${msg.body} (noop)`);
    return Promise.resolve();
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../../config/config.module";

/**
 * A parsed inbound payment event, normalised across providers.
 */
export interface ProviderPaymentEvent {
  /** Provider's own event id — used for idempotency (unique per provider). */
  providerEventId: string;
  /** Provider's payment/transaction reference. */
  providerRef: string;
  amountMinor: bigint;
  currency: string;
  status: "CONFIRMED" | "FAILED" | "REFUNDED";
  occurredAt: Date;
  method: "MOBILE_MONEY" | "BANK_TRANSFER" | "ONLINE" | "OTHER";
  /** Free-text the payer entered — we match it to a lease/charge ref. */
  narration?: string;
  /** Explicit lease reference if the provider passes one through. */
  leaseRef?: string;
}

/**
 * Payment-provider abstraction (spec §15, §55, §81). Credentials come from env;
 * a webhook body is verified against the raw bytes BEFORE parsing. Launch uses
 * `manual`; real Mobile Money / bank adapters land in Phase 9 behind the same
 * interface.
 */
export abstract class PaymentProvider {
  abstract readonly name: string;
  /** Whether this provider delivers webhooks at all. */
  abstract readonly supportsWebhook: boolean;
  abstract verifyWebhook(rawBody: Buffer, signatureHeader: string | undefined): boolean;
  abstract parseEvent(rawBody: Buffer): ProviderPaymentEvent | null;
}

/** Launch provider: payments are entered by a finance officer; no webhooks. */
@Injectable()
export class ManualPaymentProvider extends PaymentProvider {
  readonly name = "manual";
  readonly supportsWebhook = false;
  verifyWebhook(): boolean {
    return false;
  }
  parseEvent(): null {
    return null;
  }
}

/**
 * Generic HMAC-SHA256 webhook provider — a stand-in with the exact security
 * shape a real Ghana MoMo/bank integration needs: `X-Signature: sha256=<hex>`
 * over the raw body, keyed by PAYMENT_WEBHOOK_SECRET.
 */
@Injectable()
export class GenericHmacPaymentProvider extends PaymentProvider {
  readonly name = "generic";
  readonly supportsWebhook = true;
  private readonly secret: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    super();
    this.secret = config.payments.webhookSecret;
  }

  verifyWebhook(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    const provided = signatureHeader.replace(/^sha256=/i, "").trim();
    const expected = createHmac("sha256", this.secret).update(rawBody).digest("hex");
    if (provided.length !== expected.length) return false;
    try {
      return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
    } catch {
      return false;
    }
  }

  parseEvent(rawBody: Buffer): ProviderPaymentEvent | null {
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    } catch {
      return null;
    }
    const eventId = str(body.event_id ?? body.id);
    const ref = str(body.reference ?? body.transaction_ref);
    const amount = body.amount_minor ?? body.amountMinor;
    const currency = str(body.currency) ?? "GHS";
    const statusRaw = str(body.status)?.toUpperCase();
    if (!eventId || !ref || amount == null || !statusRaw) return null;

    const status =
      statusRaw === "SUCCESS" || statusRaw === "CONFIRMED" || statusRaw === "PAID"
        ? "CONFIRMED"
        : statusRaw === "REFUNDED"
          ? "REFUNDED"
          : "FAILED";

    return {
      providerEventId: eventId,
      providerRef: ref,
      amountMinor: BigInt(String(amount)),
      currency,
      status,
      occurredAt: body.occurred_at ? new Date(String(body.occurred_at)) : new Date(),
      method:
        (str(body.channel)?.toUpperCase() as ProviderPaymentEvent["method"]) ??
        "MOBILE_MONEY",
      narration: str(body.narration ?? body.description),
      leaseRef: str(body.lease_ref),
    };
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

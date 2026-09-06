import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, Public, RequirePermission } from "../../common/decorators";
import { AppError } from "../../common/app-error";
import { IntegrationsService } from "./integrations.service";

const whatsappSchema = z
  .object({
    messageId: z.string().min(1).max(200),
    from: z.string().min(6).max(24),
    text: z.string().min(1).max(4000),
  })
  .strict();

const analyticsSchema = z
  .object({
    name: z.string().min(2).max(50),
    props: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

@ApiTags("integrations")
@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  /** Inbound WhatsApp — verified by signature over the raw body. */
  @Public()
  @ApiExcludeEndpoint()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post("whatsapp/webhook")
  @HttpCode(200)
  whatsapp(
    @Req() req: RawBodyRequest<Request>,
  ) {
    const raw = req.rawBody;
    if (!raw) throw AppError.webhookSignatureInvalid();
    const sig = req.header("x-signature");
    if (!this.integrations.verifyWhatsApp(raw, sig)) {
      throw AppError.webhookSignatureInvalid();
    }
    const parsed = whatsappSchema.safeParse(
      (() => {
        try {
          return JSON.parse(raw.toString("utf8")) as unknown;
        } catch {
          return {};
        }
      })(),
    );
    if (!parsed.success) throw AppError.validation("Unparseable WhatsApp payload.");
    return this.integrations.handleWhatsApp(
      {
        providerMsgId: parsed.data.messageId,
        from: parsed.data.from,
        text: parsed.data.text,
      },
      raw,
    );
  }

  @ApiBearerAuth()
  @Get("whatsapp/inbox")
  @RequirePermission("message:read")
  triage() {
    return this.integrations.triageInbox();
  }

  @ApiBearerAuth()
  @Post("analytics/event")
  @HttpCode(202)
  event(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(analyticsSchema)) body: z.infer<typeof analyticsSchema>,
  ) {
    return this.integrations.recordEvent(user, body.name, body.props ?? {});
  }
}

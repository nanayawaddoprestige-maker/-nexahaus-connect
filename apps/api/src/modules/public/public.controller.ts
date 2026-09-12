import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import {
  contactEnquirySchema,
  earlyAccessSchema,
  propertyHealthCheckSchema,
  propertyOwnerSurveySchema,
  propertyRescueSchema,
  surveyResponseSchema,
  type ContactEnquiryInput,
  type EarlyAccessInput,
  type PropertyHealthCheckInput,
  type PropertyOwnerSurveyInput,
  type PropertyRescueInput,
  type SurveyResponseInput,
} from "@nexahaus/validation";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { Public } from "../../common/decorators";
import { PublicService, hashIp } from "./public.service";

/**
 * Unauthenticated marketing endpoints. Rate-limited hard (public abuse surface);
 * every submission records consent. Mounted under /api/v1/public.
 */
@ApiTags("public")
@Public()
@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Controller("public")
export class PublicController {
  constructor(private readonly pub: PublicService) {}

  @Post("property-health-check")
  healthCheck(
    @Body(new ZodValidationPipe(propertyHealthCheckSchema))
    body: PropertyHealthCheckInput,
    @Req() req: Request,
  ) {
    return this.pub.submitHealthCheck(body, hashIp(req.ip));
  }

  @Post("early-access")
  earlyAccess(
    @Body(new ZodValidationPipe(earlyAccessSchema)) body: EarlyAccessInput,
    @Req() req: Request,
  ) {
    return this.pub.registerEarlyAccess(body, hashIp(req.ip));
  }

  @Post("contact")
  contact(
    @Body(new ZodValidationPipe(contactEnquirySchema))
    body: ContactEnquiryInput,
    @Req() req: Request,
  ) {
    return this.pub.submitContact(body, hashIp(req.ip));
  }

  @Post("property-rescue")
  propertyRescue(
    @Body(new ZodValidationPipe(propertyRescueSchema))
    body: PropertyRescueInput,
    @Req() req: Request,
  ) {
    return this.pub.submitPropertyRescue(body, hashIp(req.ip));
  }

  @Post("property-owner-survey")
  propertyOwnerSurvey(
    @Body(new ZodValidationPipe(propertyOwnerSurveySchema))
    body: PropertyOwnerSurveyInput,
    @Req() req: Request,
  ) {
    return this.pub.submitPropertyOwnerSurvey(body, hashIp(req.ip));
  }

  @Get("surveys/:key")
  survey(@Param("key") key: string) {
    return this.pub.getSurvey(key);
  }

  @Post("surveys/:key/respond")
  respond(
    @Param("key") key: string,
    @Body(new ZodValidationPipe(surveyResponseSchema))
    body: SurveyResponseInput,
    @Req() req: Request,
  ) {
    return this.pub.submitSurvey(key, body, hashIp(req.ip));
  }
}

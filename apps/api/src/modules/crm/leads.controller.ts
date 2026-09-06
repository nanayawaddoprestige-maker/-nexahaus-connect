import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import {
  convertLeadSchema,
  createLeadSchema,
  leadActivitySchema,
  listLeadQuery,
  updateLeadSchema,
  type ConvertLeadInput,
  type CreateLeadInput,
  type LeadActivityInput,
  type ListLeadQuery,
  type UpdateLeadInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { LeadsService } from "./leads.service";

@ApiTags("leads")
@ApiBearerAuth()
@Controller("leads")
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @RequirePermission("lead:read")
  list(
    @Query(new ZodValidationPipe(listLeadQuery)) query: ListLeadQuery,
  ) {
    return this.leads.list(query);
  }

  @Get("pipeline")
  @RequirePermission("lead:read")
  pipeline() {
    return this.leads.pipeline();
  }

  @Get("score-config")
  @RequirePermission("lead:read")
  getScoreConfig() {
    return this.leads.getScoreConfig();
  }

  @Put("score-config")
  @RequirePermission("settings:write")
  setScoreConfig(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(z.object({ factors: z.record(z.string(), z.unknown()) }).strict()))
    body: { factors: Record<string, unknown> },
    @Req() req: Request,
  ) {
    return this.leads.setScoreConfig(user, body.factors as never, auditCtxFromRequest(req, user));
  }

  @Get(":id")
  @RequirePermission("lead:read")
  get(@Param("id") id: string) {
    return this.leads.getById(id);
  }

  @Post()
  @RequirePermission("lead:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createLeadSchema)) body: CreateLeadInput,
    @Req() req: Request,
  ) {
    return this.leads.create(user, body, auditCtxFromRequest(req, user));
  }

  @Patch(":id")
  @RequirePermission("lead:write")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateLeadSchema)) body: UpdateLeadInput,
    @Req() req: Request,
  ) {
    return this.leads.update(user, id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/activities")
  @RequirePermission("lead:write")
  addActivity(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(leadActivitySchema)) body: LeadActivityInput,
    @Req() req: Request,
  ) {
    return this.leads.addActivity(user, id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/convert")
  @RequirePermission("lead:convert")
  convert(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(convertLeadSchema)) body: ConvertLeadInput,
    @Req() req: Request,
  ) {
    return this.leads.convert(user, id, body, auditCtxFromRequest(req, user));
  }
}

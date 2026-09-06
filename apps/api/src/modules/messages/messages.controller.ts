import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { MessagesService } from "./messages.service";

const createThreadSchema = z
  .object({
    type: z.enum(["OWNER_NEXAHAUS", "TENANT_NEXAHAUS", "INTERNAL", "MAINTENANCE"]),
    title: z.string().trim().min(2).max(160),
    clientId: z.string().uuid().optional(),
    propertyId: z.string().uuid().optional(),
    subjectRefType: z.string().trim().max(40).optional(),
    subjectRefId: z.string().uuid().optional(),
    participantUserIds: z.array(z.string().uuid()).max(20).optional(),
    firstMessage: z.string().trim().min(1).max(8000),
  })
  .strict();

const postMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(8000),
    attachmentDocumentIds: z.array(z.string().uuid()).max(10).optional(),
  })
  .strict();

@ApiTags("messages")
@ApiBearerAuth()
@Controller("messages")
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get("threads")
  @RequirePermission("message:read")
  listThreads(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("type") type?: string,
    @Query("status") status?: string,
  ) {
    return this.messages.listThreads(user, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      type,
      status,
    });
  }

  @Get("threads/:id")
  @RequirePermission("message:read")
  getThread(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.messages.getThread(user, id);
  }

  @Post("threads")
  @RequirePermission("message:write")
  createThread(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createThreadSchema)) body: z.infer<typeof createThreadSchema>,
    @Req() req: Request,
  ) {
    return this.messages.createThread(user, body, auditCtxFromRequest(req, user));
  }

  @Post("threads/:id/messages")
  @RequirePermission("message:write")
  postMessage(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(postMessageSchema)) body: z.infer<typeof postMessageSchema>,
    @Req() req: Request,
  ) {
    return this.messages.postMessage(
      user,
      id,
      body.body,
      body.attachmentDocumentIds,
      auditCtxFromRequest(req, user),
    );
  }

  @Post("threads/:id/read")
  @HttpCode(200)
  @RequirePermission("message:read")
  markRead(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.messages.markRead(user, id);
  }
}

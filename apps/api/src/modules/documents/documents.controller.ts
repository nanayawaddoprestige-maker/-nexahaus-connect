import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import {
  finalizeUploadSchema,
  listDocumentQuery,
  requestUploadSchema,
  type FinalizeUploadInput,
  type ListDocumentQuery,
  type RequestUploadInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { DocumentsService } from "./documents.service";

@ApiTags("documents")
@ApiBearerAuth()
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermission("document:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listDocumentQuery)) query: ListDocumentQuery,
  ) {
    return this.documents.list(user, query);
  }

  @Post("upload-url")
  @RequirePermission("document:write")
  requestUpload(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(requestUploadSchema)) body: RequestUploadInput,
    @Req() req: Request,
  ) {
    return this.documents.requestUpload(user, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/finalize")
  @RequirePermission("document:write")
  finalize(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(finalizeUploadSchema)) body: FinalizeUploadInput,
    @Req() req: Request,
  ) {
    return this.documents.finalize(user, id, body, auditCtxFromRequest(req, user));
  }

  @Get(":id/download-url")
  @RequirePermission("document:read")
  download(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.documents.downloadUrl(user, id, auditCtxFromRequest(req, user));
  }

  @Get(":id/access-log")
  @RequirePermission("audit:read")
  accessLog(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.documents.accessLog(user, id);
  }
}

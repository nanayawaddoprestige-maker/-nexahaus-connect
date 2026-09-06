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
  createInspectionSchema,
  listInspectionQuery,
  reviewInspectionSchema,
  submitInspectionSchema,
  type CreateInspectionInput,
  type ListInspectionQuery,
  type ReviewInspectionInput,
  type SubmitInspectionInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { InspectionsService } from "./inspections.service";

@ApiTags("inspections")
@ApiBearerAuth()
@Controller("inspections")
export class InspectionsController {
  constructor(private readonly inspections: InspectionsService) {}

  @Get("templates")
  @RequirePermission("inspection:read")
  templates() {
    return this.inspections.templates();
  }

  @Get()
  @RequirePermission("inspection:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listInspectionQuery)) query: ListInspectionQuery,
  ) {
    return this.inspections.list(user, query);
  }

  @Get(":id")
  @RequirePermission("inspection:read")
  @ScopedResource({ type: "inspection", param: "id" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.inspections.getById(user, id);
  }

  @Post()
  @RequirePermission("inspection:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createInspectionSchema)) body: CreateInspectionInput,
    @Req() req: Request,
  ) {
    return this.inspections.create(user, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/submit")
  @RequirePermission("inspection:submit")
  @ScopedResource({ type: "inspection", param: "id" })
  submit(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(submitInspectionSchema)) body: SubmitInspectionInput,
    @Req() req: Request,
  ) {
    return this.inspections.submit(user, id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/review")
  @RequirePermission("inspection:review")
  @ScopedResource({ type: "inspection", param: "id" })
  review(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(reviewInspectionSchema)) body: ReviewInspectionInput,
    @Req() req: Request,
  ) {
    return this.inspections.review(user, id, body, auditCtxFromRequest(req, user));
  }
}

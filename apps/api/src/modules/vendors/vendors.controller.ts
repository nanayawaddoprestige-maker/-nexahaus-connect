import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import {
  createVendorSchema,
  updateVendorSchema,
  type CreateVendorInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { VendorsService } from "./vendors.service";

@ApiTags("vendors")
@ApiBearerAuth()
@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  @RequirePermission("vendor:read")
  list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sort") sort?: string,
    @Query("status") status?: string,
    @Query("category") category?: string,
    @Query("q") q?: string,
  ) {
    return this.vendors.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sort,
      status,
      category,
      q,
    });
  }

  @Get(":id")
  @RequirePermission("vendor:read")
  get(@Param("id") id: string) {
    return this.vendors.getById(id);
  }

  @Post()
  @RequirePermission("vendor:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createVendorSchema)) body: CreateVendorInput,
    @Req() req: Request,
  ) {
    return this.vendors.create(user, body, auditCtxFromRequest(req, user));
  }

  @Patch(":id")
  @RequirePermission("vendor:write")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateVendorSchema))
    body: Partial<CreateVendorInput> & { status?: string },
    @Req() req: Request,
  ) {
    return this.vendors.update(id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/assignments")
  @RequirePermission("vendor:write")
  assign(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(z.object({ propertyId: z.string().uuid() }).strict()))
    body: { propertyId: string },
    @Req() req: Request,
  ) {
    return this.vendors.assignToProperty(
      id,
      body.propertyId,
      auditCtxFromRequest(req, user),
    );
  }
}

import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { Request } from "express";
import {
  createDistributionSchema,
  type CreateDistributionInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { DistributionsService } from "./distributions.service";

@ApiTags("distributions")
@ApiBearerAuth()
@Controller("distributions")
export class DistributionsController {
  constructor(private readonly distributions: DistributionsService) {}

  @Get()
  @RequirePermission("distribution:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("clientId") clientId?: string,
    @Query("status") status?: string,
  ) {
    return this.distributions.list(user, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      clientId,
      status,
    });
  }

  @Get(":id")
  @RequirePermission("distribution:read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.distributions.getById(user, id);
  }

  @Post()
  @RequirePermission("distribution:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createDistributionSchema))
    body: CreateDistributionInput,
    @Req() req: Request,
  ) {
    return this.distributions.create(
      user,
      body,
      auditCtxFromRequest(req, user),
    );
  }

  @Post(":id/approve")
  @RequirePermission("distribution:write")
  approve(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.distributions.approve(user, id, auditCtxFromRequest(req, user));
  }

  @Post(":id/pay")
  @RequirePermission("distribution:write")
  pay(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(
      new ZodValidationPipe(
        z.object({ reference: z.string().trim().max(120).optional() }).strict(),
      ),
    )
    body: { reference?: string },
    @Req() req: Request,
  ) {
    return this.distributions.pay(
      user,
      id,
      body.reference,
      auditCtxFromRequest(req, user),
    );
  }
}

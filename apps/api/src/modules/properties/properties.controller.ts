import {
  Body,
  Controller,
  Delete,
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
  assignManagerSchema,
  createPropertySchema,
  listPropertyQuery,
  managementAgreementSchema,
  updatePropertySchema,
  type CreatePropertyInput,
  type ListPropertyQuery,
  type UpdatePropertyInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import type { FinancePeriod } from "../finance/period.util";
import { PropertiesService } from "./properties.service";

const ownersSchema = z
  .object({
    owners: z
      .array(
        z.object({
          clientId: z.string().uuid(),
          sharePercent: z.number().gt(0).lte(100),
          isPrimary: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(20),
  })
  .strict();

@ApiTags("properties")
@ApiBearerAuth()
@Controller("properties")
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  @RequirePermission("property:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listPropertyQuery)) query: ListPropertyQuery,
  ) {
    return this.properties.list(user, query);
  }

  @Get(":id")
  @RequirePermission("property:read")
  @ScopedResource({ type: "property", param: "id" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.properties.getById(user, id);
  }

  @Get(":id/financials")
  @RequirePermission("property:read")
  @ScopedResource({ type: "property", param: "id" })
  financials(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Query("period") period: FinancePeriod = "this_month",
  ) {
    return this.properties.getFinancials(user, id, period);
  }

  @Post()
  @RequirePermission("property:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPropertySchema))
    body: CreatePropertyInput,
    @Req() req: Request,
  ) {
    return this.properties.create(user, body, auditCtxFromRequest(req, user));
  }

  @Patch(":id")
  @RequirePermission("property:write")
  @ScopedResource({ type: "property", param: "id" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePropertySchema))
    body: UpdatePropertyInput,
    @Req() req: Request,
  ) {
    return this.properties.update(
      user,
      id,
      body,
      auditCtxFromRequest(req, user),
    );
  }

  @Post(":id/agreement")
  @RequirePermission("agreement:write")
  @ScopedResource({ type: "property", param: "id" })
  setAgreement(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(managementAgreementSchema))
    body: z.infer<typeof managementAgreementSchema>,
    @Req() req: Request,
  ) {
    return this.properties.setAgreement(
      user,
      id,
      body as never,
      auditCtxFromRequest(req, user),
    );
  }

  @Post(":id/assignments")
  @RequirePermission("property:assign")
  @ScopedResource({ type: "property", param: "id" })
  assignManager(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(assignManagerSchema))
    body: z.infer<typeof assignManagerSchema>,
    @Req() req: Request,
  ) {
    return this.properties.assignManager(
      user,
      id,
      body,
      auditCtxFromRequest(req, user),
    );
  }

  @Delete(":id/assignments/:assignmentId")
  @RequirePermission("property:assign")
  @ScopedResource({ type: "property", param: "id" })
  endAssignment(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("assignmentId") assignmentId: string,
    @Req() req: Request,
  ) {
    return this.properties.endAssignment(
      user,
      id,
      assignmentId,
      auditCtxFromRequest(req, user),
    );
  }

  @Post(":id/owners")
  @RequirePermission("property:write")
  @ScopedResource({ type: "property", param: "id" })
  setOwners(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ownersSchema))
    body: z.infer<typeof ownersSchema>,
    @Req() req: Request,
  ) {
    return this.properties.setOwners(
      user,
      id,
      body.owners,
      auditCtxFromRequest(req, user),
    );
  }
}

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
import type { Request } from "express";
import {
  advanceOnboardingSchema,
  clientContactSchema,
  createClientSchema,
  inviteClientUserSchema,
  listClientQuery,
  updateClientSchema,
  type ClientContactInput,
  type CreateClientInput,
  type InviteClientUserInput,
  type ListClientQuery,
  type UpdateClientInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { ClientsService } from "./clients.service";

@ApiTags("clients")
@ApiBearerAuth()
@Controller("clients")
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @RequirePermission("client:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listClientQuery)) query: ListClientQuery,
  ) {
    return this.clients.list(user, query);
  }

  @Get(":id")
  @RequirePermission("client:read")
  @ScopedResource({ type: "client", param: "id" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.clients.getById(user, id);
  }

  @Get(":id/portfolio-summary")
  @RequirePermission("client:read")
  @ScopedResource({ type: "client", param: "id" })
  portfolio(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.clients.portfolioSummary(user, id);
  }

  @Post()
  @RequirePermission("client:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createClientSchema)) body: CreateClientInput,
    @Req() req: Request,
  ) {
    return this.clients.create(user, body, auditCtxFromRequest(req, user));
  }

  @Patch(":id")
  @RequirePermission("client:write")
  @ScopedResource({ type: "client", param: "id" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateClientSchema)) body: UpdateClientInput,
    @Req() req: Request,
  ) {
    return this.clients.update(user, id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/contacts")
  @RequirePermission("client:write")
  @ScopedResource({ type: "client", param: "id" })
  addContact(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(clientContactSchema)) body: ClientContactInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.clients.addContact(id, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/users")
  @RequirePermission("client:write")
  @ScopedResource({ type: "client", param: "id" })
  inviteUser(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(inviteClientUserSchema))
    body: InviteClientUserInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.clients.inviteUser(id, body, auditCtxFromRequest(req, user));
  }

  @Patch(":id/onboarding")
  @RequirePermission("client:onboard")
  @ScopedResource({ type: "client", param: "id" })
  advanceOnboarding(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(advanceOnboardingSchema))
    body: { step: number; kycStatus?: string; agreementAccepted?: boolean },
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.clients.advanceOnboarding(
      id,
      body,
      auditCtxFromRequest(req, user),
    );
  }
}

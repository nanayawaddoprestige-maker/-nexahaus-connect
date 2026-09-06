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
  generateStatementSchema,
  listStatementQuery,
  type GenerateStatementInput,
  type ListStatementQuery,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { StatementsService } from "./statements.service";

@ApiTags("statements")
@ApiBearerAuth()
@Controller("statements")
export class StatementsController {
  constructor(private readonly statements: StatementsService) {}

  @Get()
  @RequirePermission("statement:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listStatementQuery)) query: ListStatementQuery,
  ) {
    return this.statements.list(user, query);
  }

  @Get(":id")
  @RequirePermission("statement:read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.statements.getById(user, id);
  }

  @Post("generate")
  @RequirePermission("statement:generate")
  generate(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(generateStatementSchema)) body: GenerateStatementInput,
    @Req() req: Request,
  ) {
    return this.statements.generate(user, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/issue")
  @RequirePermission("statement:generate")
  issue(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.statements.issue(user, id, auditCtxFromRequest(req, user));
  }
}

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
import { z } from "zod";
import type { Request } from "express";
import {
  createExpenseSchema,
  listExpenseQuery,
  payExpenseSchema,
  type CreateExpenseInput,
  type ListExpenseQuery,
  type PayExpenseInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  CurrentUser,
  RequirePermission,
  ScopedResource,
} from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { ExpensesService } from "./expenses.service";

const decideSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

@ApiTags("expenses")
@ApiBearerAuth()
@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @RequirePermission("expense:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listExpenseQuery)) query: ListExpenseQuery,
  ) {
    return this.expenses.list(user, query);
  }

  @Get(":id")
  @RequirePermission("expense:read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.expenses.getById(user, id);
  }

  @Post()
  @RequirePermission("expense:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createExpenseSchema)) body: CreateExpenseInput,
    @Req() req: Request,
  ) {
    return this.expenses.create(user, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/submit")
  @RequirePermission("expense:write")
  submit(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.expenses.submit(user, id, auditCtxFromRequest(req, user));
  }

  @Post(":id/decision")
  @RequirePermission("expense:approve")
  decide(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(decideSchema)) body: z.infer<typeof decideSchema>,
    @Req() req: Request,
  ) {
    return this.expenses.decide(
      user,
      id,
      body.decision,
      body.note,
      auditCtxFromRequest(req, user),
    );
  }

  @Post(":id/pay")
  @RequirePermission("expense:write")
  pay(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(payExpenseSchema)) body: PayExpenseInput,
    @Req() req: Request,
  ) {
    return this.expenses.pay(user, id, body, auditCtxFromRequest(req, user));
  }
}

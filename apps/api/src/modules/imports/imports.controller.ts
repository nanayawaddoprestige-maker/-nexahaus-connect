import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import {
  createImportSchema,
  type CreateImportInput,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { auditCtxFromRequest } from "../../common/audit-context";
import { ImportsService } from "./imports.service";

@ApiTags("imports")
@ApiBearerAuth()
@Controller("imports")
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Get()
  @RequirePermission("settings:write")
  list() {
    return this.imports.list();
  }

  @Post()
  @RequirePermission("settings:write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createImportSchema)) body: CreateImportInput,
    @Req() req: Request,
  ) {
    return this.imports.create(user, body, auditCtxFromRequest(req, user));
  }

  @Post(":id/commit")
  @RequirePermission("settings:write")
  commit(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Query("allowPartial") allowPartial: string | undefined,
    @Req() req: Request,
  ) {
    return this.imports.commit(
      user,
      id,
      allowPartial === "true",
      auditCtxFromRequest(req, user),
    );
  }

  @Get(":id/errors")
  @RequirePermission("settings:write")
  async errors(@Param("id") id: string, @Res() res: Response): Promise<void> {
    const csv = await this.imports.errorsCsv(id);
    res
      .status(200)
      .setHeader("content-type", "text/csv; charset=utf-8")
      .setHeader(
        "content-disposition",
        `attachment; filename="import-${id}-errors.csv"`,
      )
      .send(csv);
  }
}

import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import type { AuthUser } from "@nexahaus/types";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import type { FinancePeriod } from "../finance/period.util";
import { ReportsService, type TabularReport } from "./reports.service";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("owner/:kind")
  @RequirePermission("report:read")
  async owner(
    @CurrentUser() user: AuthUser,
    @Param("kind") kind: string,
    @Res() res: Response,
    @Query("period") period: FinancePeriod = "this_month",
    @Query("propertyId") propertyId?: string,
    @Query("format") format?: string,
  ): Promise<void> {
    const report = await this.reports.owner(user, kind, period, propertyId);
    this.respond(res, report, format, kind);
  }

  @Get("management/:kind")
  @RequirePermission("analytics:read")
  async management(
    @CurrentUser() user: AuthUser,
    @Param("kind") kind: string,
    @Res() res: Response,
    @Query("period") period: FinancePeriod = "this_month",
    @Query("format") format?: string,
  ): Promise<void> {
    const report = await this.reports.management(user, kind, period);
    this.respond(res, report, format, `management-${kind}`);
  }

  /** CSV bypasses the standard envelope; JSON is wrapped by hand to match it. */
  private respond(
    res: Response,
    report: TabularReport,
    format: string | undefined,
    filename: string,
  ): void {
    if (format === "csv") {
      res
        .status(200)
        .setHeader("content-type", "text/csv; charset=utf-8")
        .setHeader("content-disposition", `attachment; filename="${filename}.csv"`)
        .send(this.reports.toCsv(report));
      return;
    }
    res.status(200).json({
      success: true,
      data: report,
      meta: { requestId: res.getHeader("x-request-id") ?? undefined },
    });
  }
}

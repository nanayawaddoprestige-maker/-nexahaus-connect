import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "@nexahaus/types";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import type { FinancePeriod } from "../finance/period.util";
import { DashboardService } from "./dashboard.service";

@ApiTags("dashboard")
@ApiBearerAuth()
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /** Owner portfolio summary (spec §8). Scoped to the caller's properties. */
  @Get("owner")
  @RequirePermission("owner:portfolio:read")
  ownerSummary(
    @CurrentUser() user: AuthUser,
    @Query("period") period: FinancePeriod = "this_month",
  ) {
    return this.dashboard.ownerSummary(user, period);
  }
}

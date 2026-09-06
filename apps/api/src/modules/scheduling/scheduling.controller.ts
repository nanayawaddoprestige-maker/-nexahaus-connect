import { Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../common/decorators";
import { SchedulingService } from "./scheduling.service";

@ApiTags("scheduling")
@ApiBearerAuth()
@Controller("scheduling")
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  /** Run the daily reminder scan on demand (e.g. after a migration or in tests). */
  @Post("run")
  @HttpCode(200)
  @RequirePermission("settings:write")
  run() {
    return this.scheduling.runNow();
  }
}

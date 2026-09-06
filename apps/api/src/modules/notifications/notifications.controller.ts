import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import type { AuthUser } from "@nexahaus/types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser, RequirePermission } from "../../common/decorators";
import { NotificationsService } from "./notifications.service";

const prefSchema = z
  .object({
    type: z.string().trim().min(2).max(60),
    inApp: z.boolean().optional(),
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    push: z.boolean().optional(),
  })
  .strict();

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermission("notification:read")
  feed(
    @CurrentUser() user: AuthUser,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.notifications.feed(
      user,
      cursor,
      limit ? Math.min(50, Math.max(1, Number(limit))) : 25,
    );
  }

  @Post(":id/read")
  @HttpCode(200)
  @RequirePermission("notification:read")
  markRead(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.notifications.markRead(user, id);
  }

  @Post("read-all")
  @HttpCode(200)
  @RequirePermission("notification:read")
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user);
  }

  @Get("preferences")
  @RequirePermission("notification:read")
  getPreferences(@CurrentUser() user: AuthUser) {
    return this.notifications.getPreferences(user);
  }

  @Put("preferences")
  @RequirePermission("notification:read")
  setPreference(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(prefSchema)) body: z.infer<typeof prefSchema>,
  ) {
    const { type, ...prefs } = body;
    return this.notifications.setPreference(user, type, prefs);
  }
}

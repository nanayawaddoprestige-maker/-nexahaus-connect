import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Redis } from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import { REDIS_CLIENT } from "../redis/redis.module";
import { Public } from "../common/decorators";

@ApiTags("health")
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** Liveness — process is up. No dependency checks. */
  @Public()
  @Get("health")
  health(): { status: "ok"; time: string } {
    return { status: "ok", time: new Date().toISOString() };
  }

  /** Readiness — dependencies reachable. 200 only when all pass. */
  @Public()
  @Get("ready")
  async ready(): Promise<{
    status: "ready" | "degraded";
    checks: Record<string, "up" | "down">;
  }> {
    const [db, redis] = await Promise.all([
      this.prisma.ping(),
      this.redis
        .ping()
        .then((r) => r === "PONG")
        .catch(() => false),
    ]);
    const checks = {
      database: db ? ("up" as const) : ("down" as const),
      redis: redis ? ("up" as const) : ("down" as const),
    };
    const allUp = Object.values(checks).every((c) => c === "up");
    return { status: allUp ? "ready" : "degraded", checks };
  }
}

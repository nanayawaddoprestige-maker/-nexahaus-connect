import { Module } from "@nestjs/common";
import { PropertyHealthController } from "./property-health.controller";
import { PropertyHealthService } from "./property-health.service";

@Module({
  controllers: [PropertyHealthController],
  providers: [PropertyHealthService],
  exports: [PropertyHealthService],
})
export class PropertyHealthModule {}

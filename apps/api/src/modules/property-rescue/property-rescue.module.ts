import { Module } from "@nestjs/common";
import { PropertyRescueController } from "./property-rescue.controller";
import { PropertyRescueService } from "./property-rescue.service";

@Module({
  controllers: [PropertyRescueController],
  providers: [PropertyRescueService],
  exports: [PropertyRescueService],
})
export class PropertyRescueModule {}

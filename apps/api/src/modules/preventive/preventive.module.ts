import { Module } from "@nestjs/common";
import { PreventiveController } from "./preventive.controller";
import { PreventiveService } from "./preventive.service";

@Module({
  controllers: [PreventiveController],
  providers: [PreventiveService],
})
export class PreventiveModule {}

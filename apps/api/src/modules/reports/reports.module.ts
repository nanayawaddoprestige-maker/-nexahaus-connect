import { Global, Module } from "@nestjs/common";
import { PdfService } from "./pdf.service";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";

@Global()
@Module({
  controllers: [ReportsController],
  providers: [PdfService, ReportsService],
  exports: [PdfService, ReportsService],
})
export class ReportsModule {}
